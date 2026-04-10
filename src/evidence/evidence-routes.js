import { Router } from "express";
import { uploadImage } from "../middlewares/upload.js";
import { listEvidence, createEvidences, getEvidenceByEventController } from "./evidence-controller.js";

const router = Router();

router.get("/", listEvidence);
router.get("/:event_id", getEvidenceByEventController)
router.post("/" , 
    uploadImage.array("images", 3), 
    createEvidences
);

export default router;