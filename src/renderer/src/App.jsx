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

  const [fileSize, setFileSize] = useState('')
  const [speed, setSpeed] = useState('')
  const [eta, setEta] = useState('')
  const [selectedVideoFormat, setSelectedVideoFormat] = useState('');
  const [selectedAudioFormat, setSelectedAudioFormat] = useState('');
  const [formats, setFormats] = useState([]);
console.log(selectedVideoFormat);
console.log(selectedAudioFormat);


  // useEffect(() => {
  //   const fetchFormats = async () => {
  //     try {
  //       const availableFormats = await window.api.getFormats()
  //       console.log("availableFormats",availableFormats);
        
  //       setFormats(availableFormats)
  //     } catch (error) {
  //       console.error('Error loading formats:', error)
  //     }
  //   }
  //   fetchFormats()
  // }, [])
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
      setPermissionStatus('granted')
    }

    if (permissionStatus === 'granted') {
      try {
        fetchYoutubeCookies()
      
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

  const handleDownload = async () => {
    if (!videoUrl.trim() || !selectedVideoFormat || !selectedAudioFormat) {
      alert('Please enter a valid YouTube URL and select both video and audio formats.');
      return;
    }
    try {
      setDownloadStatus('Downloading...');
      setIsDownloading(true);
      setDownloadProgress(0);
      setFileSize('');
      setSpeed('');
      setEta('');

      if (window.api?.downloadVideo) {
        await window.api.downloadVideo(videoUrl, selectedVideoFormat,selectedAudioFormat);
        setDownloadStatus('Download Complete ✅');
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      setDownloadStatus(`Error: ${error.message}`);
      setDownloadProgress(0);
    } finally {
      setTimeout(() => setIsDownloading(false), 3000);
    }
  };

  const handleSocialIconClick = (url) => {
    fetchCookies()

    if (window.api?.openWebview) {
      setCurrentUrl(url)
      window.api.openWebview(url)
    } else {
      console.error('window.api.openWebview is not defined')
    }
  }
  const fetchFormats = async () => {
    if (!videoUrl.trim()) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    try {
    
      const availableFormats = await window.api.getFormats(videoUrl);
      
      // ✅ Filter only required formats (720p, 1080p MP4 & Audio)
     

      setFormats(availableFormats);
     
    } catch (error) {
      console.error('Error fetching formats:', error);
      setDownloadStatus('Failed to fetch formats');
    }
  };
  useEffect(()=>{
    if (videoUrl) {
      
      fetchFormats()
    }},[videoUrl])
    const getAudioFormats = (formats) => {
      return formats.filter((f) => f.quality === 'audio only');
    };
    
    // 🎬 Filter Function for Video Formats
    const getVideoFormats = (formats) => {
      return formats.filter((f) => f.quality !== 'audio only');
    };
    
    // 🛠️ Now you can call:
    const audioFormats = getAudioFormats(formats);
    const videoFormats = getVideoFormats(formats);
   

    
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

      {audioFormats?.length  && videoFormats?.length > 0 && (
        <div className="dropdown-container">
          <div>
            <h3>Select Video Format:</h3>
            <select onChange={(e) => setSelectedVideoFormat(e.target.value)}>
              <option value="">Select Video Format</option>
              {videoFormats.map((format) => (
                <option key={format.formatId} value={format.formatId}>
                  {format.formatType
                  }
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3>Select Audio Format:</h3>
            <select onChange={(e) => setSelectedAudioFormat(e.target.value)}>
              <option value="">Select Audio Format</option>
              {audioFormats?.map((format) => (
                <option key={format.formatId} value={format.formatId}>
                  {format.formatType
                  }
                </option>
              ))}
            </select>
          </div>

          <button className="download-btn" onClick={handleDownload} disabled={!selectedVideoFormat || !selectedAudioFormat}>
            <FaDownload /> Download
          </button>
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
