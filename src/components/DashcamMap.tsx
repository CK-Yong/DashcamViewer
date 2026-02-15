import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GpsData } from '../extract-gps/gps.ts'
import './DashcamMap.css'

type DashcamMapProps = {
  allTracks: GpsData[][]
  activeTrackIndex: number
  position: GpsData | null
}

export function DashcamMap({ allTracks, activeTrackIndex, position }: DashcamMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const polylinesRef = useRef<L.Polyline[]>([])
  const markerRef = useRef<L.CircleMarker | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const isFollowingRef = useRef(false)

  // Keep ref in sync with state (for use inside Leaflet event handlers)
  useEffect(() => {
    isFollowingRef.current = isFollowing
  }, [isFollowing])

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([0, 0], 2)

    // Create custom pane for nav dot so it renders above polylines
    map.createPane('navdotPane')
    map.getPane('navdotPane')!.style.zIndex = '650'

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Disable follow mode when user manually interacts with the map
    map.on('dragstart', () => {
      setIsFollowing(false)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Draw all track polylines
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear existing polylines
    for (const pl of polylinesRef.current) {
      pl.remove()
    }
    polylinesRef.current = []

    if (allTracks.length === 0) return

    const allBounds = L.latLngBounds([])

    // Draw inactive tracks first (underneath)
    for (let i = 0; i < allTracks.length; i++) {
      if (i === activeTrackIndex || allTracks[i].length === 0) continue

      const latLngs: L.LatLngExpression[] = allTracks[i].map((p) => [p.latitude, p.longitude])
      const polyline = L.polyline(latLngs, {
        color: '#1567eb',
        weight: 4,
        opacity: 1,
      }).addTo(map)

      polylinesRef.current.push(polyline)
      allBounds.extend(polyline.getBounds())
    }

    // Draw active track on top
    const activeTrack = allTracks[activeTrackIndex]
    if (activeTrack && activeTrack.length > 0) {
      const latLngs: L.LatLngExpression[] = activeTrack.map((p) => [p.latitude, p.longitude])
      const polyline = L.polyline(latLngs, {
        color: '#1567eb',
        weight: 4,
        opacity: 1,
      }).addTo(map)

      polylinesRef.current.push(polyline)
      allBounds.extend(polyline.getBounds())
    }

    if (allBounds.isValid() && !isFollowingRef.current) {
      map.fitBounds(allBounds, { padding: [30, 30] })
    }
  }, [allTracks, activeTrackIndex])

  // Update position marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (markerRef.current) {
      if (position) {
        markerRef.current.setLatLng([position.latitude, position.longitude])
      } else {
        markerRef.current.remove()
        markerRef.current = null
      }
    } else if (position) {
      const marker = L.circleMarker([position.latitude, position.longitude], {
        radius: 7,
        fillColor: '#ef4444',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
        pane: 'navdotPane',
      }).addTo(map)
      markerRef.current = marker
    }

    // Follow mode: pan map to keep dot centered
    if (isFollowing && position) {
      map.panTo([position.latitude, position.longitude], {
        animate: true,
        duration: 0.3,
      })
    }
  }, [position, isFollowing])

  function handleFollowToggle() {
    const next = !isFollowing
    setIsFollowing(next)
    // Immediately pan to current position when enabling
    if (next && position && mapRef.current) {
      mapRef.current.panTo([position.latitude, position.longitude], {
        animate: true,
        duration: 0.3,
      })
    }
  }

  const hasAnyTrack = allTracks.some((t) => t.length > 0)

  return (
    <div className="dashcam-map-container">
      <div ref={mapContainerRef} className="dashcam-map" style={{ visibility: hasAnyTrack ? 'visible' : 'hidden' }} />
      {hasAnyTrack && (
        <button
          className={`dashcam-map-follow${isFollowing ? ' dashcam-map-follow--active' : ''}`}
          onClick={handleFollowToggle}
          title={isFollowing ? 'Stop following' : 'Follow position'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
          <span>Follow</span>
        </button>
      )}
      {!hasAnyTrack && (
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
