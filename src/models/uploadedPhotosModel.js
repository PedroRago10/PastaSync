const fs = require('fs');
const path = require('path');

const uploadedPhotosFile = path.join(__dirname, '../../uploaded_photos.json');

/**
 * Load the registry of uploaded photos from the JSON file.
 * @returns {Object} - The loaded photos registry.
 */
function loadUploadedPhotos() {
    try {
        if (fs.existsSync(uploadedPhotosFile)) {
            const data = fs.readFileSync(uploadedPhotosFile, 'utf8');
            return data.trim().length === 0 ? {} : JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao carregar o arquivo JSON:', error.message);
    }

    return {};
}

/**
 * Save the registry of uploaded photos to the JSON file.
 * @param {Object} photos - The photos registry to be saved.
 */
function saveUploadedPhotos(photos) {
    try {
        fs.writeFileSync(uploadedPhotosFile, JSON.stringify(photos, null, 2));
    } catch (error) {
        console.error('Erro ao salvar o arquivo JSON:', error.message);
    }
}

/**
 * Check if a file has already been uploaded by comparing its hash.
 * @param {String} fileHash - The hash of the file to check.
 * @returns {Boolean} - Returns true if the file has been uploaded.
 */
function isFileAlreadyUploaded(fileHash) {
    const uploadedPhotos = loadUploadedPhotos();
    return uploadedPhotos.hasOwnProperty(fileHash);
}

/**
 * Register a file as uploaded in the registry.
 * @param {String} fileHash - The hash of the uploaded file.
 * @param {String} filePath - The path of the uploaded file.
 * @param {String} fileUrl - The URL where the file is stored in the cloud.
 */
function registerUploadedFile(fileHash, filePath, fileUrl) {
    const uploadedPhotos = loadUploadedPhotos();
    uploadedPhotos[fileHash] = {
        filePath: filePath,
        fileUrl: fileUrl,
        timestamp: new Date().toISOString(),
    };
    saveUploadedPhotos(uploadedPhotos);
}

module.exports = {
    loadUploadedPhotos,
    saveUploadedPhotos,
    isFileAlreadyUploaded,
    registerUploadedFile,
};
