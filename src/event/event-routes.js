import { Router } from "express";
import { createEvents, getEventsByUser, listEvents } from "./event-controller.js";
import { userExists } from "../middlewares/user-validator.js";
import { eventValidator, getEventsByUserValidator } from "../middlewares/event-validator.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isOperator, isSecurity } from "../middlewares/role-validator.js";

const router = Router();

router.get("/",
    validarJWT,
    isSecurity,
    listEvents
);

router.post("/",
    validarJWT,
    isOperator,
    eventValidator,
    createEvents
);

router.get("/:dpi",
    validarJWT,
    isSecurity,
    getEventsByUserValidator,
    userExists,
    getEventsByUser
);

export default router;