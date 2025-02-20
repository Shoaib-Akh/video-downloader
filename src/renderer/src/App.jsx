import { useEffect, useState } from 'react'
import { FaYoutube, FaDownload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import './App.css'

const socialLinks = [
  { name: 'YouTube', url: 'https://www.youtube.com', icon: <FaYoutube className="youtube-icon" /> }
  // {
  //   name: 'Instagram',
  //   url: 'https://www.instagram.com',
  //   icon: <FaInstagram className="instagram-icon" />
  // },
  // {
  //   name: 'Facebook',
  //   url: 'https://www.facebook.com',
  //   icon: <FaFacebook className="facebook-icon" />
  // }
]

function App() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [downloadStatus, setDownloadStatus] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('unknown')
  const [downloadedFile, setDownloadedFile] = useState('')
  const [formats, setFormats] = useState([])
  const [fileSize, setFileSize] = useState('')
  const [speed, setSpeed] = useState('')
  const [eta, setEta] = useState('')
  useEffect(() => {
    const fetchFormats = async () => {
      try {
        const availableFormats = await window.api.getFormats()
        setFormats(availableFormats)
      } catch (error) {
        console.error('Error loading formats:', error)
      }
    }
    fetchFormats()
  }, [])
  const fetchYoutubeCookies = async () => {
    if (!window.api?.getYoutubeCookies) {
      console.error('window.api.getYoutubeCookies is not defined.')
      return
    }

    try {
      window.api.getYoutubeCookies()
    } catch (error) {
      console.error('Error fetching YouTube cookies:', error)
    }
  }
  const fetchCookies = async () => {
    if (permissionStatus === 'unknown') {
      const userConsent = window.confirm('Do you allow this app to access cookies?')
      if (!userConsent) {
        setPermissionStatus('denied')
        alert('Cookie access denied!')
        return
      }
      fetchYoutubeCookies()
      setPermissionStatus('granted')
    }

    if (permissionStatus === 'granted') {
      try {
        window.api.getCookies(currentUrl)
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
      window.api.receive('download-progress', ({ progress, fileSize, speed, eta }) => {
        setDownloadProgress(progress)
        setFileSize(fileSize)
        setSpeed(speed)
        setEta(eta)
      })
    } else {
      console.error('window.api.receive is not defined.')
    }
  }, [])

  const handleDownload = async (formatId) => {
    if (!videoUrl.trim() || !formatId) {
      alert('Please enter a valid YouTube URL and select a format')
      return
    }
    try {
      setDownloadStatus('Downloading...')
      setIsDownloading(true)
      setDownloadProgress(0)
      setFileSize('')
      setSpeed('')
      setEta('')
      setDownloadedFile('')

      if (window.api?.downloadVideo) {
        await window.api.downloadVideo(videoUrl, formatId)
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

  return (
    <div className="app-container">
      <h2>🎬 YouTube Video Downloader</h2>

      <div className="input-container">
        <input
          type="text"
          placeholder="Enter YouTube URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </div>

      {formats.length > 0 && (
        <div className="formats-container">
          <h3>Select a Format:</h3>
          {formats.map((format) => (
            <button
              key={format.formatId}
              className="format-btn"
              onClick={() => handleDownload(format.formatId)}
            >
              {format.label}
            </button>
          ))}
        </div>
      )}

      {isDownloading && (
        <div className="progress-container">
          <h3>Download Progress:</h3>
          <p>
            <strong>File:</strong> {downloadedFile || 'Fetching filename...'}
          </p>
          <p>
            <strong>Size:</strong> {fileSize || 'Calculating...'}
          </p>
          <p>
            <strong>Speed:</strong> {speed || 'Waiting...'}
          </p>
          <p>
            <strong>ETA:</strong> {eta || '...'}
          </p>

          <div className="progress-bar">
            <div className="progress" style={{ width: `${downloadProgress}%` }}></div>
          </div>
          <p>{downloadProgress}%</p>
        </div>
      )}

      {downloadStatus && (
        <div className={`status-bar ${downloadProgress === 100 ? 'success' : 'error'}`}>
          <FaDownload className="status-icon" />
          <span>{downloadStatus}</span>
          {downloadProgress === 100 ? (
            <FaCheckCircle className="status-success" />
          ) : (
            <FaTimesCircle className="status-error" />
          )}
        </div>
      )}
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
    </div>
  )
}

export default App
