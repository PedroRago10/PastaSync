const { ipcRenderer } = require('electron');

class RendererView {
    constructor() {
        this.selectFolderBtn = document.getElementById('selectFolderBtn');
        this.openLogBtn = document.getElementById('openLogBtn');
        this.buttonClose = document.getElementById('buttonClose');
        this.backBtn = document.querySelector('.button-back');
        this.monitoreElement = document.querySelector('.p-monitore');
        this.init();
    }

    /**
     * Initialize all event listeners and set up the initial state.
     */
    init() {
        this.setupUiListeners();
    }

    /**
     * Set up the UI event listeners.
     */
    setupUiListeners() {
        this.openLogBtn.addEventListener('click', () => this.openLogFile());
        this.buttonClose.addEventListener('click', () => this.closeApp());
        this.selectFolderBtn.addEventListener('click', async () => this.selectFolder());
        this.backBtn.addEventListener('click', () => this.logout());
    }

    /**
     * Opens the log file in the default system viewer.
     */
    openLogFile() {
        ipcRenderer.send('open-log-file');
    }

    /**
     * Closes the application.
     */
    closeApp() {
        ipcRenderer.send('close-app');
    }

    /**
     * Selects a folder and updates the UI with the selected folder path.
     */
    async selectFolder() {
        const result = await ipcRenderer.invoke('select-folder');

        if (result.success && result.folderPath) {
            this.updateFolderUI(result.folderPath);
        }
    }

    /**
     * Updates the UI elements related to folder synchronization.
     * @param {String} folderPath - The path of the synchronized folder.
     */
    updateFolderUI(folderPath) {
        this.monitoreElement.querySelector('span').textContent = folderPath;
        this.monitoreElement.style.display = 'block';
        this.selectFolderBtn.textContent = 'Pasta sincronizada';
        this.selectFolderBtn.classList.add('sync');
        document.querySelector(".labs-icon").src = "../assets/img/labs_icon.png";
        document.querySelector(".img-connection").src = "../assets/img/connection.svg";
    }

    /**
     * Logs out and returns to the configurations screen.
     */
    logout() {
        ipcRenderer.send('backc');
    }
}

new RendererView();
