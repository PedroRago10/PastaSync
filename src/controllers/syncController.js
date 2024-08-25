const uploadedPhotosModel = require('../models/uploadedPhotosModel');
const fileService = require('../services/fileService');
const logger = require('../helpers/logger');
const notificationController = require('./notificationController');
const fs = require('fs');
const path = require('path');
const userModel = require('../models/userModel');
const tokenModel = require('../models/tokenModel');
const axios = require('axios');
const FormData = require('form-data');
/**
 * Handle the addition of multiple files, with a delay between uploads.
 * @param {Array<String>} filePaths - Array of file paths to be added or renamed.
 * @param {Boolean} isRename - Whether the file addition is due to renaming.
 * @param {Number} delay - Delay in milliseconds between file uploads.
 */
async function handleMultipleFileAdd(filePaths, isRename = false, delay = 1000) {
    for (const filePath of filePaths) {
        const success = await handleFileAdd(filePath, isRename);
        if (!success) {
            console.log(`Erro no upload do arquivo ${filePath}`);
            logger.logEvent('Erro no upload ', `Erro no upload do arquivo ${filePath}`);

            break; 
        }
        await new Promise(resolve => setTimeout(resolve, delay)); // Atraso entre os uploads
    }
}

/**
 * Handle the addition of a single file, with support for renaming.
 * @param {String} filePath - The path of the added or renamed file.
 * @param {Boolean} isRename - Whether the file addition is due to renaming.
 * @returns {Boolean} - Whether the file was successfully uploaded.
 */
async function handleFileAdd(filePath, isRename = false) {
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    const supportedExtensions = ['.png', '.jpeg', '.jpg', '.tiff', '.raw', '.heic', '.heif', '.gif', '.bmp', '.webp', '.svg', '.mp4'];

    let errorTitle, errorMessage;

    // Check if the file type is supported
    if (!supportedExtensions.includes(fileExtension)) {
        errorTitle = "Erro no Upload";
        errorMessage = `Formato de arquivo ${fileExtension} não suportado.`;
        notificationController.notify(errorTitle, errorMessage);
        logger.logEvent(errorTitle, errorMessage);
        return false;
    }

    // Load the user data
    const user = userModel.getUserData();
    const token = tokenModel.token;

    if (!user || !user.id || !user.eventId || !user.companies || !token) {
        errorTitle = "Erro no Upload";
        errorMessage = "Dados do usuário, evento, empresa ou token não encontrados.";
        notificationController.notify(errorTitle, errorMessage);
        logger.logEvent(errorTitle, errorMessage);
        return false;
    }

    // Calculate the hash of the file
    const fileHash = await fileService.calculateFileHash(filePath);

    // Load the registry of uploaded photos
    const uploadedPhotos = uploadedPhotosModel.loadUploadedPhotos();

    // Check if the file has already been uploaded
    if (uploadedPhotos[fileHash] && uploadedPhotos[fileHash].filePath === filePath) {
        errorTitle = "Upload Duplicado";
        errorMessage = `O arquivo ${fileName} já foi enviado.`;
        notificationController.notify(errorTitle, errorMessage);
        logger.logEvent(errorTitle, errorMessage);
        return false;
    }

    // Handle renaming scenario
    if (isRename) {
        errorTitle = "Arquivo renomeado";
        errorMessage = `Tratando o arquivo renomeado como novo upload.`;
        logger.logEvent(errorTitle, errorMessage);
    }

    // Prepare form data for API upload
    const fileStream = fs.createReadStream(filePath);
    const formData = new FormData();

    formData.append('images', fileStream, fileName);
    formData.append('eventId', user.eventId[0]);
    formData.append('userId', user.id);
    formData.append('companyId', user.companyId[0]);

    try {
        const API_URL = process.env.API_URL || "https://api.samambaialabs.com.br";

        const response = await axios.post(`${API_URL}/image/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`,
                'X-Permission-Id': user.permissionId
            }
        });

        if (response.status === 201) {
            // Calculate the hash and update the registry, even for renamed files
            const fileHash = await fileService.calculateFileHash(filePath);
            uploadedPhotosModel.registerUploadedFile(fileHash, filePath, response.data.location);

            notificationController.notify("Upload Bem-sucedido", `O arquivo ${fileName} foi enviado com sucesso.`);
            logger.logEvent('Upload bem-sucedido', response.data.location);
            return true;
        } else {
            throw new Error('Falha ao carregar imagens');
        }
    } catch (error) {
        if (error.response) {
            errorTitle = "Erro no Upload";
            errorMessage = `Falha ao enviar o arquivo ${fileName}.`;
            logger.logEvent(errorTitle, errorMessage);
            console.error(errorTitle, errorMessage + error.response.data);
            notificationController.notify(errorTitle, `${errorMessage} Erro: ${error.response.data.error || error.message}`);
        } else {
            errorTitle = "Erro no Upload";
            errorMessage = `Falha ao enviar o arquivo ${fileName}.`;
            logger.logEvent(errorTitle, errorMessage);
            console.error(errorTitle, errorMessage + error.message);
            notificationController.notify(errorTitle, errorMessage);
        }
        return false;
    }
}

/**
 * Handles the deletion of a file from the cloud space.
 * @param {String} filePath - The path of the deleted file.
 * @returns {Promise<Boolean>}
 */
async function handleFileDelete(filePath) {
    try {
        const user = userModel.getUserData();
        const token = tokenModel.token;
        const API_URL = process.env.API_URL || "https://api.samambaialabs.com.br";
        const fileName = path.basename(filePath);

        const response = await axios.delete(`${API_URL}/image/delete/${user.eventId[0]}/${fileName}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Permission-Id': user.permissionId
            },
            timeout: 5000 
        });

        if (response.status === 200) {
            notificationController.notify('Arquivo Removido', `O arquivo foi removido da nuvem: ${filePath}`);
            logger.logEvent('Arquivo removido do espaço', filePath);
            return true;
        } else {
            notificationController.notify('Erro ao Remover', `Falha ao remover o arquivo ${filePath}. Erro: ${response.data}`);
            logger.logEvent('Falha ao remover do espaço', filePath);
            return false;
        }
    } catch (error) {
        console.error('Erro ao remover o arquivo do Space:', error.message);
        logger.logEvent('Erro ao remover o arquivo do Space:', error.message);

        if (error.code === 'ECONNABORTED') {
            console.error('Erro: A requisição foi abortada devido a timeout');
            logger.logEvent('Erro: A requisição foi abortada devido a timeout', error.message);
        }

        if (error.response) {
            console.error('Detalhes do erro na resposta:', error.response.data);
            logger.logEvent('Detalhes do erro na resposta:', error.response.data);
        }

        notificationController.notify('Erro ao Remover', `Falha ao remover o arquivo ${filePath}. Erro: ${error.message}`);
        return false;
    }
}

module.exports = {
    handleFileAdd,
    handleFileDelete,
    handleMultipleFileAdd
};
