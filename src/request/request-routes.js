'use strict';
import { Router } from "express";
import {
    requestRegisterVehicle,
    requestClaimVehicle,
    listRequests,
    resolveRequest,
    myRequests
} from "./request-controller.js";

import {
    requestRegisterVehicleValidator,
    requestClaimVehicleValidator,
    resolveRequestValidator,
    listRequestsValidator
} from "../middlewares/request.js";

import { validarJWT } from "../middlewares/jwt-validator.js";
import { isOperator } from "../middlewares/role-validator.js";

const router = Router();

// ── Ciudadano ──────────────────────────────────────────────────
router.post("/register-vehicle",
    validarJWT,
    requestRegisterVehicleValidator,
    requestRegisterVehicle
);

router.post("/claim-vehicle",
    validarJWT,
    requestClaimVehicleValidator,
    requestClaimVehicle
);

router.get("/my-requests",
    validarJWT,
    myRequests
);

// ── Operador / Admin ───────────────────────────────────────────
router.get("/",
    validarJWT,
    isOperator,
    listRequestsValidator,
    listRequests
);

router.put("/:id/resolve",
    validarJWT,
    isOperator,
    resolveRequestValidator,
    resolveRequest
);

export default router;