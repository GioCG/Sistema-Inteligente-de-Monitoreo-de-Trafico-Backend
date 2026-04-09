import { Router } from "express";
import {
    createEvents,
    listEvents
} from "./event-controller.js";

const router = Router();

router.get("/", listEvents);
router.post("/", createEvents);

export default router;