
# PastaSync - Electron App

## Overview

PastaSync is a desktop application built with Electron for managing and synchronizing files from a local folder to a remote DigitalOcean Space. This application monitors a specified folder, detects changes (file additions, deletions, and renames), and uploads files automatically to the cloud while maintaining the folder structure. The application is designed to be user-friendly and allows a non-technical user to easily install and use it.

## Features

- **Automatic Folder Monitoring**: Watches a selected folder for file changes.
- **File Synchronization**: Automatically uploads, renames, or deletes files in the cloud based on the actions in the monitored folder.
- **Multiple File Format Support**: Supports uploading of various file types such as images, videos, and compressed files.
- **Electron-based**: Cross-platform support (Windows and macOS).
- **User-friendly UI**: Easy to use with no coding knowledge required.
- **Activity Logging**: Logs file activity and provides notifications for file uploads and deletions.

## Installation

1. Clone this repository to your local machine:

```bash
git clone [https://github.com/your-repo/pastasync.git](https://github.com/PedroRago10/PastaSync.git)
```

2. Install the required dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

## Building for Production

To build the application for distribution, run the following command:

```bash
npm run build
```

This will package the application for the appropriate platform (Windows or macOS).

## Usage

1. **Folder Selection**: Select the folder you wish to monitor using the "Select Folder" button in the application.
2. **Automatic Sync**: Once a folder is selected, any new files, deletions, or renames within the folder will be detected and synced with the DigitalOcean Space.
3. **Notifications**: Notifications will inform you of the status of the file uploads and deletions.
4. **View Logs**: You can view detailed logs of the file activities by opening the log file within the app.

## Environment Variables

The following environment variables are required to run the application:

```bash
AUTH_API_URL=https://api.example.com/auth/login
DO_SPACES_KEY=your_digitalocean_spaces_key
DO_SPACES_SECRET=your_digitalocean_spaces_secret
DO_SPACES_REGION=nyc2
DO_SPACES_BUCKET=your_digitalocean_bucket_name
```

Create a `.env` file in the root of the project and add your API keys accordingly.

## Folder Sync Logic

- **Additions**: New files added to the monitored folder are automatically uploaded to the cloud.
- **Deletions**: Deleted files in the local folder are also removed from the cloud.
- **Renaming**: Renamed files are treated as new uploads.
- **Duplicate Prevention**: The app checks for duplicate files based on a hash value to prevent re-uploading files that have already been synced.

## Development Setup

This project uses `chokidar` to watch for file changes in the selected folder and communicates with DigitalOcean Spaces via the AWS S3 SDK.

The Electron app interfaces with the backend services using `ipcMain` and `ipcRenderer` for communication between the frontend and backend processes.

## Contributing

If you wish to contribute to the project, feel free to submit a pull request or open an issue.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.
