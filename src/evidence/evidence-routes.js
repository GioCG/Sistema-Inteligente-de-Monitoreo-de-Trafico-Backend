import { Router } from "express";
import { uploadImage } from "../middlewares/upload.js";
import { listEvidence, createEvidences, getEvidenceByEventController, deleteEvidenceController } from "./evidence-controller.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isSecurity, isSecurityOrOperator, isOperator } from "../middlewares/role-validator.js";
import { evidenceCreateValidator, evidenceParamValidator, evidenceDeleteValidator } from "../middlewares/evidence.js";

const router = Router();

router.get("/",
    validarJWT,
    isSecurityOrOperator,
    listEvidence
);

router.get("/:event_id",
    validarJWT,
    isSecurityOrOperator,
    evidenceParamValidator,
    getEvidenceByEventController
);

router.post("/",
    validarJWT,
    isSecurityOrOperator,
    uploadImage.array("images", 3),
    evidenceCreateValidator,
    createEvidences
);

router.delete("/:id",
    validarJWT,
    isOperator,
    evidenceDeleteValidator,
    deleteEvidenceController
);

export default router;
