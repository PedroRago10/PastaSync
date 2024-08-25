const axios = require('axios');
const tokenModel = require('../models/tokenModel');
const logger = require('../helpers/logger');
const userController = require('./userController');

/**
 * Handle the user login by sending credentials to the API and storing the token.
 * @param {Object} credentials - The login credentials.
 * @returns {Boolean} - Returns true if login is successful.
 */
async function handleLogin(credentials) {
    try {
        const API_URL = process.env.API_URL || "https://api.samambaialabs.com.br";
        const response = await axios.post(API_URL + '/auth/login', credentials);

        if (response.status === 200 && response.data.token) {
            tokenModel.token = response.data.token;
            logger.logEvent('Login', `Login bem-sucedido.`);

            const syncUser = await userController.handleUserSync(response.data.user);

            if (!syncUser) {
                logger.logEvent('Login', `Falha na sincronização dos dados do usuário.`);
                return { success: false, message: 'Erro ao sincronizar os dados do usuário.' };
            }

            return { success: true };
        } else {
            logger.logEvent('Login', `Falha no login.`);
            return { success: false, message: 'Falha ao tentar entrar, verifique suas credenciais.' };
        }
    } catch (error) {
        logger.logEvent('Login', `Erro no login: ${error.message}`);

        if (error.response) {
            const { status, data } = error.response;
            logger.logEvent('Login', `Detalhes da resposta de erro: Status: ${status}, Data: ${JSON.stringify(data)}`);
            const apiErrorMessage = data.errors ? data.errors.join(', ') : 'Erro na autenticação.';
            return { success: false, message: `Erro na autenticação: ${apiErrorMessage}` };
        } else if (error.request) {
            logger.logEvent('Login', 'Nenhuma resposta recebida da API. Verifique a conectividade.');
            return { success: false, message: 'Falha na conexão com o servidor. Por favor, tente novamente mais tarde.' };
        } else {
            logger.logEvent('Login', `Erro ao configurar a requisição: ${error.message}`);
            return { success: false, message: 'Ocorreu um erro interno. Tente novamente mais tarde.' };
        }
    }
}

module.exports = {
    handleLogin,
};
