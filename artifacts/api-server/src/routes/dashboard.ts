import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import { invoicesTable, clientsTable } from "@workspace/db/schema";
import { eq, and, lt, ne, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;

  try {
    const today = new Date().toISOString().split("T")[0];

    // All invoices for this user
    const allInvoices = await db
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

    let totalDue = 0;
    let totalPaid = 0;
    let overdueCount = 0;

    for (const inv of allInvoices) {
      const amount = parseFloat(inv.grandTotal);
      if (inv.status !== "Paid") {
        totalDue += amount;
        if (inv.dueDate && inv.dueDate < today) {
          overdueCount++;
        }
      } else {
        totalPaid += amount;
      }
    }

    const recentInvoices = allInvoices.slice(0, 5).map(inv => ({
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
      clientName: inv.clientName ?? "",
    }));

    res.json({
      totalDue,
      overdueCount,
      recentInvoices,
      totalPaid,
      totalInvoices: allInvoices.length,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
