import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { writeFileSync } from 'fs'
import { readFileSync } from 'fs'
const { exec } = require('child_process')
const ytdlpPath = app.isPackaged
  ? join(process.resourcesPath, 'yt-dlp.exe')
  : join(__dirname, '../../public/yt-dlp.exe')
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
  try {
    // Extract origin from URL

    const cookies = await session.defaultSession.cookies.get({ url }) // Filter by origin

    return cookies
  } catch (error) {
    console.error('Error getting cookies:', error)
    return [] // Return empty array on error
  }
})

ipcMain.handle('downloadVideo', async (event, url, formatId) => {
  return new Promise((resolve, reject) => {
    const cookiesPath = join(app.getPath('userData'), 'cookies.txt')
    const downloadDir = app.getPath('downloads')
    const downloadPath = join(downloadDir, '%(title)s.%(ext)s')

    let command = `"${ytdlpPath}" -o "${downloadPath}" --cookies "${cookiesPath}" -f ${formatId} "${url}"`

    const process = exec(command)

    process.stdout.on('data', (data) => {
      const progressMatch = data.match(
        /(\d+\.?\d*)%\s+of\s+([\d.]+[KMG]iB)\s+at\s+([\d.]+[KMG]?iB\/s)\s+ETA\s+([\d:]+)/
      )
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]) // Progress %
        const fileSize = progressMatch[2] // Total file size
        const speed = progressMatch[3] // Download speed
        const eta = progressMatch[4] // Estimated time remaining

        event.sender.send('download-progress', { progress, fileSize, speed, eta })
      }
    })

    process.stderr.on('data', (data) => {
      console.error('Download Error:', data)
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve('Download completed')
      } else {
        reject('Download failed')
      }
    })
  })
})
const cookiesPath = app.isPackaged
  ? join(process.resourcesPath, 'cookies.txt') // ✅ Correct path when packaged
  : join(__dirname, '../../public/cookies.txt') // ✅ Correct path in development

ipcMain.handle('getYoutubeCookies', async () => {
  try {
    const cookies = await session.defaultSession.cookies.get({ domain: '.youtube.com' })

    if (!cookies.length) {
      console.error('No YouTube cookies found.')
      return 'No cookies available'
    }

    // ✅ Convert cookies to the correct format for yt-dlp
    const cookieData = cookies
      .map(
        (cookie) =>
          `${cookie.domain} TRUE ${cookie.path} ${cookie.secure ? 'TRUE' : 'FALSE'} ${cookie.expirationDate || 0} ${cookie.name} ${cookie.value}`
      )
      .join('\n')

    // ✅ Save to cookies.txt
    writeFileSync(cookiesPath, cookieData, 'utf-8')

    return cookiesPath // Return the path to be used in yt-dlp
  } catch (error) {
    console.error('Error getting YouTube cookies:', error)
    return ''
  }
})
const formatsFile = join(__dirname, '../../public/formats.json')
const availableFormats = JSON.parse(readFileSync(formatsFile, 'utf8'))
ipcMain.handle('getFormats', async () => {
  return availableFormats
})
