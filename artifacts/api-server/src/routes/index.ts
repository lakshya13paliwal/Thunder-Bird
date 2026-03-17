import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import clientsRouter from "./clients";
import itemsRouter from "./items";
import invoicesRouter from "./invoices";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/clients", clientsRouter);
router.use("/items", itemsRouter);
router.use("/invoices", invoicesRouter);
router.use("/dashboard", dashboardRouter);

export default router;
