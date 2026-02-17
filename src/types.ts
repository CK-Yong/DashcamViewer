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

export type AppMode = 'viewer' | 'editor'

export type TrimState = {
  inPoint: number | null
  outPoint: number | null
}

export type ExportStatus =
  | { phase: 'idle' }
  | { phase: 'preparing' }
  | { phase: 'encoding'; progress: number }
  | { phase: 'muxing' }
  | { phase: 'done'; blobUrl: string; filename: string }
  | { phase: 'error'; message: string }

export type ExportState = {
  status: ExportStatus
}

export type PipLayout = {
  x: number
  y: number
  width: number
}

export type AppState = {
  mode: AppMode
  playlist: VideoItem[]
  currentIndex: number
  playbackSpeed: number
  isPlaying: boolean
  gps: GpsState
  trim: TrimState
  export: ExportState
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
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'TRIM_SET_IN'; time: number }
  | { type: 'TRIM_SET_OUT'; time: number }
  | { type: 'TRIM_CLEAR' }
  | { type: 'EXPORT_START' }
  | { type: 'EXPORT_PROGRESS'; progress: number }
  | { type: 'EXPORT_MUXING' }
  | { type: 'EXPORT_DONE'; blobUrl: string; filename: string }
  | { type: 'EXPORT_ERROR'; message: string }
  | { type: 'EXPORT_RESET' }
