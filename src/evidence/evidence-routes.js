import { Router } from "express";
import {
    listEvidence,
    createEvidences
} from "./evidence-controller.js";

const router = Router();

router.get("/", listEvidence);
router.post("/", createEvidences);

export default router;