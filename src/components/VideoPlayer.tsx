import type { RefObject } from 'react'
import { useCallback, useRef, useState } from 'react'
import { PlaybackControls } from './PlaybackControls'
import './VideoPlayer.css'

type VideoPlayerProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  rearVideoRef: RefObject<HTMLVideoElement | null>
  src: string | null
  rearSrc: string | null
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
  volume: number
  isMuted: boolean
  onChangeVolume: (volume: number) => void
  onToggleMute: () => void
}

export function VideoPlayer({
  videoRef,
  rearVideoRef,
  src,
  rearSrc,
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
  volume,
  isMuted,
  onChangeVolume,
  onToggleMute,
}: VideoPlayerProps) {
  const PIP_MARGIN = 8
  const PIP_MIN_W = 120
  const playerRef = useRef<HTMLDivElement>(null)
  const pipRef = useRef<HTMLDivElement>(null)
  const [pipPos, setPipPos] = useState({ x: PIP_MARGIN, y: PIP_MARGIN })
  const [pipWidth, setPipWidth] = useState(0.25) // fraction of player width

  const dragRef = useRef<{ mode: 'move' | 'resize'; startX: number; startY: number; origX: number; origY: number; origW: number } | null>(null)

  const clamp = useCallback((x: number, y: number, w: number) => {
    const player = playerRef.current
    if (!player) return { x, y, w }
    const bounds = player.getBoundingClientRect()
    const pipW = w * bounds.width
    const pip = pipRef.current
    const pipH = pip ? pip.offsetHeight : pipW * 0.5625
    const maxX = bounds.width - pipW - PIP_MARGIN
    const maxY = bounds.height - pipH - PIP_MARGIN
    return {
      x: Math.max(PIP_MARGIN, Math.min(x, maxX)),
      y: Math.max(PIP_MARGIN, Math.min(y, maxY)),
      w,
    }
  }, [])

  const onPipPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { mode: 'move', startX: e.clientX, startY: e.clientY, origX: pipPos.x, origY: pipPos.y, origW: pipWidth }
  }, [pipPos, pipWidth])

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { mode: 'resize', startX: e.clientX, startY: e.clientY, origX: pipPos.x, origY: pipPos.y, origW: pipWidth }
  }, [pipPos, pipWidth])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    const player = playerRef.current
    if (!d || !player) return
    const bounds = player.getBoundingClientRect()
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY

    if (d.mode === 'move') {
      const clamped = clamp(d.origX + dx, d.origY + dy, pipWidth)
      setPipPos({ x: clamped.x, y: clamped.y })
    } else {
      const newW = Math.max(PIP_MIN_W / bounds.width, Math.min(0.5, d.origW + dx / bounds.width))
      const clamped = clamp(d.origX, d.origY, newW)
      setPipPos({ x: clamped.x, y: clamped.y })
      setPipWidth(clamped.w)
    }
  }, [clamp, pipWidth])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  if (!src) {
    return (
      <div className="video-player video-player--empty">
        <p>Select or add videos to start playback</p>
      </div>
    )
  }

  return (
    <div className="video-player" ref={playerRef}>
      <video
        ref={videoRef}
        src={src}
        className="video-player__video"
        onEnded={onEnded}
        onPlay={onPlay}
        onPause={onPause}
        onClick={onTogglePlay}
      />
      {rearSrc && (
        <div
          ref={pipRef}
          className="video-player__pip"
          style={{
            left: `${pipPos.x}px`,
            top: `${pipPos.y}px`,
            width: `${pipWidth * 100}%`,
          }}
          onPointerDown={onPipPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <video
            ref={rearVideoRef}
            src={rearSrc}
            className="video-player__pip-video"
            muted
            onLoadedData={() => {
              const front = videoRef.current
              const rear = rearVideoRef.current
              if (!front || !rear) return
              rear.currentTime = front.currentTime
              rear.playbackRate = front.playbackRate
              if (!front.paused) {
                rear.play().catch(() => {})
              }
            }}
          />
          <div
            className="video-player__pip-resize"
            onPointerDown={onResizePointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        </div>
      )}
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
          volume={volume}
          isMuted={isMuted}
          onChangeVolume={onChangeVolume}
          onToggleMute={onToggleMute}
        />
      </div>
    </div>
  )
}
