import { Router } from "express";
import {
    createEvents,
    getEventsByUser,
    listEvents
} from "./event-controller.js";

import {
    userExists,
}from "../middlewares/user-validator.js"

import {
    eventValidator,
    getEventsByUserValidator,
} from "../middlewares/event-validator.js"
const router = Router();


router.get("/", 
    listEvents
);
router.post("/", 
    eventValidator,
    createEvents
);
router.get("/:dpi", 
    getEventsByUserValidator,
    userExists,
    getEventsByUser
);

export default router;