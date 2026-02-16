import { arrayMove } from '@dnd-kit/sortable'
import type { AppState, Action, GpsState, VideoItem } from './types'

const initialGpsState: GpsState = {
  dashCamVideos: [],
  allGpsTracks: [],
  activeTrackIndex: -1,
  currentGpsTrack: [],
  currentPosition: null,
  isExtracting: false,
  extractionProgress: 0,
  extractionTotal: 0,
}

export const initialState: AppState = {
  playlist: [],
  currentIndex: -1,
  playbackSpeed: 1,
  isPlaying: false,
  gps: initialGpsState,
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_VIDEOS': {
      const frontFiles = action.files.filter(
        (file) => !file.name.toLowerCase().endsWith('r.mp4'),
      )
      const newItems: VideoItem[] = frontFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        objectUrl: URL.createObjectURL(file),
        name: file.name,
      }))
      const playlist = [...state.playlist, ...newItems]
      return {
        ...state,
        playlist,
        currentIndex: state.currentIndex === -1 ? 0 : state.currentIndex,
      }
    }

    case 'REMOVE_VIDEO': {
      const removeIndex = state.playlist.findIndex((v) => v.id === action.id)
      if (removeIndex === -1) return state

      const item = state.playlist[removeIndex]
      URL.revokeObjectURL(item.objectUrl)

      const playlist = state.playlist.filter((v) => v.id !== action.id)
      let { currentIndex } = state

      if (playlist.length === 0) {
        currentIndex = -1
      } else if (removeIndex < currentIndex) {
        currentIndex -= 1
      } else if (removeIndex === currentIndex) {
        currentIndex = Math.min(currentIndex, playlist.length - 1)
      }

      return { ...state, playlist, currentIndex }
    }

    case 'REORDER_PLAYLIST': {
      const oldIndex = state.playlist.findIndex((v) => v.id === action.activeId)
      const newIndex = state.playlist.findIndex((v) => v.id === action.overId)
      if (oldIndex === -1 || newIndex === -1) return state

      const playlist = arrayMove(state.playlist, oldIndex, newIndex)

      // Track the currently playing video after reorder
      const currentVideoId = state.playlist[state.currentIndex]?.id
      const currentIndex = currentVideoId
        ? playlist.findIndex((v) => v.id === currentVideoId)
        : state.currentIndex

      return { ...state, playlist, currentIndex }
    }

    case 'SELECT_VIDEO': {
      if (action.index < 0 || action.index >= state.playlist.length) return state
      return { ...state, currentIndex: action.index, isPlaying: true }
    }

    case 'NEXT_VIDEO': {
      if (state.currentIndex >= state.playlist.length - 1) {
        return { ...state, isPlaying: false }
      }
      return { ...state, currentIndex: state.currentIndex + 1, isPlaying: true }
    }

    case 'PREVIOUS_VIDEO': {
      if (state.currentIndex <= 0) return state
      return { ...state, currentIndex: state.currentIndex - 1, isPlaying: true }
    }

    case 'SET_SPEED': {
      return { ...state, playbackSpeed: action.speed }
    }

    case 'SET_PLAYING': {
      return { ...state, isPlaying: action.playing }
    }

    case 'CLEAR_PLAYLIST': {
      for (const item of state.playlist) {
        URL.revokeObjectURL(item.objectUrl)
      }
      return { ...initialState }
    }

    case 'GPS_EXTRACTION_START': {
      return {
        ...state,
        gps: {
          ...state.gps,
          isExtracting: true,
          extractionProgress: 0,
          extractionTotal: action.total,
        },
      }
    }

    case 'GPS_EXTRACTION_PROGRESS': {
      return {
        ...state,
        gps: {
          ...state.gps,
          extractionProgress: state.gps.extractionProgress + 1,
        },
      }
    }

    case 'GPS_EXTRACTION_COMPLETE': {
      const allGpsTracks = action.dashCamVideos.map((dcv) => dcv.frontGps)
      return {
        ...state,
        gps: {
          ...state.gps,
          dashCamVideos: action.dashCamVideos,
          allGpsTracks,
          activeTrackIndex: allGpsTracks.length > 0 ? 0 : -1,
          isExtracting: false,
          currentGpsTrack:
            allGpsTracks.length > 0 ? allGpsTracks[0] : [],
        },
      }
    }

    case 'GPS_SET_TRACK': {
      return {
        ...state,
        gps: {
          ...state.gps,
          currentGpsTrack: action.track,
          activeTrackIndex: action.trackIndex,
        },
      }
    }

    case 'GPS_SET_POSITION': {
      return {
        ...state,
        gps: { ...state.gps, currentPosition: action.position },
      }
    }

    default:
      return state
  }
}
