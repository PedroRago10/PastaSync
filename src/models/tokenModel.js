const axios = require('axios');
const tokenModel = require('../models/tokenModel');  // Verifica o caminho para o modelo de token

/**
 * Handle the user login by sending credentials to the API and storing the token.
 * @param {Object} credentials - The login credentials.
 * @returns {Boolean} - Returns true if login is successful.
 */
async function handleLogin(credentials) {
    try {
        const API_URL = process.env.API_URL || "https://api.samambaialabs.com.br"
        const response = await axios.post(API_URL + "/auth/login", credentials);
        if (response.status === 200) {
            tokenModel.token = response.data.token; 
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login error:', error.message);
        return false;
    }
}

module.exports = {
    handleLogin,
};
