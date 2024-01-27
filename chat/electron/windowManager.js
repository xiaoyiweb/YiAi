// windowManager.js
const { BrowserWindow, globalShortcut, clipboard, app } = require('electron');
const { handleIpc } = require('./ipcManager');

let mainWindow = null;
let isWindowVisible = true;
let lastClipboardContent = '';

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 860,
    minWidth: 1300,
    minHeight: 820,
    center: true,
    frame: false,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

	if (app.isPackaged) {
    // mainWindow.loadFile(filePath)
    mainWindow.loadURL('https://ai.jiangly.com')
  }
  else {
    mainWindow.loadURL('http://127.0.0.1:1002')
    // mainWindow.loadURL('https://ai.jiangly.com')
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('show', () => {
    const clipboardContent = clipboard.readText();
    if (clipboardContent === lastClipboardContent) return;
    mainWindow.webContents.send('clipboard-content', clipboardContent);
    lastClipboardContent = clipboardContent;
  });

  globalShortcut.register('CommandOrControl+Shift+i', () => {
    mainWindow.webContents.openDevTools();
  });

	return mainWindow;
}

module.exports = { createMainWindow };
