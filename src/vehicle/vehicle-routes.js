'use strict';
import { Router } from "express";
import {
    createVehicles,
    listVehicles,
    deleteVehicles
} from "./vehicle-controller.js";

const router = Router();

router.get("/", listVehicles);
router.post("/", createVehicles);
router.delete("/:plate", deleteVehicles);

export default router;