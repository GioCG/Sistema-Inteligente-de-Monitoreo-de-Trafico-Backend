'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import limiter from '../src/middlewares/validar-cant-peticiones.js';
import { dbConnection, db } from './mysql.js';

import requestRoutes from '../src/request/request-routes.js';
import authRoutes from '../src/auth/auth-routes.js';
import userRoutes from '../src/user/user-routes.js';
import vehicleRoutes from '../src/vehicle/vehicle-routes.js';
import trafficLightRoutes from '../src/trafficLight/trafficlight-routes.js';
import eventRoutes from '../src/event/event-routes.js';
import evidenceRoutes from '../src/evidence/evidence-routes.js';
import extraRoutes from '../src/extra/extra-routes.js'
import fineRoutes from '../src/fine/fines-routes.js'

// ==================== MIDDLEWARES ====================
const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    app.use(cors());
    app.use(helmet());
    app.use(morgan('dev'));

    app.use(limiter);
};


// ==================== ROUTES ====================
const routes = (app) => {

    app.use("/traffic-control/v1/auth", authRoutes);
    app.use("/traffic-control/v1/users", userRoutes);
    app.use("/traffic-control/v1/vehicles", vehicleRoutes);
    app.use("/traffic-control/v1/traffic-lights", trafficLightRoutes);
    app.use("/traffic-control/v1/events", eventRoutes);
    app.use("/traffic-control/v1/evidence", evidenceRoutes);
    app.use("/traffic-control/v1/extras", extraRoutes);
    app.use("/traffic-control/v1/requests", requestRoutes);
    app.use("/traffic-control/v1/fines", fineRoutes);
};


// ==================== DB CONNECTION ====================
const conectarDB = async () => {
    try {
        await dbConnection();

        const connection = await db().getConnection(); 
        console.log(" MySQL connected successfully");

        connection.release();
    } catch (error) {
        console.error(' MySQL connection error:', error);
        process.exit(1);
    }
};


// ==================== SERVER ====================
export const initServer = async () => {
    const app = express();
    const port = process.env.PORT || 3000;

    try {

        middlewares(app);
        await conectarDB();
        routes(app);

        app.get('/', (req, res) => {
            res.status(200).json({
                success: true,
                message: "🚦 Traffic Control API running"
            });
        });

        app.listen(port, () => {
            console.log(` Server running on port: ${port}`);
        });

    } catch (err) {
        console.error(`❌ Server init failed: ${err}`);
    }
};