import { useEffect, useReducer } from 'react'
import { appReducer, initialState } from './reducer'
import { Header } from './components/Header'
import { VideoPlayer } from './components/VideoPlayer'
import { DashcamMap } from './components/DashcamMap'
import { GpsStats } from './components/GpsStats'
import { PlaylistPanel } from './components/PlaylistPanel'
import { useVideoPlayer } from './hooks/useVideoPlayer'
import { useGpsExtraction } from './hooks/useGpsExtraction'
import './App.css'

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const currentVideo =
    state.currentIndex >= 0 ? state.playlist[state.currentIndex] : null
  const videoPlayer = useVideoPlayer(currentVideo, state.playbackSpeed)
  const { extractGps } = useGpsExtraction(state, dispatch, videoPlayer.currentTime, videoPlayer.duration)

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          videoPlayer.togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          videoPlayer.skip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          videoPlayer.skip(10)
          break
        case 'f':
          videoPlayer.toggleFullscreen()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  // Clean up all object URLs on unmount
  useEffect(() => {
    return () => {
      for (const item of state.playlist) {
        URL.revokeObjectURL(item.objectUrl)
      }
    }
    // Only run cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFilesSelected(files: File[], fileList: FileList) {
    dispatch({ type: 'ADD_VIDEOS', files })
    extractGps(fileList)
  }

  return (
    <div className="app">
      <Header
        onFilesSelected={handleFilesSelected}
        onClearAll={() => dispatch({ type: 'CLEAR_PLAYLIST' })}
        hasVideos={state.playlist.length > 0}
      />
      <div className="main-layout">
        <div className="video-section">
          <VideoPlayer
            videoRef={videoPlayer.videoRef}
            src={currentVideo?.objectUrl ?? null}
            isPlaying={state.isPlaying}
            playbackSpeed={state.playbackSpeed}
            hasPrevious={state.currentIndex > 0}
            hasNext={state.currentIndex < state.playlist.length - 1}
            currentTime={videoPlayer.currentTime}
            duration={videoPlayer.duration}
            onEnded={() => dispatch({ type: 'NEXT_VIDEO' })}
            onPlay={() => dispatch({ type: 'SET_PLAYING', playing: true })}
            onPause={() => dispatch({ type: 'SET_PLAYING', playing: false })}
            onTogglePlay={videoPlayer.togglePlay}
            onSkipForward={() => videoPlayer.skip(10)}
            onSkipBackward={() => videoPlayer.skip(-10)}
            onSetSpeed={(speed) => dispatch({ type: 'SET_SPEED', speed })}
            onPrevious={() => dispatch({ type: 'PREVIOUS_VIDEO' })}
            onNext={() => dispatch({ type: 'NEXT_VIDEO' })}
            onToggleFullscreen={videoPlayer.toggleFullscreen}
            onSeek={videoPlayer.seek}
            volume={videoPlayer.volume}
            isMuted={videoPlayer.isMuted}
            onChangeVolume={videoPlayer.changeVolume}
            onToggleMute={videoPlayer.toggleMute}
          />
          <GpsStats gps={state.gps} />
        </div>
        <div className="map-section">
          <DashcamMap
            allTracks={state.gps.allGpsTracks}
            activeTrackIndex={state.gps.activeTrackIndex}
            position={state.gps.currentPosition}
          />
        </div>
      </div>
      <PlaylistPanel
        playlist={state.playlist}
        currentIndex={state.currentIndex}
        onSelect={(index) => dispatch({ type: 'SELECT_VIDEO', index })}
        onRemove={(id) => dispatch({ type: 'REMOVE_VIDEO', id })}
        onReorder={(activeId, overId) =>
          dispatch({ type: 'REORDER_PLAYLIST', activeId, overId })
        }
      />
    </div>
  )
}

export default App
