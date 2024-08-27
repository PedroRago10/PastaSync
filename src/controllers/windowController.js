const { BrowserWindow } = require('electron');
const path = require('path');

/**
 * Create and return the login window.
 * @returns {BrowserWindow} - The login window instance.
 */
function createLoginWindow() {
    let loginWindow = new BrowserWindow({
        width: 400,
        height: 544,
        frame: false,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, '../assets/img/labs_icon.png'),
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    loginWindow.loadFile(path.join(__dirname, '../views/login.html'));
    loginWindow.on('closed', () => {
        loginWindow = null;
    });

    return loginWindow;
}

/**
 * Create and return the main window after successful configurations.
 * @returns {BrowserWindow} - The main window instance.
 */
function createMainWindow() {
    let mainWindow = new BrowserWindow({
        width: 400,
        height: 505,
        frame: false,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, '../assets/img/labs_icon.png'),
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../views/index.html'));
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    return mainWindow;
}

/**
 * Create and return the configurations window after successful login.
 * @returns {BrowserWindow} - The configurations window instance.
 */
function createConfigurationsWindow(user) {
    let configurationsWindow = new BrowserWindow({
        width: 400,
        height: 700,
        frame: false,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, '../assets/img/labs_icon.png'),
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if(!user.id) {
        configurationsWindow.loadFile(path.join(__dirname, '../views/login.html'));
        configurationsWindow.on('closed', () => {
            configurationsWindow = null;
        }); 

        return configurationsWindow;
    }

    
    configurationsWindow.loadFile(path.join(__dirname, '../views/configurations.html'));

    configurationsWindow.on('ready-to-show', () => {
        try {
            const userJson = JSON.parse(JSON.stringify(user));
            
            configurationsWindow.webContents.send('user-data', userJson);
        } catch (error) {
            console.error('Erro ao serializar os dados do usuário:', error);
        }
    });
    configurationsWindow.on('closed', () => {
        configurationsWindow = null;
    }); 


    return configurationsWindow;
}

module.exports = {
    createLoginWindow,
    createMainWindow,
    createConfigurationsWindow
};
