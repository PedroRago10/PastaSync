const axios = require('axios');
const tokenModel = require('../models/tokenModel');
const userModel = require('../models/userModel');
const logger = require('../helpers/logger');

/**
 * Fetches events for a specific company and user from the API.
 * @param {String} companyId - The ID of the company.
 * @returns {Array} - The list of events for the specified company and user.
 */
async function fetchCompanyEvents(companyId, eventName = false) {
    try {
        if (!tokenModel.token) {
            throw new Error('Token não disponível');
        }
        const user = userModel.getUserData();

        const config = {
            headers: {
                'Authorization': `Bearer ${tokenModel.token}`,
                'X-Permission-Id': user.permissionId
            }
        };

        const API_URL = process.env.API_URL || "https://api.samambaialabs.com.br";

        let filters = {
            companyId,
        }
        
        if (eventName && eventName.trim() !== "") {
            filters = {
                ...filters,
                eventName
            }
        }

        const response = await axios.get(`${API_URL}/event/list`, {
            params: { filters: JSON.stringify(filters) }, 
            ...config
        });

        if (response.status === 200 && Array.isArray(response.data.events)) {
            return response.data.events;
        } else {
            logger.logEvent('Error fetching events', 'Nenhum evento encontrado ou resposta inválida.');
            return [];
        }
    } catch (error) {
        logger.logEvent('Error fetching events', error.message);
        if (error.response) {
            logger.logEvent('Error details', JSON.stringify(error.response.data));
        } else if (error.request) {
            logger.logEvent('Error', 'Nenhuma resposta recebida do servidor.');
        } else {
            logger.logEvent('Error', `Erro ao buscar eventos: ${error.message}`);
        }
        return [];
    }
}

/**
 * Create new event on API endpoint
 * @param {Object} eventName - Text of the input event name
 * @returns {Boolean} - Boolean if success or not
 */
async function handleCreateEvent(eventName, companyId) {
    try {
        if (!tokenModel.token) {
            throw new Error('Token não disponível');
        }

        if (!eventName || eventName == '') {
            throw new Error('Evento não encontrado, parâmetros inválidos');
        }
        const user = userModel.getUserData();
        const userId = user.id;

        const eventExists = await fetchCompanyEvents(companyId, eventName);

        if(eventExists && eventExists.length > 0) {
            logger.logEvent('Error create event', 'Esse evento já foi criado com o mesmo nome.');
            return {
                error: true,
                message: "Já existe um evento com esse nome criado e ativo."
            };
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${tokenModel.token}`,
                'X-Permission-Id': user.permissionId,
                'Content-Type': 'application/json',
            }
        };

        const API_URL = process.env.API_URL || "https://api.samambaialabs.com.br";

        const response = await axios.post(`${API_URL}/event/create`, {
            name: eventName,
            date: new Date().toISOString(),
            companyId: companyId,
            guestsNumber: 0,
            users: [userId]
        }, {
            ...config
        });
        if (response.status === 201) {

            if (!response.data.message._id) {
                logger.logEvent('Error create event', 'API retornou 201 porém _id não localizado..a');
                
                return {
                    error: true,
                    message: "Ocorreu um erro inesperado, entre em contato com um administrador."
                };
            }

            return {
                error: false,
                message: "Sucesso ao criar um novo evento.",
                data: response.data.message._id
            };

        } else {
            logger.logEvent('Error create event', 'Erro ao tentar criar evento na API. ' + response.data.error);
            return {
                error: true,
                message: "Ocorreu um erro inesperado, entre em contato com um administrador.",
            };

        }
    } catch (error) {
        logger.logEvent('Error save event', error.message);
        if (error.response) {
            logger.logEvent('Error details', JSON.stringify(error.response.data));
        } else if (error.request) {
            logger.logEvent('Error', 'Nenhuma resposta recebida do servidor.');
        } else {
            logger.logEvent('Error', `Erro ao buscar eventos: ${error.message}`);
        }

        return {
            error: true,
            message: "Ocorreu um erro inesperado, entre em contato com um administrador.",
        };
    }
}

module.exports = {
    fetchCompanyEvents,
    handleCreateEvent
};
