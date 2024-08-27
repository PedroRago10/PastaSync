const { ipcRenderer } = require('electron');

class ConfigurationsView {
    constructor() {
        this.userId = null;
        this.userPermissionId = null;
        this.selectCompanyElement = document.querySelector('select[name="companies"]');
        this.selectEventElement = document.querySelector('select[name="events"]');
        this.errorMessageElement = document.getElementById('error-message');
        this.buttonSaveConfigurations = document.getElementById("saveConfigurationsBtn");
        this.initialize();
    }

    /**
     * Initializes the event listeners and populates initial data.
     */
    initialize() {
        this.setupIpcListeners();
        this.setupUiListeners();
        this.setRandomBannerImage();
    }

    /**
     * Sets up IPC listeners for receiving user data.
     */

    setupIpcListeners() {
        ipcRenderer.on('user-data', (event, user) => {
            this.userId = user.id;
            this.userPermissionId = user.permissionId;
            this.populateUserData(user);
            this.populateCompanies(user.companies);
        });
    }

    /**
     * Populates user data in the view.
     * @param {Object} user - The user data.
     */
    populateUserData(user) {
        document.querySelector('.p-user').innerText = user.name || 'Usuário';
        document.querySelector('.p-role').innerText = user.permissionName || 'Função';

        const profileBox = document.querySelector('.profile-box');
        const profileImg = user.imageUrl || '../assets/img/default-profile.png';
        profileBox.style.backgroundImage = `url(${profileImg})`;
    }

    /**
     * Populates the companies select dropdown with data.
     * @param {Array} companies - The list of companies associated with the user.
     */
    populateCompanies(companies) {
        if (companies && companies.length > 0) {
            this.addDefaultCompanyOption();

            companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                this.selectCompanyElement.appendChild(option);
            });

