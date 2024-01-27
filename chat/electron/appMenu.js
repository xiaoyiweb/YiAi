// appMenu.js
const { Menu, app, Tray } = require('electron');
const path = require('path')

function configureAppMenu(mainWindow) {

  let	tray = new Tray(path.join(__dirname, '../icons/16x16.png'));
  // tray.setToolTip('Nine Ai');

  const template = [
    {
      label: 'NineAi',
      submenu: [
        {
          label: '退出应用',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        }
      ],
    }
  ];

	if (process.platform === 'darwin') {
    template.unshift({
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' }
        ]
      })
}

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

	tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

	tray.on('right-click', () => {
    const contextMenuWindows = Menu.buildFromTemplate([
      {
        label: '退出应用',
        click: () => {
          app.quit();
        },
      },
    ]);
    tray.popUpContextMenu(contextMenuWindows);
	})

}

module.exports = { configureAppMenu };
