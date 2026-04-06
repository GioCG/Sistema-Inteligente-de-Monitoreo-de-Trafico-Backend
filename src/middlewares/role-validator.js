'use strict';

export const hasRole = (...rolesPermitidos) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(500).json({
                success: false,
                msg: "Se quiere verificar rol sin validar token primero"
            });
        }

        const { role } = req.user;

        if (!rolesPermitidos.includes(role)) {
            return res.status(403).json({
                success: false,
                msg: `El servicio requiere uno de estos roles: ${rolesPermitidos}`
            });
        }

        next();
    };
};

export const isAdmin = hasRole("ADMIN_ROLE");
export const isOperator = hasRole("OPERATOR_ROLE", "ADMIN_ROLE");
export const isSecurity = hasRole("SECURITY_ROLE", "ADMIN_ROLE");