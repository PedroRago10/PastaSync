require('dotenv').config();
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const windowController = require('./src/controllers/windowController');
const authController = require('./src/controllers/authController');
const folderController = require('./src/controllers/folderController');
const path = require('path');
const userModel = require('./src/models/userModel');
const eventController = require('./src/controllers/eventController');
const userController = require('./src/controllers/userController');

let mainWindow, loginWindow, configurationsWindow; // Global variables for main, login, and configurations windows

/**
 * Creates the login window when the app is ready.
 * Recreates the login window if all windows are closed and the app is activated (macOS behavior).
 */
app.whenReady().then(() => {
    loginWindow = windowController.createLoginWindow();

    app.on('activate', () => {
        if (loginWindow === null && BrowserWindow.getAllWindows().length === 0) {
            loginWindow = windowController.createLoginWindow();
        }
    });
});

/**
 * Quits the application when all windows are closed (except on macOS).
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

/**
 * Handles login events and opens the main window upon successful login.
 * Closes the login window and opens the configurations window.
 * @param {Object} credentials - User credentials for authentication.
 * @returns {Object} - Success status and message.
 */
ipcMain.handle('login', async (event, credentials) => {
    const result = await authController.handleLogin(credentials);
    
    if (result.success) {
        loginWindow.close();  
        const user = userModel.getUserData();
        configurationsWindow = windowController.createConfigurationsWindow(user);  
    } else {
        return { success: false, message: result.message };
    }

    return { success: true };  
});

/**
 * Handles folder selection and starts monitoring it.
 * @returns {Object} - Success status and folder path.
 */
ipcMain.handle('select-folder', async () => {
    const folderPath = await folderController.selectFolder();
    return { success: true, folderPath };
});

/**
 * Handles logout, stops folder synchronization, and re-opens the login window.
 */
ipcMain.on('logout', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close(); 
    }

    if (configurationsWindow && !configurationsWindow.isDestroyed()) {
        configurationsWindow.close();  
    }

    const watcherMain = folderController.getWatcher();  
    if (watcherMain && !watcherMain.isDestroyed()) {
        watcherMain.close(); 
    }

    userModel.clearUserData(); 

    loginWindow = windowController.createLoginWindow();
});

/**
 * Handles returning back to the configurations window.
 * Closes the main window and stops folder monitoring.
 */
ipcMain.on('backc', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
    }
    const watcherMain = folderController.getWatcher(); 
    if (watcherMain && !watcherMain.isDestroyed()) {
        watcherMain.close(); 
    }

    const user = userModel.getUserData();
    configurationsWindow = windowController.createConfigurationsWindow(user);  
});

/**
 * Path to the activity log file.
 * Ensures the file exists before opening.
 */
const logFilePath = path.join(app.getPath('userData'), 'activity_log.txt');
if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '');  // Creates the log file if it doesn't exist
}

/**
 * Listens to frontend requests to save configurations.
 * @param {Object} companyId - ID of the selected company.
 * @param {Object} eventId - ID of the selected event.
 * @returns {Boolean} - Whether the configurations were saved successfully.
 */
ipcMain.handle('save-configurations', async (event, { companyId, eventId }) => {
    const save = await userController.saveConfigurations(companyId, eventId);

    if (!save) {
        return false;
    }
    configurationsWindow.close();  
    mainWindow = windowController.createMainWindow();  
    return true;
});

/**
 * Listens to frontend requests to fetch a company's events.
 * @param {Object} companyId - ID of the selected company.
 * @returns {Array} - List of events associated with the company.
 */
ipcMain.handle('fetch-company-events', async (event, { companyId }) => {
    return await eventController.fetchCompanyEvents(companyId);
});

/**
 * Handle for create new event
 * @param {Object} eventName - Text of the input event name
 * @returns {Boolean} - Boolean if success or not
 */
ipcMain.handle('create-new-event', async (event, eventName, companyId) => {
    return await eventController.handleCreateEvent(eventName, companyId);
});

/**
 * Handles opening the activity log file from the renderer process.
 */
ipcMain.on('open-log-file', () => {
    shell.openPath(logFilePath)
        .then((error) => {
            if (error) {
                console.error('Erro ao abrir o arquivo de log:', error);
            }
        });
});

/**
 * Handles closing the application from the renderer process.
 */
ipcMain.on('close-app', () => {
    app.quit();  // Quits the application
});
