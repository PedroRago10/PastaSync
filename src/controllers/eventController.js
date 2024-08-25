const axios = require('axios');
const tokenModel = require('../models/tokenModel');
const userModel = require('../models/userModel');
const logger = require('../helpers/logger');

/**
 * Fetches events for a specific company and user from the API.
 * @param {String} companyId - The ID of the company.
 * @returns {Array} - The list of events for the specified company and user.
 */
async function fetchCompanyEvents(companyId) {
    try {
        console.log("Iniciando fetchCompanyEvents...");

        if (!tokenModel.token) {
            throw new Error('Token não disponível');
        }

        const user = userModel.getUserData();
        const userId = user.id;

        console.log("Dados do usuário:", user);
        console.log("ID do usuário:", userId);
        console.log("ID da empresa:", companyId);
        console.log("ID de permissão:", user.permissionId);

        const config = {
            headers: {
                'Authorization': `Bearer ${tokenModel.token}`,
                'X-Permission-Id': user.permissionId
            }
        };

        const API_URL = process.env.API_URL || "https://api.samambaialabs.com.br";

        console.log("Enviando requisição GET para:", `${API_URL}/event/company-user-events`);
        console.log("Parâmetros da requisição:", { userId, companyId });

        const response = await axios.get(`${API_URL}/event/company-user-events`, {
            params: { userId, companyId },
            ...config
        });

        console.log("Resposta recebida da API:", response);

        if (response.status === 200 && Array.isArray(response.data.events)) {
            console.log("Eventos retornados pela API:", response.data.events);
            return response.data.events; 
        } else {
            console.log("Nenhum evento encontrado ou resposta inválida.");
            logger.logEvent('Error fetching events', 'Nenhum evento encontrado ou resposta inválida.');
            return [];
        }
    } catch (error) {
        console.log("Erro ao buscar eventos:", error.message);
        logger.logEvent('Error fetching events', error.message);
        if (error.response) {
            console.log("Detalhes da resposta de erro:", error.response.data);
            logger.logEvent('Error details', JSON.stringify(error.response.data));
        } else if (error.request) {
            console.log("Nenhuma resposta recebida do servidor:", error.request);
            logger.logEvent('Error', 'Nenhuma resposta recebida do servidor.');
        } else {
            console.log("Erro ao configurar a requisição:", error.message);
            logger.logEvent('Error', `Erro ao buscar eventos: ${error.message}`);
        }
        return [];
    }
}


module.exports = {
    fetchCompanyEvents
};
