import type { RefObject } from 'react'
import './VideoPlayer.css'

type VideoPlayerProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  src: string | null
  onEnded: () => void
  onPlay: () => void
  onPause: () => void
}

export function VideoPlayer({
  videoRef,
  src,
  onEnded,
  onPlay,
  onPause,
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
      />
    </div>
  )
}
