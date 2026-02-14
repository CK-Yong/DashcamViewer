import { useEffect, useRef, useState } from 'react'
import type { VideoItem } from '../types'

export function useVideoPlayer(
  currentVideo: VideoItem | null,
  playbackSpeed: number,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const currentSrc = currentVideo?.objectUrl ?? null
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

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

  // Track currentTime and duration from the video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function handleTimeUpdate() {
      setCurrentTime(video!.currentTime)
    }
    function handleDurationChange() {
      setDuration(video!.duration || 0)
    }
    function handleLoadedMetadata() {
      setDuration(video!.duration || 0)
      setCurrentTime(0)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [currentSrc])

  function seek(time: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
  }

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

  return { videoRef, togglePlay, skip, seek, toggleFullscreen, currentTime, duration }
}
