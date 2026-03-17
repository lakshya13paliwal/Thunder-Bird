import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import { invoicesTable, invoiceItemsTable, clientsTable } from "@workspace/db/schema";
import { eq, and, lt, ne, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateInvoiceBody, UpdateInvoiceStatusBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TB-${year}-`;
  const result = await db
    .select({ invoiceNumber: invoicesTable.invoiceNumber })
    .from(invoicesTable)
    .where(sql`${invoicesTable.invoiceNumber} LIKE ${prefix + "%"}`)
    .orderBy(desc(invoicesTable.createdAt));

  if (result.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumber = result[0].invoiceNumber;
  const lastSeq = parseInt(lastNumber.replace(prefix, ""), 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

function formatInvoice(inv: any) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    date: inv.date,
    clientId: inv.clientId,
    subtotal: parseFloat(inv.subtotal),
    gstAmount: parseFloat(inv.gstAmount),
    grandTotal: parseFloat(inv.grandTotal),
    status: inv.status,
    dueDate: inv.dueDate,
    userId: inv.userId,
  };
}

router.get("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  try {
    const invoices = await db
      .select({
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        date: invoicesTable.date,
        clientId: invoicesTable.clientId,
        subtotal: invoicesTable.subtotal,
        gstAmount: invoicesTable.gstAmount,
        grandTotal: invoicesTable.grandTotal,
        status: invoicesTable.status,
        dueDate: invoicesTable.dueDate,
        userId: invoicesTable.userId,
        clientName: clientsTable.name,
      })
      .from(invoicesTable)
      .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
      .where(eq(invoicesTable.userId, userId))
      .orderBy(desc(invoicesTable.createdAt));
    
    res.json(invoices.map(inv => ({
      ...formatInvoice(inv),
      clientName: inv.clientName ?? "",
    })));
  } catch (err) {
    console.error("List invoices error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const body = req.body;
  const parsed = CreateInvoiceBody.safeParse({
    ...body,
    date: body.date ? new Date(body.date) : undefined,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: " + parsed.error.message });
    return;
  }

  const { clientId, date, dueDate, lineItems } = parsed.data;

  // Verify client belongs to user
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(and(eq(clientsTable.id, clientId), eq(clientsTable.userId, userId)))
    .limit(1);

  if (!client) {
    res.status(400).json({ error: "Client not found" });
    return;
  }

  // Calculate totals
  let subtotal = 0;
  let gstAmount = 0;
  const items = lineItems.map(li => {
    const amount = li.quantity * li.rate;
    const gst = amount * (li.gstPercent / 100);
    subtotal += amount;
    gstAmount += gst;
    return { ...li, amount };
  });
  const grandTotal = subtotal + gstAmount;

  try {
    const invoiceNumber = await getNextInvoiceNumber();
    const dateStr = date instanceof Date ? date.toISOString().split("T")[0] : String(date);
    const dueDateStr = dueDate instanceof Date ? dueDate.toISOString().split("T")[0] : (dueDate ?? null);
    const [invoice] = await db
      .insert(invoicesTable)
      .values({
        invoiceNumber,
        date: dateStr,
        clientId,
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        status: "Unpaid",
        dueDate: dueDateStr,
        userId,
      })
      .returning();

    const insertedItems = await db
      .insert(invoiceItemsTable)
      .values(items.map(li => ({
        invoiceId: invoice.id,
        description: li.description,
        quantity: li.quantity.toString(),
        rate: li.rate.toString(),
        gstPercent: li.gstPercent.toString(),
        amount: li.amount.toFixed(2),
      })))
      .returning();

    res.status(201).json({
      ...formatInvoice(invoice),
      client: { id: client.id, name: client.name, email: client.email, phone: client.phone, gstin: client.gstin, address: client.address, userId: client.userId },
      lineItems: insertedItems.map(li => ({
        id: li.id,
        invoiceId: li.invoiceId,
        description: li.description,
        quantity: parseFloat(li.quantity),
        rate: parseFloat(li.rate),
        gstPercent: parseFloat(li.gstPercent),
        amount: parseFloat(li.amount),
      })),
    });
  } catch (err) {
    console.error("Create invoice error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, userId)))
      .limit(1);

    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

    const [client] = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.id, invoice.clientId))
      .limit(1);

    const lineItems = await db
      .select()
      .from(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoiceId, id));

    res.json({
      ...formatInvoice(invoice),
      client: client ? { id: client.id, name: client.name, email: client.email, phone: client.phone, gstin: client.gstin, address: client.address, userId: client.userId } : null,
      lineItems: lineItems.map(li => ({
        id: li.id,
        invoiceId: li.invoiceId,
        description: li.description,
        quantity: parseFloat(li.quantity),
        rate: parseFloat(li.rate),
        gstPercent: parseFloat(li.gstPercent),
        amount: parseFloat(li.amount),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const body2 = req.body;
  const parsed = CreateInvoiceBody.safeParse({
    ...body2,
    date: body2.date ? new Date(body2.date) : undefined,
    dueDate: body2.dueDate ? new Date(body2.dueDate) : undefined,
  });
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { clientId, date, dueDate, lineItems } = parsed.data;

  try {
    const [existing] = await db
      .select()
      .from(invoicesTable)
      .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, userId)))
      .limit(1);
    if (!existing) { res.status(404).json({ error: "Invoice not found" }); return; }

    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(eq(clientsTable.id, clientId), eq(clientsTable.userId, userId)))
      .limit(1);
    if (!client) { res.status(400).json({ error: "Client not found" }); return; }

    let subtotal = 0;
    let gstAmount = 0;
    const items = lineItems.map(li => {
      const amount = li.quantity * li.rate;
      const gst = amount * (li.gstPercent / 100);
      subtotal += amount;
      gstAmount += gst;
      return { ...li, amount };
    });
    const grandTotal = subtotal + gstAmount;

    const dateStr2 = date instanceof Date ? date.toISOString().split("T")[0] : String(date);
    const dueDateStr2 = dueDate instanceof Date ? dueDate.toISOString().split("T")[0] : (dueDate ?? null);
    const [invoice] = await db
      .update(invoicesTable)
      .set({
        date: dateStr2,
        clientId,
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        dueDate: dueDateStr2,
      })
      .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, userId)))
      .returning();

    // Delete and re-insert line items
    await db.delete(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));
    const insertedItems = await db
      .insert(invoiceItemsTable)
      .values(items.map(li => ({
        invoiceId: id,
        description: li.description,
        quantity: li.quantity.toString(),
        rate: li.rate.toString(),
        gstPercent: li.gstPercent.toString(),
        amount: li.amount.toFixed(2),
      })))
      .returning();

    res.json({
      ...formatInvoice(invoice),
      client: { id: client.id, name: client.name, email: client.email, phone: client.phone, gstin: client.gstin, address: client.address, userId: client.userId },
      lineItems: insertedItems.map(li => ({
        id: li.id,
        invoiceId: li.invoiceId,
        description: li.description,
        quantity: parseFloat(li.quantity),
        rate: parseFloat(li.rate),
        gstPercent: parseFloat(li.gstPercent),
        amount: parseFloat(li.amount),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [deleted] = await db.delete(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, userId))).returning();
    if (!deleted) { res.status(404).json({ error: "Invoice not found" }); return; }
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/status", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateInvoiceStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid status" }); return; }

  try {
    const [invoice] = await db
      .update(invoicesTable)
      .set({ status: parsed.data.status })
      .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, userId)))
      .returning();
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, invoice.clientId)).limit(1);
    const lineItems = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));

    res.json({
      ...formatInvoice(invoice),
      client: client ? { id: client.id, name: client.name, email: client.email, phone: client.phone, gstin: client.gstin, address: client.address, userId: client.userId } : null,
      lineItems: lineItems.map(li => ({
        id: li.id,
        invoiceId: li.invoiceId,
        description: li.description,
        quantity: parseFloat(li.quantity),
        rate: parseFloat(li.rate),
        gstPercent: parseFloat(li.gstPercent),
        amount: parseFloat(li.amount),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/pdf", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [invoice] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, userId))).limit(1);
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, invoice.clientId)).limit(1);
    const lineItems = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));

    const subtotal = parseFloat(invoice.subtotal);
    const gstAmount = parseFloat(invoice.gstAmount);
    const grandTotal = parseFloat(invoice.grandTotal);
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

    const lineItemsHtml = lineItems.map((li, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${li.description}</td>
        <td style="text-align:right">${parseFloat(li.quantity)}</td>
        <td style="text-align:right">${formatINR(parseFloat(li.rate))}</td>
        <td style="text-align:right">${parseFloat(li.gstPercent)}%</td>
        <td style="text-align:right">${formatINR(parseFloat(li.amount))}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; color: #1a1a2e; background: white; padding: 40px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4f46e5; }
    .brand { font-size: 28px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
    .brand span { color: #fbbf24; }
    .invoice-meta { text-align: right; }
    .invoice-number { font-size: 22px; font-weight: 700; color: #4f46e5; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 6px; }
    .status-Unpaid { background: #fee2e2; color: #dc2626; }
    .status-Partial { background: #fef9c3; color: #ca8a04; }
    .status-Paid { background: #dcfce7; color: #16a34a; }
    .bill-section { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
    .bill-box { flex: 1; }
    .bill-box h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px; }
    .bill-box p { font-size: 13px; line-height: 1.6; }
    .bill-box .client-name { font-weight: 700; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table th { background: #4f46e5; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    table tr:nth-child(even) { background: #f9fafb; }
    .totals { margin-left: auto; width: 320px; }
    .totals table th { background: none; color: #4b5563; font-weight: 600; }
    .totals table td { font-weight: 500; }
    .grand-total-row { background: #4f46e5 !important; }
    .grand-total-row td, .grand-total-row th { color: white !important; font-size: 15px; font-weight: 700; border-bottom: none !important; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px; }
    .gst-note { background: #f0f0ff; border-left: 4px solid #4f46e5; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ThunderBill <span>⚡</span></div>
      <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">GST-Compliant Invoice System</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">${invoice.invoiceNumber}</div>
      <div style="color: #6b7280; margin-top: 4px;">Date: ${invoice.date}</div>
      ${invoice.dueDate ? `<div style="color: #6b7280;">Due: ${invoice.dueDate}</div>` : ""}
      <div class="status-badge status-${invoice.status}">${invoice.status}</div>
    </div>
  </div>

  <div class="bill-section">
    <div class="bill-box">
      <h3>Bill To</h3>
      <p class="client-name">${client?.name ?? ""}</p>
      <p>${client?.email ?? ""}</p>
      <p>${client?.phone ?? ""}</p>
      ${client?.gstin ? `<p>GSTIN: ${client.gstin}</p>` : ""}
      ${client?.address ? `<p>${client.address}</p>` : ""}
    </div>
    <div class="bill-box" style="text-align: right;">
      <h3>Invoice Details</h3>
      <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Date:</strong> ${invoice.date}</p>
      ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${invoice.dueDate}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Rate</th>
        <th style="text-align:right">GST%</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <div style="display: flex; justify-content: flex-end;">
    <div class="totals">
      <table>
        <tbody>
          <tr>
            <th style="text-align:left">Subtotal</th>
            <td style="text-align:right">${formatINR(subtotal)}</td>
          </tr>
          <tr>
            <th style="text-align:left">CGST</th>
            <td style="text-align:right">${formatINR(cgst)}</td>
          </tr>
          <tr>
            <th style="text-align:left">SGST</th>
            <td style="text-align:right">${formatINR(sgst)}</td>
          </tr>
          <tr class="grand-total-row">
            <th style="text-align:left; padding: 12px;">Grand Total</th>
            <td style="text-align:right; padding: 12px;">${formatINR(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="gst-note" style="margin-top: 20px;">
    <strong>GST Breakdown:</strong> Subtotal ${formatINR(subtotal)} + CGST ${formatINR(cgst)} + SGST ${formatINR(sgst)} = <strong>${formatINR(grandTotal)}</strong>
  </div>

  <div class="footer">
    <p>Thank you for your business! Generated by <strong>ThunderBill ⚡</strong></p>
    <p style="margin-top: 4px;">This is a computer-generated invoice.</p>
  </div>
</body>
</html>`;

    // Return HTML as PDF-like response (using HTML for in-browser rendering and printing)
    // Browser's print-to-PDF works reliably without native PDF dependencies
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${invoice.invoiceNumber}.html"`);
    res.send(html);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

export default router;
