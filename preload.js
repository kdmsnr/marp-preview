const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onMarpRendered: (callback) =>
    ipcRenderer.on('marp-rendered', (_event, data) => callback(data)),
});
