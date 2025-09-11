import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const devServerUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  try {
    if (!app.isPackaged && devServerUrl) {
      const devUrl = devServerUrl || 'http://localhost:8080';
      mainWindow.loadURL(devUrl);
    } else {
      const indexPath = join(app.getAppPath(), 'dist', 'index.html');
      mainWindow.loadFile(indexPath);
    }
  } catch (err) {
    console.error('Failed to load window:', err);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