            new TomSelect(this.selectCompanyElement, {
                create: false,
                render: {
                    no_results: function (data) {
                        return `<div class="no-results">Nenhum evento encontrado</div>`;
                    }
                },
                sortField: 'text',
                placeholder: 'Pesquisar',
                maxItems: 1
            });
        } else {
            this.selectCompanyElement.innerHTML = '<option value="">Nenhuma empresa encontrada</option>';
        }
    }


    /**
     * Adds the default "Pesquisar" option to the companies dropdown.
     */
    addDefaultCompanyOption() {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Pesquisar";
        this.selectCompanyElement.appendChild(defaultOption);
    }

    /**
     * Resets the events select dropdown.
     */
    resetEventSelect() {
        this.selectEventElement.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "";
        this.selectEventElement.appendChild(defaultOption);
        this.selectEventElement.disabled = true;
    }

    /**
     * Populates the events select dropdown with the provided data.
     * @param {Array} events - The list of events.
     */
    populateEventSelect(events) {
        this.selectEventElement.innerHTML = '';

        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event._id;
            option.textContent = event.name;
            this.selectEventElement.appendChild(option);
        });
        this.selectEventElement.disabled = false;

        // Inicializa o TomSelect
        const selectEvent = new TomSelect(this.selectEventElement, {
            create: async (input) => {
                try {
                    selectEvent.dropdown_content.querySelector('.create').textContent = `Adicionando...`;
                    selectEvent.dropdown_content.querySelector('.create').classList.add('disabled');

                    const companyId = this.selectCompanyElement.value;
                    if (!companyId || companyId === '') {
                        this.displayErrorMessage('Nenhuma empresa selecionada');
                        selectEvent.dropdown_content.querySelector('.create').textContent = `Adicionar "${input}"`;
                        selectEvent.dropdown_content.querySelector('.create').classList.remove('disabled');
                        return false;
                    }

                    const response = await ipcRenderer.invoke('create-new-event', input, companyId);

                    if (response.error) {
                        selectEvent.close();
                        this.displayErrorMessage(response.message);
                        selectEvent.dropdown_content.querySelector('.create').textContent = `Adicionar "${input}"`;
                        selectEvent.dropdown_content.querySelector('.create').classList.remove('disabled');
                        return false;
                    }

                    const newOption = {
                        value: response.data,
                        text: input
                    };
                    

                    selectEvent.addOption(newOption);
                    selectEvent.addItem(newOption.value); 
                    selectEvent.refreshItems();  

                    this.selectEventElement.value = newOption.value;
                    selectEvent.setValue(newOption.value); 

                    return newOption;

                } catch (error) {
                    console.error('Erro ao criar evento:', error);
                    this.resetEventSelect();
                    selectEvent.dropdown_content.querySelector('.create').textContent = `Adicionar "${input}"`;
                    selectEvent.dropdown_content.querySelector('.create').classList.remove('disabled');
                    return false;
                }
            },
            render: {
                option_create: function (data, escape) {
                    return `<div class="create">Adicionar "${escape(data.input)}"</div>`;
                },
                no_results: function (data) {
                    return `<div class="no-results">Nenhum evento encontrado</div>`;
                }
            },
            sortField: 'text',
            placeholder: 'Pesquisar ou adicionar um evento',
            maxItems: 1
        });

    }

    /**
     * Sets a random banner image in the view.
     */
    setRandomBannerImage() {
        const randomBannerNumber = Math.floor(Math.random() * 4) + 1;
        const bodyBanner = document.querySelector('.body-banner');
        bodyBanner.style.backgroundImage = `url('../assets/img/banners/banner_${randomBannerNumber}.jpg')`;
    }

    /**
     * Sets up the UI event listeners such as dropdown change and button clicks.
     */
    setupUiListeners() {
        this.selectCompanyElement.addEventListener('change', (event) => this.onCompanyChange(event));
        this.buttonSaveConfigurations.addEventListener("click", () => this.onSaveConfigurationsClick());
        document.getElementById('buttonClose').addEventListener('click', () => ipcRenderer.send('close-app'));
        document.querySelector('.button-back').addEventListener('click', () => ipcRenderer.send('logout'));
    }

    /**
     * Handles the event when the company is changed.
     * @param {Event} event - The change event of the select dropdown.
     */
    async onCompanyChange(event) {
        const companyId = event.target.value;

        if (!companyId) {
            this.resetEventSelect();
            return;
        }

        this.showSearchingMessageInEventSelect();

        try {
            const events = await ipcRenderer.invoke('fetch-company-events', { companyId });

            if (events && events.length > 0) {
                this.errorMessageElement.innerText = '';
                this.errorMessageElement.classList.remove("message-error-display");
                this.populateEventSelect(events);
            } else {
                this.displayErrorMessage('Nenhum evento encontrado para a empresa selecionada.');
                this.resetEventSelect();
            }
        } catch (error) {
            this.displayErrorMessage('Erro ao buscar eventos.');
            console.error('Erro ao buscar eventos:', error);
            this.resetEventSelect();
        }
    }

    /**
     * Shows a "Pesquisando..." message in the event select dropdown.
     */
    showSearchingMessageInEventSelect() {
        this.selectEventElement.disabled = true;
        this.selectEventElement.innerHTML = '<option value="">Pesquisando...</option>';
    }

    /**
     * Handles the click event of the save configurations button.
     */
    async onSaveConfigurationsClick() {
        const companyId = this.selectCompanyElement.value;
        const eventId = this.selectEventElement.value;

        if (companyId === "" || eventId === "") {
            this.displayErrorMessage('Selecione as opções.');
            return;
        }

        this.buttonSaveConfigurations.textContent = "Salvando";
        this.buttonSaveConfigurations.disabled = true;

        try {
            const save = await ipcRenderer.invoke('save-configurations', { companyId, eventId });

            if (!save) {
                this.displayErrorMessage('Ocorreu um erro inesperado, fale com um administrador.');
            }
        } catch (error) {
            this.displayErrorMessage('Erro ao salvar configurações.');
            console.error('Erro ao salvar configurações:', error);
        } finally {
            this.buttonSaveConfigurations.textContent = "Salvar Configurações";
            this.buttonSaveConfigurations.disabled = false;
        }
    }

    /**
     * Displays an error message in the view.
     * @param {String} message - The error message to display.
     */
    displayErrorMessage(message) {
        this.errorMessageElement.innerText = message;
        this.errorMessageElement.classList.add("message-error-display");
        setTimeout(() => {
            this.errorMessageElement.innerText = '';
            this.errorMessageElement.classList.remove("message-error-display");
        }, 2000);
    }
}

new ConfigurationsView();
