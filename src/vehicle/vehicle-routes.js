'use strict';
import { Router } from "express";
import {
    createVehicle,
    listVehicles,
    deleteVehicle
} from "./vehicle-controller.js";

const router = Router();

router.get("/", listVehicles);
router.post("/", createVehicle);
router.delete("/:plate", deleteVehicle);

export default router;