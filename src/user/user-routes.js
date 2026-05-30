'use strict';
import { Router } from "express";
import { listUser, getUser, updateUser, updatePassword, listRoles, updateUserRole, updateProfile } from "./user-controller.js";
import { updateUserValidator, updatePasswordValidator, isSameUser } from "../middlewares/user-validator.js";
import { validarJWT } from "../middlewares/jwt-validator.js";
import { isAdmin, isOperator } from "../middlewares/role-validator.js";

const router = Router();

router.get("/",
    validarJWT,
    isOperator,
    listUser
);

router.get("/roles",
    validarJWT,
    isAdmin,
    listRoles
);

router.patch("/:dpi/role",
    validarJWT,
    isAdmin,
    updateUserRole
);

router.get("/:dpi",
    validarJWT,
    isSameUser,
    getUser
);

router.patch("/:dpi/profile",
    validarJWT,
    isSameUser,
    updateProfile
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
