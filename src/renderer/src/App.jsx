import { useEffect, useState } from 'react'
import { FaYoutube, FaDownload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import './App.css'

const socialLinks = [
  { name: 'YouTube', url: 'https://www.youtube.com', icon: <FaYoutube className="youtube-icon" /> }
]

// Predefined options for resolution & audio format
const qualityOptions = ["360", "480", "720", "1080", "1440", "2160"]
const audioFormatsd = ["mp3", "aac", "wav", "flac"]

function App() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [downloadStatus, setDownloadStatus] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('unknown')
  const [downloadedFile, setDownloadedFile] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [speed, setSpeed] = useState('')
  const [eta, setEta] = useState('')

  // Default selected resolution & audio format
  const [selectedQuality, setSelectedQuality] = useState("720")
  const [selectedAudioFormat, setSelectedAudioFormat] = useState("mp3")

  useEffect(() => {
    if (window.api?.receive) {
      window.api.receive('download-progress', (data) => {
        // data = { progress, fileSize, speed, eta, status, file }
        setDownloadProgress(data.progress || 0)
        setFileSize(data.fileSize || '')
        setSpeed(data.speed || '')
        setEta(data.eta || '')
        setDownloadedFile(data.file || '')
        setDownloadStatus(data.status || '')
      })
    }
  }, [])

  const fetchYoutubeCookies = async () => {
    if (!window.api?.getYoutubeCookies) return
    try {
      await window.api.getYoutubeCookies()
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
      setPermissionStatus('granted')
    }
    if (permissionStatus === 'granted') {
      fetchYoutubeCookies()
    }
  }

  const handleSocialIconClick = (url) => {
    fetchCookies()
    if (window.api?.openWebview) {
      setCurrentUrl(url)
      window.api.openWebview(url)
    }
  }

  const handleDownload = async () => {
    if (!videoUrl.trim()) {
      alert('Please enter a valid YouTube URL.')
      return
    }
    try {
      setDownloadStatus('Starting download...')
      setIsDownloading(true)
      setDownloadProgress(0)
      setFileSize('')
      setSpeed('')
      setEta('')
      setDownloadedFile('')

      if (window.api?.downloadVideo) {
        await window.api.downloadVideo(videoUrl, {
          resolution: selectedQuality,
          audioFormat: selectedAudioFormat
        })
        setDownloadStatus('Download Complete ✅')
      } else {
        throw new Error('Main API not available')
      }
    } catch (error) {
      setDownloadStatus(`Error: ${error.message}`)
      setDownloadProgress(0)
    } finally {
      setTimeout(() => setIsDownloading(false), 5000)
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

      <div className="dropdown-container">
        <h3>Video Resolution:</h3>
        <select
          value={selectedQuality}
          onChange={(e) => setSelectedQuality(e.target.value)}
        >
          {qualityOptions.map((quality) => (
            <option key={quality} value={quality}>
              {quality}p
            </option>
          ))}
        </select>
      </div>

      <div className="dropdown-container">
        <h3>Audio Format:</h3>
        <select
          value={selectedAudioFormat}
          onChange={(e) => setSelectedAudioFormat(e.target.value)}
        >
          {audioFormatsd.map((af) => (
            <option key={af} value={af}>
              {af.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <button
        className="download-btn"
        onClick={handleDownload}
        disabled={!videoUrl.trim()}
      >
        <FaDownload /> Download
      </button>

      {isDownloading && (
        <div className="progress-container">
          <h3>Download Progress:</h3>
          <p><strong>File:</strong> {downloadedFile || 'Fetching filename...'}</p>
          <p><strong>Size:</strong> {fileSize || 'Calculating...'}</p>
          <p><strong>Speed:</strong> {speed || 'Waiting...'}</p>
          <p><strong>ETA:</strong> {eta || '...'}</p>
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <p>{downloadProgress.toFixed(2)}%</p>
        </div>
      )}

      {downloadStatus && (
        <div
          className={`status-bar ${
            downloadProgress === 100 ? 'success' : 'error'
          }`}
        >
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
