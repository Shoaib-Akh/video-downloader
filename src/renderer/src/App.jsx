import { useEffect, useState } from 'react'
import electronLogo from './assets/electron.svg'
import {
  FaYoutube,
  FaInstagram,
  FaFacebook,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa'
import './App.css'

const socialLinks = [
  { name: 'YouTube', url: 'https://www.youtube.com', icon: <FaYoutube className="youtube-icon" /> },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com',
    icon: <FaInstagram className="instagram-icon" />
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com',
    icon: <FaFacebook className="facebook-icon" />
  }
]

function App() {
  const [showIcons, setShowIcons] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const [cookies, setCookies] = useState([])
  const [videoUrl, setVideoUrl] = useState('')
  const [downloadStatus, setDownloadStatus] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('unknown')
  const [downloadedFile, setDownloadedFile] = useState('')

  const fetchCookies = async () => {
    if (permissionStatus === 'unknown') {
      const userConsent = window.confirm('Do you allow this app to access cookies?')
      if (!userConsent) {
        setPermissionStatus('denied')
        alert('Cookie access denied!')
        return
      }
      setPermissionStatus('granted')
    }

    if (permissionStatus === 'granted') {
      try {
        const result = await window.api.getCookies(currentUrl)
        setCookies(result)
      } catch (error) {
        console.error('Error fetching cookies:', error)
        setPermissionStatus('denied')
      }
    }
  }
  useEffect(() => {
    if (currentUrl) {
      fetchCookies()
    }
  }, [currentUrl])

  useEffect(() => {
    if (window.api?.receive) {
      // ✅ Ensure the function exists before calling
      window.api.receive('download-progress', ({ progress, filename }) => {
        setDownloadProgress(progress)
        setDownloadedFile(filename)
      })
    } else {
      console.error('window.api.receive is not defined.')
    }
  }, [])
  console.log('downloadProgress', downloadProgress)

  const handleDownload = async () => {
    if (!videoUrl.trim()) {
      alert('Please enter a valid YouTube URL')
      return
    }

    try {
      setDownloadStatus('Downloading...')
      setIsDownloading(true)
      setDownloadProgress(0)
      setDownloadedFile('')

      if (window.api?.downloadVideo) {
        await window.api.downloadVideo(videoUrl)
        setDownloadStatus('Download Complete ✅')
      } else {
        throw new Error('API not available')
      }
    } catch (error) {
      setDownloadStatus(`Error: ${error.message}`)
      setDownloadProgress(0)
    } finally {
      setTimeout(() => setIsDownloading(false), 3000)
    }
  }

  const handleSocialIconClick = (url) => {
    fetchCookies()

    if (window.api?.openWebview) {
      setCurrentUrl(url)
      window.api.openWebview(url)
    } else {
      console.error('window.api.openWebview is not defined')
    }
  }

  // if (permissionStatus !== "granted") {
  //   return console.log("sddss");

  // }

  return (
    <div className="app-container">
      <h2>Electron Video Downloader</h2>

      <div className="input-container">
        <input
          type="text"
          placeholder="Enter YouTube URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button onClick={handleDownload} className="download-btn" disabled={isDownloading}>
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
      </div>

      {isDownloading && (
        <div className="progress-container">
          <p>Downloading: {downloadedFile || 'Fetching filename...'}</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${downloadProgress}%` }}></div>
          </div>
          <p>{downloadProgress}%</p>
        </div>
      )}

      {downloadStatus && (
        <div className="status-bar">
          <FaDownload className="status-icon" />
          <span>{downloadStatus}</span>
          {downloadProgress === 100 ? (
            <FaCheckCircle className="status-success" />
          ) : (
            <FaTimesCircle className="status-error" />
          )}
        </div>
      )}

      {currentUrl && permissionStatus !== 'denied' && (
        <button onClick={fetchCookies} className="fetch-btn">
          Fetch Cookies
        </button>
      )}

      <img
        src={electronLogo}
        alt="Electron Logo"
        className="logo"
        onClick={() => setShowIcons(!showIcons)}
      />

      {showIcons && (
        <div className="social-icons">
          {socialLinks.map((social) => (
            <div
              key={social.name}
              className="social-icon"
              onClick={() => handleSocialIconClick(social.url)}
            >
              {social.icon}
            </div>
          ))}
        </div>
      )}

      {cookies.length > 0 && (
        <div className="cookies-container">
          <h3>Cookies:</h3>
          <ul>
            {cookies.map(
              (cookie) => console.log(' show: false,', cookie)
              // <li key={index}>
              //   <strong>{cookie.name}:</strong> {cookie.value}
              // </li>
            )}
          </ul>
        </div>
      )}

      {/* {isDownloading && (
        <div className="status-bar">
          <FaDownload className="status-icon" />
          <span>{downloadStatus}</span>
          {downloadProgress === 100 ? (
            <FaCheckCircle className="status-success" />
          ) : (
            <FaTimesCircle className="status-error" />
          )}
        </div>
      )} */}
    </div>
  )
}

export default App
