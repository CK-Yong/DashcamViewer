import { useEffect, useRef } from 'react'
import type { VideoItem } from '../types'

export function useVideoPlayer(
  currentVideo: VideoItem | null,
  playbackSpeed: number,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const currentSrc = currentVideo?.objectUrl ?? null

  // Sync playback rate when speed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  // Auto-play when video source changes
  useEffect(() => {
    if (videoRef.current && currentSrc) {
      videoRef.current.play().catch(() => {
        // Browser may block autoplay; user will need to click play
      })
    }
  }, [currentSrc])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  function skip(seconds: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(
      0,
      Math.min(video.currentTime + seconds, video.duration || 0),
    )
  }

  function toggleFullscreen() {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      video.requestFullscreen().catch(() => {})
    }
  }

  return { videoRef, togglePlay, skip, toggleFullscreen }
}
