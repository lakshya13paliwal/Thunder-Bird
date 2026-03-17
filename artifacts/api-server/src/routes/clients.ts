import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import { clientsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateClientBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  try {
    const clients = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.userId, userId));
    res.json(clients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      gstin: c.gstin,
      address: c.address,
      userId: c.userId,
    })));
  } catch (err) {
    console.error("List clients error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: " + parsed.error.message });
    return;
  }
  try {
    const [client] = await db
      .insert(clientsTable)
      .values({ ...parsed.data, userId })
      .returning();
    res.status(201).json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      gstin: client.gstin,
      address: client.address,
      userId: client.userId,
    });
  } catch (err) {
    console.error("Create client error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.userId, userId)))
      .limit(1);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      gstin: client.gstin,
      address: client.address,
      userId: client.userId,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const [client] = await db
      .update(clientsTable)
      .set(parsed.data)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.userId, userId)))
      .returning();
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      gstin: client.gstin,
      address: client.address,
      userId: client.userId,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(clientsTable)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.userId, userId)))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
