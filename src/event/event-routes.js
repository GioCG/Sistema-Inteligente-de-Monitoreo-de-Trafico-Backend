import { Router } from "express";
import {
    createEvent,
    listEvents
} from "./event-controller.js";

const router = Router();

router.get("/", listEvents);
router.post("/", createEvent);

export default router;