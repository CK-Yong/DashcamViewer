export type VideoItem = {
  id: string
  file: File
  objectUrl: string
  name: string
}

export type AppState = {
  playlist: VideoItem[]
  currentIndex: number
  playbackSpeed: number
  isPlaying: boolean
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
