import { Router } from "express";
import { uploadImage } from "../middlewares/upload.js";
import { listEvidence, createEvidences, getEvidenceByEventController } from "./evidence-controller.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isSecurity } from "../middlewares/role-validator.js";
import {evidenceValidator} from "../middlewares/evidence.js"

const router = Router();

router.get("/",
    validarJWT,
    isSecurity,
    listEvidence
);

router.get("/:event_id",
    validarJWT,
    isSecurity,
    evidenceValidator,
    getEvidenceByEventController
);

router.post("/",
    validarJWT,
    isSecurity,
    uploadImage.array("images", 3),
    evidenceValidator,
    createEvidences
);

export default router;