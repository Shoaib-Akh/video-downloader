import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const { exec } = require('child_process')

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      webviewTag: false,
      nativeWindowOpen: true,
      nodeIntegration: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
// ipcMain.on('open-webview', (event, url) => {
//   let webviewWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       webviewTag: true,
//     },
//   });

//   webviewWindow.loadURL(url);
// });
ipcMain.on('open-webview', (event, url) => {
  let webviewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      webviewTag: true,

      nodeIntegration: false, // ⚠️  Crucial for security
      contextIsolation: true
    }
  })

  webviewWindow.loadURL(url)

  // Optional: Handle window close event
  webviewWindow.on('closed', () => {
    webviewWindow = null
  })
})
ipcMain.handle('getCookies', async (event, url) => {
  console.log('url', url)

  try {
    // Extract origin from URL

    const cookies = await session.defaultSession.cookies.get({ url }) // Filter by origin

    return cookies
  } catch (error) {
    console.error('Error getting cookies:', error)
    return [] // Return empty array on error
  }
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// ipcMain.handle('downloadVideo', async (event, url) => {
//   return new Promise((resolve, reject) => {
//     // Determine the correct yt-dlp executable based on OS
//     const ytdlpPath = app.isPackaged
//       ? process.platform === 'darwin'
//         ? join(process.resourcesPath, 'yt-dlp_macos') // MacOS executable
//         : join(process.resourcesPath, 'yt-dlp.exe') // Windows executable
//       : process.platform === 'darwin'
//         ? join(__dirname, '../../public/yt-dlp_macos')
//         : join(__dirname, '../../public/yt-dlp.exe')

//     const downloadDir = app.getPath('downloads') // Standard downloads directory
//     const downloadPath = join(downloadDir, '%(title)s.%(ext)s') // Common path format

//     // Ensure the correct execution permission for macOS
//     if (process.platform === 'darwin') {
//       exec(`chmod +x "${ytdlpPath}"`, (err) => {
//         if (err) {
//           console.error('Failed to set executable permission:', err)
//           reject(`Error: ${err}`)
//           return
//         }

//         // Run yt-dlp command
//         const command = `"${ytdlpPath}" -o "${downloadPath}" "${url}"`
//         exec(command, (error, stdout, stderr) => {
//           if (error) {
//             console.error('Download error:', stderr)
//             reject(`Error: ${stderr}`)
//           } else {
//             console.log('Download complete:', stdout)
//             resolve(stdout)
//           }
//         })
//       })
//     } else {
//       // Run yt-dlp command (Windows)
//       const command = `"${ytdlpPath}" -o "${downloadPath}" "${url}"`
//       exec(command, (error, stdout, stderr) => {
//         if (error) {
//           console.error('Download error:', stderr)
//           reject(`Error: ${stderr}`)
//         } else {
//           console.log('Download complete:', stdout)
//           resolve(stdout)
//         }
//       })
//     }
//   })
// })

ipcMain.handle('downloadVideo', async (event, url) => {
  return new Promise((resolve, reject) => {
    const ytdlpPath = app.isPackaged
      ? process.platform === 'darwin'
        ? join(process.resourcesPath, 'yt-dlp_macos')
        : join(process.resourcesPath, 'yt-dlp.exe')
      : process.platform === 'darwin'
        ? join(__dirname, '../../public/yt-dlp_macos')
        : join(__dirname, '../../public/yt-dlp.exe')

    const downloadDir = app.getPath('downloads')
    const downloadPath = join(downloadDir, '%(title)s.%(ext)s')

    let command = `"${ytdlpPath}" -o "${downloadPath}" --progress-template "Downloading: %(progress._percent_str)s - %(filename)s" "${url}"`

    // ✅ Correcting potential typo - Only use `process`, not `process2`
    const childProcess = exec(command) // Changed from `process2` to `childProcess`

    childProcess.stdout.on('data', (data) => {
      console.log('Progress:', data)

      const progressMatch = data.match(/(\d+\.?\d*)%\s-\s(.+)/)
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]) // Extract progress percentage
        const filename = progressMatch[2].trim() // Extract the filename

        event.sender.send('download-progress', { progress, filename })
      }
    })

    childProcess.stderr.on('data', (data) => {
      console.error('Download Error:', data)
    })

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve('Download completed')
      } else {
        reject('Download failed')
      }
    })
  })
})
