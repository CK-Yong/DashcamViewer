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

function IconVolume() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="3,9 7,9 12,4 12,20 7,15 3,15" />
      <path d="M16 8.5c1.3 1.3 1.3 5.7 0 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 5.5c3 3 3 10 0 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconVolumeMuted() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="3,9 7,9 12,4 12,20 7,15 3,15" />
      <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
  volume: number
  isMuted: boolean
  onChangeVolume: (volume: number) => void
  onToggleMute: () => void
  hideSeekbar?: boolean
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
  volume,
  isMuted,
  onChangeVolume,
  onToggleMute,
  hideSeekbar = false,
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
      {!hideSeekbar && (
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
      )}
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
          <div className="playback-controls__volume">
            <button
              onClick={onToggleMute}
              disabled={!hasVideo}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <IconVolumeMuted /> : <IconVolume />}
            </button>
            <input
              type="range"
              className="playback-controls__volume-slider"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              disabled={!hasVideo}
            />
          </div>
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
