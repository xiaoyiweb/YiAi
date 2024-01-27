// shortcutManager.js
const { globalShortcut, BrowserWindow } = require('electron');

let isWindowVisible = true;

function registerShortcuts(mainWindow) {
  globalShortcut.register('Ctrl+L', () => {
    if (mainWindow && !mainWindow.isFullScreen()) {
      if (isWindowVisible) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
      isWindowVisible = !isWindowVisible;
    }
  });
}

module.exports = { registerShortcuts };
