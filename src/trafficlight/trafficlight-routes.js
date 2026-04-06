import { Router } from "express";
import {
    listTrafficLights,
    createTrafficLight
} from "./trafficlight-controller.js";

const router = Router();

router.get("/", listTrafficLights);
router.post("/", createTrafficLight);

export default router;