import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { createMenu } from './menu.js';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// 某些显卡/驱动在 Electron 下会出现插入光标渲染异常（不显示或闪烁异常）
// 禁用硬件加速可显著缓解此类问题
app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: app.isPackaged
        ? path.join(app.getAppPath(), 'electron', 'preload.cjs')
        : path.join(process.cwd(), 'electron', 'preload.cjs'),
    },
    show: true,
  });
  const resolvedPreload = app.isPackaged
    ? path.join(app.getAppPath(), 'electron', 'preload.js')
    : path.join(process.cwd(), 'electron', 'preload.js');
  console.log('[electron] preload path (expected):', resolvedPreload);

  // Apply native application menu with accelerators and IPC bridge (M7)
  createMenu(win);

  // 生产环境中，确保插入光标样式不会因打包优化丢失
  win.webContents.on('did-finish-load', () => {
    win.webContents.insertCSS(`
      .ProseMirror { caret-color: var(--mantine-color-text) !important; color: var(--mantine-color-text) !important; background-color: var(--mantine-color-body) !important; }
      .ProseMirror * { caret-color: var(--mantine-color-text) !important; }
      .ProseMirror-focused .ProseMirror-gapcursor { display: block !important; }
    `);
    win.webContents.executeJavaScript('typeof window.api !== "undefined"')
      .then(present => {
        console.log('[electron] window.api present:', present);
      })
      .catch(err => console.error('[electron] window.api check error:', err));

    // (M10) If started with an associated file (e.g. double-click a .tiptap),
    // read its content and notify renderer to load it.
    try {
      const args = (process.argv || []).slice(1).filter(a => !!a && !a.startsWith('-'));
      const candidate = args.find(a => /\.(tiptap|json|md|markdown|txt)$/i.test(a));
      if (candidate && existsSync(candidate)) {
        const content = readFileSync(candidate, 'utf-8');
        win.webContents.send('ipc-initial-open-file', { filePath: candidate, content });
      }
    } catch (e) {
      console.warn('[electron] initial file open failed:', e);
    }
  });

  // 当渲染进程通过 beforeunload 阻止关闭时，允许用户确认并继续关闭
  // 这可修复：点击窗口右上角关闭或 File→Exit 无法退出的问题（未保存时被阻止）
  win.webContents.on('will-prevent-unload', (event) => {
    try {
      const choice = dialog.showMessageBoxSync(win, {
        type: 'warning',
        buttons: ['取消', '退出'],
        defaultId: 0,
        cancelId: 0,
        title: '确认退出',
        message: '当前文档尚未保存，是否确认退出？',
        detail: '退出将丢失未保存的内容。',
        normalizeAccessKeys: true,
      });
      // 选择“退出”则继续关闭窗口（忽略渲染进程的阻止）
      if (choice === 1) {
        event.preventDefault();
      }
      // 选择“取消”则保持窗口不变（不调用 preventDefault）
    } catch (e) {
      // 发生异常时，优先保证应用可退出
      event.preventDefault();
    }
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173/');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 使用 app.getAppPath() 以兼容 asar 打包后的资源路径
    const indexPath = path.join(app.getAppPath(), 'dist/index.html');
    win.loadFile(indexPath);
  }

  // IPC handlers for File -> Open and File -> Save
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: '打开文件',
      properties: ['openFile'],
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'JSON', extensions: ['json'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const filePath = result.filePaths[0];
    try {
      const content = readFileSync(filePath, 'utf-8');
      return { canceled: false, filePath, content };
    } catch (err) {
      return { canceled: false, filePath, error: String(err) };
    }
  });

  ipcMain.handle('dialog:saveFile', async (_evt, payload) => {
    const { suggestedPath, content, preferredFormat } = payload || {};
    let targetPath = suggestedPath;
    if (!targetPath) {
      const ext = preferredFormat === 'md' ? 'md' : preferredFormat === 'txt' ? 'txt' : 'json';
      const result = await dialog.showSaveDialog(win, {
        title: '保存文件',
        defaultPath: `untitled.${ext}`,
        filters: (function () {
          const filters = [
            { name: 'Markdown', extensions: ['md'] },
            { name: 'Text', extensions: ['txt'] },
            { name: 'JSON', extensions: ['json'] },
            { name: '所有文件', extensions: ['*'] },
          ];
          if (preferredFormat === 'md') return filters;
          if (preferredFormat === 'txt') return [filters[1], filters[0], filters[2], filters[3]];
          return [filters[2], filters[0], filters[1], filters[3]];
        })(),
      });
      if (result.canceled || !result.filePath) {
        return { canceled: true };
      }
      targetPath = result.filePath;
    }
    try {
      writeFileSync(targetPath, content ?? '', 'utf-8');
      return { canceled: false, filePath: targetPath };
    } catch (err) {
      return { canceled: false, filePath: targetPath, error: String(err) };
    }
  });

  // 可单独调起保存对话框以获路径（用于“另存为”）
  ipcMain.handle('dialog:showSave', async (_evt, payload) => {
    const { suggestedPath, preferredFormat } = payload || {};
    const ext = preferredFormat === 'md' ? 'md' : preferredFormat === 'txt' ? 'txt' : 'json';
    const result = await dialog.showSaveDialog(win, {
      title: '选择保存位置',
      defaultPath: suggestedPath || `untitled.${ext}`,
      filters: (function () {
        const filters = [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'Text', extensions: ['txt'] },
          { name: 'JSON', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] },
        ];
        if (preferredFormat === 'md') return filters;
        if (preferredFormat === 'txt') return [filters[1], filters[0], filters[2], filters[3]];
        return [filters[2], filters[0], filters[1], filters[3]];
      })(),
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    return { canceled: false, filePath: result.filePath };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});