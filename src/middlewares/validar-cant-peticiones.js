import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15*60*1000,
    standardHeaders: true,
    legacyHeaders: false,
    max: 100,
    message:{
        success: false,
        msg: "Demasiadas peticiones de esta Ip, por favor intente en 15 minutos"
    }
});

export default limiter;