import { useEffect, useRef, useState } from 'react'
import type { VideoItem } from '../types'

export function useVideoPlayer(
  currentVideo: VideoItem | null,
  playbackSpeed: number,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rearVideoRef = useRef<HTMLVideoElement>(null)
  const currentSrc = currentVideo?.objectUrl ?? null
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Sync playback rate when speed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed
    }
    if (rearVideoRef.current) {
      rearVideoRef.current.playbackRate = playbackSpeed
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

  // Sync rear video with front video play/pause/seek
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function syncRear() {
      const rear = rearVideoRef.current
      if (!rear) return
      rear.currentTime = video!.currentTime
      rear.playbackRate = video!.playbackRate
      if (!video!.paused) {
        rear.play().catch(() => {})
      } else {
        rear.pause()
      }
    }

    video.addEventListener('play', syncRear)
    video.addEventListener('pause', syncRear)
    video.addEventListener('seeked', syncRear)

    return () => {
      video.removeEventListener('play', syncRear)
      video.removeEventListener('pause', syncRear)
      video.removeEventListener('seeked', syncRear)
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
    if (rearVideoRef.current) {
      rearVideoRef.current.currentTime = time
    }
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      rearVideoRef.current?.play().catch(() => {})
    } else {
      video.pause()
      rearVideoRef.current?.pause()
    }
  }

  function skip(seconds: number) {
    const video = videoRef.current
    if (!video) return
    const newTime = Math.max(
      0,
      Math.min(video.currentTime + seconds, video.duration || 0),
    )
    video.currentTime = newTime
    if (rearVideoRef.current) {
      rearVideoRef.current.currentTime = newTime
    }
  }

  function changeVolume(value: number) {
    const clamped = Math.max(0, Math.min(1, value))
    setVolume(clamped)
    setIsMuted(clamped === 0)
    if (videoRef.current) {
      videoRef.current.volume = clamped
      videoRef.current.muted = clamped === 0
    }
  }

  function toggleMute() {
    const next = !isMuted
    setIsMuted(next)
    if (videoRef.current) {
      videoRef.current.muted = next
    }
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

  return { videoRef, rearVideoRef, togglePlay, skip, seek, toggleFullscreen, changeVolume, toggleMute, currentTime, duration, volume, isMuted }
}
