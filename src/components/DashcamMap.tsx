import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GpsData } from '../extract-gps/gps.ts'
import './DashcamMap.css'

type DashcamMapProps = {
  track: GpsData[]
  position: GpsData | null
}

export function DashcamMap({ track, position }: DashcamMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([0, 0], 2)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Draw track polyline
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    if (track.length === 0) return

    const latLngs: L.LatLngExpression[] = track.map((point) => [
      point.latitude,
      point.longitude,
    ])

    const polyline = L.polyline(latLngs, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.8,
    }).addTo(map)

    polylineRef.current = polyline
    map.fitBounds(polyline.getBounds(), { padding: [30, 30] })
  }, [track])

  // Update position marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (markerRef.current) {
      markerRef.current.setLatLng([position?.latitude ?? 0, position?.longitude ?? 0])
      if (!position) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    if (!position) return

    const marker = L.circleMarker([position.latitude, position.longitude], {
      radius: 7,
      fillColor: '#ef4444',
      fillOpacity: 1,
      color: '#ffffff',
      weight: 2,
    }).addTo(map)

    markerRef.current = marker
  }, [position])

  const hasTrack = track.length > 0

  return (
    <div className="dashcam-map-container">
      <div ref={mapContainerRef} className="dashcam-map" style={{ visibility: hasTrack ? 'visible' : 'hidden' }} />
      {!hasTrack && (
        <div className="dashcam-map-placeholder">
          <span className="dashcam-map-placeholder__icon">&#128205;</span>
          <p className="dashcam-map-placeholder__text">
            Map — GPS location will appear here
          </p>
        </div>
      )}
    </div>
  )
}
