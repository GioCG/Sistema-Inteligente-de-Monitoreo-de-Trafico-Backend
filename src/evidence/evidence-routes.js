import { Router } from "express";
import {
    listEvidence,
    createEvidence
} from "./evidence-controller.js";

const router = Router();

router.get("/", listEvidence);
router.post("/", createEvidence);

export default router;