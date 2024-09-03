const axios = require('axios');
const tokenModel = require('../models/tokenModel');
const logger = require('../helpers/logger');
const userModel = require('../models/userModel');

/**
 * Synchronizes user data and updates the user model with the most recent information.
 * @param {Object} user - The user object returned by the API.
 * @returns {Boolean} - Returns true if synchronization was successful.
 */
async function handleUserSync(user) {
    try {
        if (!user) {
            logger.logEvent('Sincronização', 'Nenhum dado de usuário recebido.');
            return false;
        }
        userModel.saveUserData({
            id: user._id || null,
            name: user.name || null,
            email: user.email || null,
            imageUrl: user.imageUrl || null,
            role: user.role || null,
            companies: [],
            eventId: user.eventId || [],
            permissionName: user.permissionName || null,
            permissionId: user.permissionId || null
        });


        const companies = await handleGetCompanies(user.companyId);

        if (companies && companies.length > 0) {
            userModel.updateCompanyData(companies);
        }


        logger.logEvent('Sincronização', 'Dados do usuário sincronizados com sucesso.');
        return true;

    } catch (error) {
        logger.logEvent('Sincronização', `Erro ao sincronizar dados do usuário: ${error.message}`);
        if (error.response) {
            logger.logEvent('Sincronização', `Detalhes da resposta de erro: Status: ${error.response.status}, Dados: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            logger.logEvent('Sincronização', 'Nenhuma resposta recebida da API. Verifique a conectividade.');
        } else {
            logger.logEvent('Sincronização', `Erro ao configurar a requisição: ${error.message}`);
        }
        return false;
    }
}

/**
 * Fetches the companies associated with the user based on the provided companyIds.
 * @param {Array} companyIds - The IDs of the companies associated with the user.
 * @returns {Array} - List of synchronized companies.
 */
async function handleGetCompanies(companyIds) {
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

        const response = await axios.get(`${API_URL}/company/list`, {
            params: { filters: JSON.stringify({ ids: companyIds }) },
            ...config
        });

        if (response.status === 200 && response.data && Array.isArray(response.data.companies)) {

            const companyData = response.data.companies.map(company => ({
                id: company._id,
                name: company.name
            }));

            logger.logEvent('Sincronização de Empresas', 'Empresas sincronizadas com sucesso.');
            return companyData;
        } else {

            logger.logEvent('Sincronização de Empresas', 'Nenhuma empresa encontrada.');
            return [];
        }
    } catch (error) {
        if (error.response) {

            logger.logEvent('Error details', JSON.stringify(error.response.data));
        } else if (error.request) {
            logger.logEvent('Error', 'Nenhuma resposta recebida do servidor.');
        } else {
            logger.logEvent('Error fetching companies', error.message);
        }

        return [];
    }
}

/**
 * Fetche the save event for configurations
 * @param {String} companyId - The ID of the company.
 * @param {String} eventID - The ID of the event.
 * @returns {Boolean} - Confirm if success or not
 */
async function saveConfigurations(companyId, eventId) {
    try {
        if (!companyId || !eventId || eventId == '' || companyId == "") {
            return false;
        }

        userModel.updateCompanyAndEventIds(companyId, eventId);

        const user = userModel.getUserData();

        const config = {
            headers: {
                'Authorization': `Bearer ${tokenModel.token}`,
                'X-Permission-Id': user.permissionId
            }
        };

        const API_URL = process.env.API_URL || "https://api.samambaialabs.com.br";

        const response = await axios.get(`${API_URL}/frames/get-configurations`, {
            params: {
                companyId: companyId,
                eventId: eventId,
            },
            ...config
        });

        if (response.status === 200 && Array.isArray(response.data.configurations)) {
            userModel.updateFrameConfig(response.data.configurations);
        } else {
            logger.logEvent('Error fetching events', 'Nenhuma configuração de moldura encontrada ou resposta inválida.');
        }

        return true;

    } catch (error) {
        logger.logEvent('Erro ao salvar configurações', error.message);
        return false;
    }
}

module.exports = {
    handleUserSync,
    saveConfigurations
};
