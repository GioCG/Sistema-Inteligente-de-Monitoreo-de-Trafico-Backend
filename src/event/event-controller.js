'use strict';
import * as EventModel from './event-model.js';

export const createEvent = async (req, res) => {
    await EventModel.createEvent(req.body);

    res.json({
        success: true,
        msg: "Event created"
    });
};

export const listEvents = async (req, res) => {
    const events = await EventModel.getEvents();

    res.json({
        success: true,
        events
    });
};