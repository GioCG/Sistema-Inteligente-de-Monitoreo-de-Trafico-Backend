'use strict';
import { Router } from "express";
import {
    listUser,
    updateUser,
    updatePassword,
    deleteUser
} from "./user-controller.js";

import {
    updateUserValidator,
    updatePasswordValidator,
    deleteUserValidator,
    isSameUser 
  } from "../middlewares/user-validator.js";

const router = Router();

router.get("/", listUser);

router.put(
    "/:dpi",
    isSameUser,
    updateUserValidator,
    updateUser
);

router.put(
    "/password/:dpi",
    isSameUser,
    updatePasswordValidator,
    updatePassword
);

router.delete(
    "/:dpi",
    isSameUser,
    deleteUserValidator,
    deleteUser
);

export default router;