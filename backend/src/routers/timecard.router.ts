import { Router } from "express";
import timecardService from "../services/timecard/timecard.service";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/start", timecardService.start);
router.post("/pause", timecardService.pause);
router.post("/resume", timecardService.resume);
router.post("/stop", timecardService.stop);
router.get("/history", timecardService.history);

export default router;
