const { Notification } = require('electron');

/**
 * Show a desktop notification.
 * @param {String} title - Notification title.
 * @param {String} body - Notification body text.
 */
function notify(title, body) {
    new Notification({ title, body }).show();
}

module.exports = {
    notify
};
