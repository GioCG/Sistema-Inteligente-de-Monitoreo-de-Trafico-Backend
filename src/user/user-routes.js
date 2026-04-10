'use strict';
import { Router } from "express";
import {
    listUser,
    updateUser,
    updatePassword
} from "./user-controller.js";


import {
    updateUserValidator,
    updatePasswordValidator,
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



export default router;