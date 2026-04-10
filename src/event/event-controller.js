import {
    createEvent,
    getEvents,
    getEventsFull,
    getEventsByUserDB
} from './event-model.js';

export const createEvents = async (req, res) => {
    try {
        const { speed, traffic_light_status } = req.body;
        
        let isViolation = false;
        if (speed > 80 || traffic_light_status === 'RED') {
            isViolation = true;
        }

        const eventData = { ...req.body, violation: isViolation };
        const result = await createEvent(eventData);

        res.status(201).json({ estado: true, violation_detected: isViolation, result });
    } catch (error) { 
        res.status(500).json({ estado: false, error: error.message });
    }
};

export const listEvents = async (req, res) => {
    try {
        const events = await getEvents();

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
