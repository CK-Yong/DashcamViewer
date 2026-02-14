import { useEffect, useReducer } from 'react'
import { appReducer, initialState } from './reducer'
import { Header } from './components/Header'
import { VideoPlayer } from './components/VideoPlayer'
import { PlaybackControls } from './components/PlaybackControls'
import { MapPlaceholder } from './components/MapPlaceholder'
import { PlaylistPanel } from './components/PlaylistPanel'
import { useVideoPlayer } from './hooks/useVideoPlayer'
import './App.css'

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const currentVideo =
    state.currentIndex >= 0 ? state.playlist[state.currentIndex] : null
  const videoPlayer = useVideoPlayer(currentVideo, state.playbackSpeed)

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

  return (
    <div className="app">
      <Header
        onFilesSelected={(files) => dispatch({ type: 'ADD_VIDEOS', files })}
        onClearAll={() => dispatch({ type: 'CLEAR_PLAYLIST' })}
        hasVideos={state.playlist.length > 0}
      />
      <div className="main-layout">
        <div className="video-section">
          <VideoPlayer
            videoRef={videoPlayer.videoRef}
            src={currentVideo?.objectUrl ?? null}
            onEnded={() => dispatch({ type: 'NEXT_VIDEO' })}
            onPlay={() => dispatch({ type: 'SET_PLAYING', playing: true })}
            onPause={() => dispatch({ type: 'SET_PLAYING', playing: false })}
          />
          <PlaybackControls
            isPlaying={state.isPlaying}
            playbackSpeed={state.playbackSpeed}
            hasVideo={currentVideo !== null}
            hasPrevious={state.currentIndex > 0}
            hasNext={state.currentIndex < state.playlist.length - 1}
            onTogglePlay={videoPlayer.togglePlay}
            onSkipForward={() => videoPlayer.skip(10)}
            onSkipBackward={() => videoPlayer.skip(-10)}
            onSetSpeed={(speed) => dispatch({ type: 'SET_SPEED', speed })}
            onPrevious={() => dispatch({ type: 'PREVIOUS_VIDEO' })}
            onNext={() => dispatch({ type: 'NEXT_VIDEO' })}
            onToggleFullscreen={videoPlayer.toggleFullscreen}
          />
        </div>
        <div className="map-section">
          <MapPlaceholder currentVideo={currentVideo} />
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
