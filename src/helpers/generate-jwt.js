import jwt from "jsonwebtoken";

export const generarJWT = (udpi = "", role = "") => {

    return new Promise((resolve, reject) => {

        const payload = { udpi, role };

        jwt.sign(
            payload,
            process.env.SECRETORPRIVATEKEY,
            {
                expiresIn: "4h"
            },
            (err, token) => {
                if (err) {
                    reject("Error generating token");
                } else {
                    resolve(token);
                }
            }
        );
    });
};