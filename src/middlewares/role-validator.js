'use strict';

export const hasRole = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({ success: false, msg: "Token no validado" });
        }
        const roleValue = req.user.role_name || req.user.role; 

        if (!rolesPermitidos.includes(roleValue)) {
            return res.status(403).json({
                success: false,
                msg: `Tu rol (${roleValue}) no tiene permiso. Requerido: ${rolesPermitidos}`
            });
        }
        next();
    };
};


export const isAdmin = hasRole(1); 
export const isOperator = hasRole(1, 2); 
export const isSecurity = hasRole(1, 3); 