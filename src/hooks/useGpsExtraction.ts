import { useCallback, useEffect, useRef } from 'react'
import { GpsLoaderFactory } from '../extract-gps/gps-parser-factory.ts'
import type { GpsData } from '../extract-gps/gps.ts'
import type { Action, AppState } from '../types.ts'

const loaderFactory = new GpsLoaderFactory()

export function useGpsExtraction(
  state: AppState,
  dispatch: React.Dispatch<Action>,
  currentTime: number,
  duration: number,
) {
  const gpsTrackRef = useRef<GpsData[]>(state.gps.currentGpsTrack)
  const dashCamVideosRef = useRef(state.gps.dashCamVideos)

  useEffect(() => {
    gpsTrackRef.current = state.gps.currentGpsTrack
  }, [state.gps.currentGpsTrack])

  useEffect(() => {
    dashCamVideosRef.current = state.gps.dashCamVideos
  }, [state.gps.dashCamVideos])

  const extractGps = useCallback(
    async (files: FileList) => {
      const loader = loaderFactory.get(files)

      dispatch({ type: 'GPS_EXTRACTION_START', total: files.length })

      const dashCamVideos = await loader.loadVideos(() => {
        dispatch({ type: 'GPS_EXTRACTION_PROGRESS' })
      })

      dispatch({ type: 'GPS_EXTRACTION_COMPLETE', dashCamVideos })
    },
    [dispatch],
  )

  // Sync GPS position with video playback time
  useEffect(() => {
    const track = gpsTrackRef.current
    if (track.length === 0 || !duration || duration === 0) return

    const progress = currentTime / duration
    const index = Math.min(
      Math.floor(progress * track.length),
      track.length - 1,
    )

    dispatch({ type: 'GPS_SET_POSITION', position: track[index] })
  }, [currentTime, duration, dispatch])

  // Update GPS track when current video changes
  useEffect(() => {
    const dashCamVideos = dashCamVideosRef.current
    const currentVideo = state.currentIndex >= 0 ? state.playlist[state.currentIndex] : null

    if (!currentVideo || dashCamVideos.length === 0) return

    // Find the matching dashcam video by filename
    const matchIndex = dashCamVideos.findIndex(
      (dcv) =>
        dcv.frontView.name === currentVideo.file.name ||
        dcv.rearView?.name === currentVideo.file.name,
    )

    if (matchIndex !== -1) {
      const match = dashCamVideos[matchIndex]
      dispatch({ type: 'GPS_SET_TRACK', track: match.frontGps, trackIndex: matchIndex })
      if (match.frontGps.length > 0) {
        dispatch({ type: 'GPS_SET_POSITION', position: match.frontGps[0] })
      }
    }
  }, [state.currentIndex, state.playlist, dispatch])

  return { extractGps }
}
