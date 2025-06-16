import { Router } from "express";
import multer from "multer";
import receiptService from "../services/receipt/receipt.service";
import { authMiddleware } from "../middlewares/auth.middleware";

const receiptRouter = Router();
const upload = multer({
    storage: multer.diskStorage({
        destination: "./uploads",
        filename(req, file, callback) {
            const uniqueName = `${Date.now()}-${file.originalname}`;
            callback(null, uniqueName);
        },
    }),
});

receiptRouter.post("/parse", authMiddleware, upload.single("receipt"), receiptService.parseReceipt);

receiptRouter.get("/temp-receipts", authMiddleware, receiptService.getAllTempReceipts);

export default receiptRouter;
