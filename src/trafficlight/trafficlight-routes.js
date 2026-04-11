import { Router } from "express";
import { listTrafficLights, createTrafficLights } from "./trafficlight-controller.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isOperator, isSecurity } from "../middlewares/role-validator.js";
import {trafficLightValidator} from "../middlewares/trafficlight.js"
const router = Router();

router.get("/",
    validarJWT,
    isSecurity,
    listTrafficLights
);

router.post("/",
    validarJWT,
    isOperator,
    trafficLightValidator,
    createTrafficLights
);

export default router;