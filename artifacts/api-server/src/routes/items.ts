import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import { itemsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateItemBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  try {
    const items = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.userId, userId));
    res.json(items.map(i => ({
      id: i.id,
      name: i.name,
      hsnCode: i.hsnCode,
      rate: parseFloat(i.rate),
      gstPercent: parseFloat(i.gstPercent),
      userId: i.userId,
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: " + parsed.error.message });
    return;
  }
  try {
    const [item] = await db
      .insert(itemsTable)
      .values({
        name: parsed.data.name,
        hsnCode: parsed.data.hsnCode ?? null,
        rate: parsed.data.rate.toString(),
        gstPercent: parsed.data.gstPercent.toString(),
        userId,
      })
      .returning();
    res.status(201).json({
      id: item.id,
      name: item.name,
      hsnCode: item.hsnCode,
      rate: parseFloat(item.rate),
      gstPercent: parseFloat(item.gstPercent),
      userId: item.userId,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [item] = await db
      .select()
      .from(itemsTable)
      .where(and(eq(itemsTable.id, id), eq(itemsTable.userId, userId)))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    res.json({ id: item.id, name: item.name, hsnCode: item.hsnCode, rate: parseFloat(item.rate), gstPercent: parseFloat(item.gstPercent), userId: item.userId });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  try {
    const [item] = await db
      .update(itemsTable)
      .set({
        name: parsed.data.name,
        hsnCode: parsed.data.hsnCode ?? null,
        rate: parsed.data.rate.toString(),
        gstPercent: parsed.data.gstPercent.toString(),
      })
      .where(and(eq(itemsTable.id, id), eq(itemsTable.userId, userId)))
      .returning();
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    res.json({ id: item.id, name: item.name, hsnCode: item.hsnCode, rate: parseFloat(item.rate), gstPercent: parseFloat(item.gstPercent), userId: item.userId });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [deleted] = await db.delete(itemsTable).where(and(eq(itemsTable.id, id), eq(itemsTable.userId, userId))).returning();
    if (!deleted) { res.status(404).json({ error: "Item not found" }); return; }
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
