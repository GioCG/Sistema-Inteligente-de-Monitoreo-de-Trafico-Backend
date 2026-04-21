'use strict';

import jwt from "jsonwebtoken";

export const validarJWT = (req, res, next) => {

    const token = req.header("x-token");

    if (!token) {
        return res.status(401).json({
            success: false,
            msg: "Token requerido"
        });
    }

    try {

        const { udpi, role } = jwt.verify(
            token,
            process.env.SECRETORPRIVATEKEY
        );

        req.user = { udpi, role };

        next();

    } catch (err) {
        return res.status(401).json({
            success: false,
            msg: "Token inválido"
        });
    }
};