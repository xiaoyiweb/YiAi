// main.js
const { app, BrowserWindow } = require('electron');
const { createMainWindow } = require('./windowManager');
const { handleIpc } = require('./ipcManager');
const { registerShortcuts } = require('./shortcutManager');
const { configureAppMenu } = require('./appMenu');

app.commandLine.appendSwitch('--ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

app.whenReady().then(() => {
  const mainWindow = createMainWindow();
  handleIpc(mainWindow);
  registerShortcuts(mainWindow);
  configureAppMenu(mainWindow);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
