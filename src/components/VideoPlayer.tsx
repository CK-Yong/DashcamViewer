import type { RefObject } from 'react'
import { PlaybackControls } from './PlaybackControls'
import './VideoPlayer.css'

type VideoPlayerProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  src: string | null
  isPlaying: boolean
  playbackSpeed: number
  hasPrevious: boolean
  hasNext: boolean
  currentTime: number
  duration: number
  onEnded: () => void
  onPlay: () => void
  onPause: () => void
  onTogglePlay: () => void
  onSkipBackward: () => void
  onSkipForward: () => void
  onSetSpeed: (speed: number) => void
  onPrevious: () => void
  onNext: () => void
  onToggleFullscreen: () => void
  onSeek: (time: number) => void
}

export function VideoPlayer({
  videoRef,
  src,
  isPlaying,
  playbackSpeed,
  hasPrevious,
  hasNext,
  currentTime,
  duration,
  onEnded,
  onPlay,
  onPause,
  onTogglePlay,
  onSkipBackward,
  onSkipForward,
  onSetSpeed,
  onPrevious,
  onNext,
  onToggleFullscreen,
  onSeek,
}: VideoPlayerProps) {
  if (!src) {
    return (
      <div className="video-player video-player--empty">
        <p>Select or add videos to start playback</p>
      </div>
    )
  }

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={src}
        className="video-player__video"
        onEnded={onEnded}
        onPlay={onPlay}
        onPause={onPause}
        onClick={onTogglePlay}
      />
      <div className="video-player__overlay">
        <PlaybackControls
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          hasVideo
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={onTogglePlay}
          onSkipBackward={onSkipBackward}
          onSkipForward={onSkipForward}
          onSetSpeed={onSetSpeed}
          onPrevious={onPrevious}
          onNext={onNext}
          onToggleFullscreen={onToggleFullscreen}
          onSeek={onSeek}
        />
      </div>
    </div>
  )
}
