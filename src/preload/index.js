const { contextBridge, ipcRenderer } = require('electron')

// Custom API for renderer process
const api = {
  openWebview: (url) => ipcRenderer.send('open-webview', url),
  getCookies: (url) => ipcRenderer.invoke('getCookies', url),
  downloadVideo: (url) => ipcRenderer.invoke('downloadVideo', url),
  receive: (channel, callback) => {
    ipcRenderer.on(channel, (event, data) => callback(data))
  }
}

// Expose APIs securely
contextBridge.exposeInMainWorld('api', api)
