// Future integration point for GPS map display.
// The user will provide GPS extraction logic that parses location data
// from dashcam video metadata. A map library (e.g., Leaflet, Mapbox GL JS)
// will replace this placeholder div.
//
// Integration contract:
// - currentVideo: the currently playing VideoItem (for file-based GPS extraction)
// - Future props: gpsCoordinates, gpsTrack, onTimeUpdate for syncing map with playback

import type { VideoItem } from '../types'
import './MapPlaceholder.css'

type MapPlaceholderProps = {
  currentVideo: VideoItem | null
}

export function MapPlaceholder({ currentVideo }: MapPlaceholderProps) {
  return (
    <div className="map-placeholder">
      <span className="map-placeholder__icon">&#128205;</span>
      <p className="map-placeholder__text">
        {currentVideo
          ? 'Map — GPS location will appear here'
          : 'Map — Add a video to see GPS data'}
      </p>
    </div>
  )
}
