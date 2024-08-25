const { app } = require('electron');

const fs = require('fs');
const path = require('path');

const logFilePath = path.join(app.getPath('userData'), 'activity_log.txt');

/**
 * Log events to a file with a timestamp.
 * @param {String} eventDescription - Description of the event.
 * @param {String} details - Additional details about the event.
 */
function logEvent(eventDescription, details) {
    const logMessage = `[${new Date().toISOString()}] ${eventDescription}: ${details}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Erro ao escrever no arquivo de log:', err);
        }
    });
}

module.exports = {
    logEvent,
};
