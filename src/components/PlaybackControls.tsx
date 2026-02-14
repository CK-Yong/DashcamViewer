import './PlaybackControls.css'

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const
const ICON = 18

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function IconPrevTrack() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="5" width="3" height="14" />
      <polygon points="21,5 9,12 21,19" />
    </svg>
  )
}

function IconNextTrack() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="3,5 15,12 3,19" />
      <rect x="18" y="5" width="3" height="14" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 21,12 5,21" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="3" width="4" height="18" />
      <rect x="15" y="3" width="4" height="18" />
    </svg>
  )
}

function IconFullscreen() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,8 3,3 8,3" />
      <polyline points="16,3 21,3 21,8" />
      <polyline points="21,16 21,21 16,21" />
      <polyline points="8,21 3,21 3,16" />
    </svg>
  )
}

type PlaybackControlsProps = {
  isPlaying: boolean
  playbackSpeed: number
  hasVideo: boolean
  hasPrevious: boolean
  hasNext: boolean
  currentTime: number
  duration: number
  onTogglePlay: () => void
  onSkipBackward: () => void
  onSkipForward: () => void
  onSetSpeed: (speed: number) => void
  onPrevious: () => void
  onNext: () => void
  onToggleFullscreen: () => void
  onSeek: (time: number) => void
}

export function PlaybackControls({
  isPlaying,
  playbackSpeed,
  hasVideo,
  hasPrevious,
  hasNext,
  currentTime,
  duration,
  onTogglePlay,
  onSkipBackward,
  onSkipForward,
  onSetSpeed,
  onPrevious,
  onNext,
  onToggleFullscreen,
  onSeek,
}: PlaybackControlsProps) {
  function cycleSpeed() {
    const currentIdx = SPEED_OPTIONS.indexOf(
      playbackSpeed as (typeof SPEED_OPTIONS)[number],
    )
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length
    onSetSpeed(SPEED_OPTIONS[nextIdx])
  }

  return (
    <div className="playback-controls">
      <div className="playback-controls__seekbar">
        <span className="playback-controls__time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="playback-controls__slider"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={!hasVideo}
        />
        <span className="playback-controls__time">{formatTime(duration)}</span>
      </div>
      <div className="playback-controls__buttons">
        <div className="playback-controls__group">
          <button
            onClick={onPrevious}
            disabled={!hasVideo || !hasPrevious}
            title="Previous video"
          >
            <IconPrevTrack />
          </button>
          <button
            onClick={onSkipBackward}
            disabled={!hasVideo}
            title="Skip back 10s"
          >
            -10s
          </button>
          <button
            onClick={onTogglePlay}
            disabled={!hasVideo}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button
            onClick={onSkipForward}
            disabled={!hasVideo}
            title="Skip forward 10s"
          >
            +10s
          </button>
          <button
            onClick={onNext}
            disabled={!hasVideo || !hasNext}
            title="Next video"
          >
            <IconNextTrack />
          </button>
        </div>
        <div className="playback-controls__group">
          <button
            onClick={cycleSpeed}
            disabled={!hasVideo}
            title="Playback speed"
          >
            {playbackSpeed}x
          </button>
          <button
            onClick={onToggleFullscreen}
            disabled={!hasVideo}
            title="Toggle fullscreen"
          >
            <IconFullscreen />
          </button>
        </div>
      </div>
    </div>
  )
}
