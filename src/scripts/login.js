const { ipcRenderer } = require('electron');

class LoginView {
    constructor() {
        this.loginButton = document.getElementById('loginButton');
        this.emailField = document.getElementById('email');
        this.passwordField = document.getElementById('password');
        this.errorMessageElement = document.getElementById('error-message');
        this.closeButton = document.getElementById('buttonClose');

        this.init();
    }

    /**
     * Initialize event listeners for the login form and close button.
     */
    init() {
        this.setupUiListeners();
    }

    /**
     * Set up UI event listeners.
     */
    setupUiListeners() {
        this.loginButton.addEventListener('click', () => this.handleLogin());
        this.passwordField.addEventListener('keydown', (event) => this.handleKeyPress(event));
        this.closeButton.addEventListener('click', () => this.closeApp());
    }

    /**
     * Handle the login process when the login button is clicked.
     */
    async handleLogin() {
        const email = this.emailField.value;
        const password = this.passwordField.value;

        this.clearErrorMessage();
        const originalButtonContent = this.setLoadingState(true);

        try {
            const result = await ipcRenderer.invoke('login', { email, password });

            if (result.success) {
                window.location.href = 'configurations.html';
            } else {
                this.showErrorMessage(result.message);
            }
        } catch (error) {
            console.error('Erro durante o login:', error);
            this.showErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
        } finally {
            this.setLoadingState(false, originalButtonContent);
        }
    }

    /**
     * Handle login when pressing "Enter" in the password field.
     * @param {KeyboardEvent} event 
     */
    handleKeyPress(event) {
        if (event.key === 'Enter') {
            this.handleLogin();
        }
    }

    /**
     * Set the loading state for the login button.
     * @param {Boolean} isLoading 
     * @returns {String} - The original content of the login button.
     */
    setLoadingState(isLoading, originalContent = null) {
        if (isLoading) {
            originalContent = this.loginButton.innerHTML;
            this.loginButton.innerHTML = '<img src="../assets/img/loading.svg" alt="Loading..." class="loading-image" />';
            this.loginButton.disabled = true;
        } else {
            this.loginButton.innerHTML = originalContent;
            this.loginButton.disabled = false;
        }
        return originalContent;
    }

    /**
     * Show an error message in the UI.
     * @param {String} message 
     */
    showErrorMessage(message) {
        this.errorMessageElement.innerText = message;
        this.errorMessageElement.classList.add("message-error-display");
    }

    /**
     * Clear any displayed error message.
     */
    clearErrorMessage() {
        this.errorMessageElement.innerText = '';
        this.errorMessageElement.classList.remove("message-error-display");
    }

    /**
     * Close the application when the close button is clicked.
     */
    closeApp() {
        ipcRenderer.send('close-app');
    }
}

new LoginView();
