import './PlaybackControls.css'

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const

type PlaybackControlsProps = {
  isPlaying: boolean
  playbackSpeed: number
  hasVideo: boolean
  hasPrevious: boolean
  hasNext: boolean
  onTogglePlay: () => void
  onSkipBackward: () => void
  onSkipForward: () => void
  onSetSpeed: (speed: number) => void
  onPrevious: () => void
  onNext: () => void
  onToggleFullscreen: () => void
}

export function PlaybackControls({
  isPlaying,
  playbackSpeed,
  hasVideo,
  hasPrevious,
  hasNext,
  onTogglePlay,
  onSkipBackward,
  onSkipForward,
  onSetSpeed,
  onPrevious,
  onNext,
  onToggleFullscreen,
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
      <div className="playback-controls__group">
        <button
          onClick={onPrevious}
          disabled={!hasVideo || !hasPrevious}
          title="Previous video"
        >
          &#9198;
        </button>
        <button
          onClick={onSkipBackward}
          disabled={!hasVideo}
          title="Skip back 10s"
        >
          -10s
        </button>
        <button
          className="playback-controls__play"
          onClick={onTogglePlay}
          disabled={!hasVideo}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '\u23F8' : '\u25B6'}
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
          &#9197;
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
          &#x26F6;
        </button>
      </div>
    </div>
  )
}
