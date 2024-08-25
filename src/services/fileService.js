const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculate the SHA-256 hash of a given file.
 * @param {String} filePath - Path to the file.
 * @returns {Promise<String>} - Resolves with the computed hash.
 */
async function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const fileStream = fs.createReadStream(filePath);

        fileStream.on('data', (data) => hash.update(data));
        fileStream.on('end', () => resolve(hash.digest('hex')));
        fileStream.on('error', (err) => reject(err));
    });
}

module.exports = {
    calculateFileHash
};
