import {
    createEvent,
    getEvents,
    getEventsFull
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

export const getEventsFullController = async (req, res) => {
    try {
        const events = await getEventsFull();

        res.status(200).json({
            estado: true,
            events
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};

export const deleteEventController = async (req, res) => {
    try {
        await deleteEvent(req.params.id);

        res.status(200).json({
            estado: true,
            msg: "Evento eliminado"
        });
    } catch (error) {
        res.status(500).json({ estado: false, error: error.message });
    }
};