import {
    createEvent,
    getEvents,
    getEventsByUserDB
} from './event-model.js';

const OPERATOR_MANUAL_FINE_TYPES = [
    "Parqueo en línea roja",
    "Estacionamiento en línea roja",
    "Estacionamiento en zona prohibida",
    "Parqueo en zona prohibida",
    "Parqueo en doble fila",
    "Obstrucción de entrada o salida",
    "Parqueo sobre paso peatonal",
    "Parqueo sobre acera"
];

const normalizeText = (value = "") => String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getAllowedOperatorReason = (value = "") => {
    const normalized = normalizeText(value);
    return OPERATOR_MANUAL_FINE_TYPES.find((item) => normalizeText(item) === normalized) || null;
};

export const createEvents = async (req, res) => {
    try {
        const { speed, traffic_light_status, plate, manual_reason } = req.body;
        const role = Number(req.user?.role);
        const trafficLightId = Number(req.body.traffic_light_id || 1);

        let safeStatus = String(traffic_light_status || 'GREEN').toUpperCase();
        let numericSpeed = Number(speed || 0);
        let manualReason = manual_reason ? String(manual_reason).trim().slice(0, 500) : null;
        let isViolation = false;

        const speedLimit = Number(process.env.SPEED_LIMIT_KMH || 20);

        if (role === 2) {
            const allowedReason = getAllowedOperatorReason(manualReason);

            if (!allowedReason) {
                return res.status(400).json({
                    estado: false,
                    msg: "El operador solo puede crear eventos manuales de estacionamiento o parqueo, no infracciones de semáforo o velocidad.",
                    allowed: OPERATOR_MANUAL_FINE_TYPES
                });
            }

            // El operador no registra infracciones automáticas de semáforo/velocidad.
            // Solo deja eventos manuales tipo parqueo/estacionamiento.
            numericSpeed = 0;
            safeStatus = "NO_APLICA";
            manualReason = allowedReason;
            isViolation = true;
        } else {
            if (numericSpeed > speedLimit || safeStatus === 'RED' || manualReason) {
                isViolation = true;
            }
        }

        const eventData = {
            ...req.body,
            speed: numericSpeed,
            traffic_light_status: safeStatus,
            traffic_light_id: trafficLightId,
            plate: String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
            violation: isViolation,
            created_by_dpi: req.user?.udpi || null,
            created_by_role_id: req.user?.role || null,
            manual_reason: manualReason
        };

        console.log('================ EVENTO CRUD ================');
        console.log(`[EVENT] Creando evento para placa: ${eventData.plate}`);
        console.log(`[EVENT] Velocidad: ${numericSpeed.toFixed(2)} km/h | Límite: ${speedLimit} km/h`);
        console.log(`[EVENT] Semáforo ID: ${trafficLightId} | Estado: ${safeStatus} | Infracción: ${isViolation ? 'SI' : 'NO'}`);
        console.log(`[EVENT] Creado por DPI: ${eventData.created_by_dpi || 'N/A'} | Rol: ${eventData.created_by_role_id || 'N/A'}`);
        if (eventData.manual_reason) console.log(`[EVENT] Motivo manual: ${eventData.manual_reason}`);
        console.log('=============================================');

        const result = await createEvent(eventData);

        if (!result || !result.insertId) {
            return res.status(500).json({
                estado: false,
                message: "Error creando evento"
            });
        }

        return res.status(201).json({
            estado: true,
            message: "Evento creado",
            violation_detected: isViolation,
            event_id: result.insertId,
            plate: eventData.plate,
            created_by_dpi: eventData.created_by_dpi
        });

    } catch (error) {
        console.error('[EVENT] Error creando evento:', error.message);
        return res.status(500).json({
            estado: false,
            message: error.message
        });
    }
};

export const listEvents = async (req, res) => {
    try {
        const events = await getEvents({ role: req.user?.role, dpi: req.user?.udpi });

        res.status(200).json({
            estado: true,
            events
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};

export const getEventsByUser = async (req, res) => {
    try {
        const { dpi } = req.params;

        const events = await getEventsByUserDB(dpi);

        if (!events || events.length === 0) {
            return res.status(404).json({
                estado: false,
                message: "El usuario no tiene eventos registrados"
            });
        }

        return res.status(200).json({
            estado: true,
            message: "Eventos del usuario obtenidos correctamente",
            events
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            estado: false,
            message: "Error al obtener eventos",
            error: error.message
        });
    }
};
