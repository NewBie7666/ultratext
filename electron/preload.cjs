const { contextBridge, ipcRenderer } = require('electron');

// 预加载脚本需使用 CommonJS（.cjs）以避免在某些环境下的 ESM 解析问题
contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (payload) => ipcRenderer.invoke('dialog:saveFile', payload),
  showSaveDialog: (suggestedPath, preferredFormat) => ipcRenderer.invoke('dialog:showSave', { suggestedPath, preferredFormat }),
  // (M7) Listen to native menu actions sent from main process
  onMenuAction: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, command) => {
      try { callback(command); } catch (e) { /* noop */ }
    };
    ipcRenderer.on('ipc-menu', handler);
    return () => ipcRenderer.removeListener('ipc-menu', handler);
  },
  // (M10) Listen for initial file open payload from main process
  onInitialOpenFile: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, payload) => {
      try { callback(payload); } catch (e) { /* noop */ }
    };
    ipcRenderer.on('ipc-initial-open-file', handler);
    return () => ipcRenderer.removeListener('ipc-initial-open-file', handler);
  },
});