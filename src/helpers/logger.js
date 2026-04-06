'use strict';

export const logEvent = (message, data = {}) => {
    console.log("📌 EVENT:", {
        message,
        date: new Date(),
        data
    });
};