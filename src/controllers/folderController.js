const { dialog } = require('electron');
const chokidar = require('chokidar');
const syncController = require('./syncController');
const notificationController = require('./notificationController');
const logger = require('../helpers/logger');

let watcher = null;  // Declare the watcher globally within the module
let fileQueue = [];   // Queue for handling multiple file uploads
let deleteQueue = []; // Queue for handling multiple file deletions
const delayBetweenActions = 1000;  // Define delay between actions (1 second)

/**
 * Open a dialog for folder selection and start monitoring the folder.
 * @returns {Object} - The watcher instance.
 */
async function selectFolder() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });

    if (!canceled && filePaths.length > 0) {
        const selectedFolder = filePaths[0];
        startWatchingFolder(selectedFolder); 
        return selectedFolder; 
    }

    return null;
}

/**
 * Start monitoring the selected folder for file changes using chokidar.
 * @param {String} folderPath - The path of the folder to be monitored.
 */
function startWatchingFolder(folderPath) {
    if (watcher) {
        watcher.close();
    }

    watcher = chokidar.watch(folderPath, { persistent: true });

    watcher.on('ready', () => {
        notificationController.notify("Monitoramento Iniciado", `Pasta sincronizada: ${folderPath}`);
        logger.logEvent("Monitoramento Iniciado", folderPath);
    });

    watcher.on('add', (filePath) => {
        notificationController.notify('Arquivo Adicionado', `Novo arquivo detectado: ${filePath}`);
        fileQueue.push(filePath);  // Add file to the queue

        // Start processing the queue after 500ms delay if it's the first file
        if (fileQueue.length === 1) {
            setTimeout(() => {
                processFileQueue();
            }, 500);
        }
        logger.logEvent('Arquivo Adicionado', filePath);
    });

    watcher.on('unlink', (filePath) => {
        //notificationController.notify('Arquivo Removido', `Arquivo removido: ${filePath}`);
        deleteQueue.push(filePath); 

        // Start processing the deletion queue after 500ms delay if it's the first file
        if (deleteQueue.length === 1) {
            setTimeout(() => {
                processDeleteQueue();
            }, 500);
        }
        logger.logEvent('Arquivo Removido', filePath);
    });

    watcher.on('unlinkDir', (dirPath) => {
        if (dirPath === folderPath) {
            logger.logEvent('Pasta monitorada foi excluída ou renomeada', dirPath);
            watcher.close(); 

            dialog.showMessageBoxSync({
                type: 'warning',
                buttons: ['OK'],
                title: 'Pasta Renomeada/Excluída',
                message: 'A pasta monitorada foi renomeada ou excluída. Selecione uma nova pasta para monitorar.',
            });

            selectNewFolder().catch((error) => {
                console.error('Erro ao selecionar nova pasta:', error);
            });
        }
    });

    watcher.on('error', (error) => {
        notificationController.notify('Erro no Monitoramento', `Erro: ${error.message}`);
        logger.logEvent('Erro no Monitoramento', error.message);
    });

    watcher.on('close', () => {
        notificationController.notify("Monitoramento Encerrado", `A sincronização da pasta foi finalizada.`);
        logger.logEvent("Monitoramento Encerrado", folderPath);
    });

    return watcher;  
}

/**
 * Process the file upload queue with a delay between each upload.
 */
async function processFileQueue() {
    if (fileQueue.length > 0) {
        const filesToProcess = [...fileQueue];  
        fileQueue = []; 

        try {
            // Call the function to process the files with a delay between each file
            await syncController.handleMultipleFileAdd(filesToProcess, false, delayBetweenActions);
            logger.logEvent('Arquivos Processados', `Todos os arquivos na fila foram processados: ${filesToProcess.join(', ')}`);
        } catch (error) {
            console.error('Erro ao processar os arquivos:', error);
            logger.logEvent('Erro no Processamento', `Erro ao processar arquivos: ${error.message}`);
        }
    }
}

/**
 * Process the file deletion queue with a delay between each deletion.
 */
async function processDeleteQueue() {
    if (deleteQueue.length > 0) {
        const filesToDelete = [...deleteQueue];  
        deleteQueue = [];  

        try {
            // Process each file deletion with a delay between each
            for (const filePath of filesToDelete) {
                await syncController.handleFileDelete(filePath);
                logger.logEvent('Arquivo Deletado', `Arquivo deletado com sucesso: ${filePath}`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenActions));
            }
            logger.logEvent('Arquivos Removidos', `Todos os arquivos na fila de exclusão foram removidos: ${filesToDelete.join(', ')}`);
        } catch (error) {
            console.error('Erro ao deletar os arquivos:', error);
            logger.logEvent('Erro na Exclusão', `Erro ao deletar arquivos: ${error.message}`);
        }
    }
}

/**
 * Open a dialog to select a new folder after the monitored folder was renamed or deleted.
 */
async function selectNewFolder() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });

    if (!canceled && filePaths.length > 0) {
        const newFolder = filePaths[0];
        startWatchingFolder(newFolder); 
        return newFolder;
    }

    return null;
}

module.exports = {
    selectFolder,
    getWatcher: () => watcher, 
};
