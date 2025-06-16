import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import recordService from "../services/record/record.service";

const recordRouter = Router();

recordRouter.post("/", authMiddleware, recordService.createReceipt);

recordRouter.put("/", authMiddleware, recordService.updateRecord);

// GET /records/?year=2023&month=10
recordRouter.get("/", authMiddleware, recordService.getMonthlyRecords);

export default recordRouter;
