const { contextBridge, ipcRenderer } = require('electron')

// Custom API for renderer process
const api = {
  openWebview: (url) => ipcRenderer.send('open-webview', url),
  downloadVideo: (videoUrl, options) => 
    ipcRenderer.invoke('downloadVideo', { url: videoUrl, ...options }),
  getYoutubeCookies: () => ipcRenderer.invoke('getYoutubeCookies'),
  // getFormats: () => ipcRenderer.invoke('getFormats'),
  getFormats: (url) => ipcRenderer.invoke('getFormats', url),
  videoChanged: (newUrl) => ipcRenderer.send('videoChanged', newUrl),


  receive: (channel, callback) => {
    ipcRenderer.on(channel, (event, data) => callback(data))
  }
}

// Expose APIs securely
contextBridge.exposeInMainWorld('api', api)
