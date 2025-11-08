import { Menu } from 'electron'

// Create and set the native application menu
export function createMenu(win) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => win?.webContents?.send('ipc-menu', 'open'),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => win?.webContents?.send('ipc-menu', 'save'),
        },
        {
          label: 'Save As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => win?.webContents?.send('ipc-menu', 'saveAs'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find…',
          accelerator: 'CmdOrCtrl+F',
          click: () => win?.webContents?.send('ipc-menu', 'find'),
        },
        {
          label: 'Replace…',
          accelerator: 'CmdOrCtrl+H',
          click: () => win?.webContents?.send('ipc-menu', 'replace'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'View Shortcuts / Help',
          accelerator: 'CmdOrCtrl+Shift+/',
          click: () => win?.webContents?.send('ipc-menu', 'show-help'),
        },
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = await import('electron')
            shell.openExternal('https://www.electronjs.org')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}