import type { DashCamVideo, GpsData } from './extract-gps/gps.ts'

export type VideoItem = {
  id: string
  file: File
  objectUrl: string
  name: string
}

export type GpsState = {
  dashCamVideos: DashCamVideo[]
  allGpsTracks: GpsData[][]
  activeTrackIndex: number
  currentGpsTrack: GpsData[]
  currentPosition: GpsData | null
  isExtracting: boolean
  extractionProgress: number
  extractionTotal: number
}

export type AppState = {
  playlist: VideoItem[]
  currentIndex: number
  playbackSpeed: number
  isPlaying: boolean
  gps: GpsState
}

export type Action =
  | { type: 'ADD_VIDEOS'; files: File[] }
  | { type: 'REMOVE_VIDEO'; id: string }
  | { type: 'REORDER_PLAYLIST'; activeId: string; overId: string }
  | { type: 'SELECT_VIDEO'; index: number }
  | { type: 'NEXT_VIDEO' }
  | { type: 'PREVIOUS_VIDEO' }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'CLEAR_PLAYLIST' }
  | { type: 'GPS_EXTRACTION_START'; total: number }
  | { type: 'GPS_EXTRACTION_PROGRESS' }
  | { type: 'GPS_EXTRACTION_COMPLETE'; dashCamVideos: DashCamVideo[] }
  | { type: 'GPS_SET_TRACK'; track: GpsData[]; trackIndex: number }
  | { type: 'GPS_SET_POSITION'; position: GpsData | null }
