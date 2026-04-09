import { Router } from "express";
import {
    listTrafficLights,
    createTrafficLights
} from "./trafficlight-controller.js";

const router = Router();

router.get("/", listTrafficLights);
router.post("/", createTrafficLights);

export default router;