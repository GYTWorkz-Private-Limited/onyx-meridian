import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enterpriseRouter from "./enterprise";
import businessUnitsRouter from "./business-units";
import agentsRouter from "./agents";
import tasksRouter from "./tasks";
import intelligenceRouter from "./intelligence";
import governanceRouter from "./governance";
import outcomesRouter from "./outcomes";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/enterprise", enterpriseRouter);
router.use("/business-units", businessUnitsRouter);
router.use("/agents", agentsRouter);
router.use("/tasks", tasksRouter);
router.use("/intelligence", intelligenceRouter);
router.use("/governance", governanceRouter);
router.use("/outcomes", outcomesRouter);

export default router;
