'use strict';
import { Router } from "express";
import { listUser, updateUser, updatePassword } from "./user-controller.js";
import { updateUserValidator, updatePasswordValidator, isSameUser } from "../middlewares/user-validator.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isOperator } from "../middlewares/role-validator.js";

const router = Router();

router.get("/",
    validarJWT,
    isOperator,
    listUser
);

router.put("/:dpi",
    validarJWT,
    isSameUser,
    updateUserValidator,
    updateUser
);

router.put("/password/:dpi",
    validarJWT,
    isSameUser,
    updatePasswordValidator,
    updatePassword
);

export default router;