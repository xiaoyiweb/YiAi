// ipcManager.js
const { ipcMain, BrowserWindow, app } = require('electron');

function handleIpc(mainWindow) {
  ipcMain.handle('minimizeWindow', () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    mainWindow?.minimize();
  });

  ipcMain.handle('maxmizeWindow', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (process.platform === 'darwin') mainWindow?.setFullScreen(true);
      else mainWindow?.maximize();
    }
  });

  ipcMain.handle('closeWindow', () => {
    // const mainWindow = BrowserWindow.getFocusedWindow();
    // mainWindow?.close();
		app.quit()
  });

  ipcMain.handle('unmaximizeWindow', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (process.platform === 'darwin') mainWindow?.setFullScreen(false);
      else mainWindow?.unmaximize();
    }
  });

  ipcMain.on('check-window-maximized', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      event.reply('window-maximized-status', win.isFullScreen());
    }
  });
}

module.exports = { handleIpc };
