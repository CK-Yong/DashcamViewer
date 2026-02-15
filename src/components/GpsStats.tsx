import type { GpsData } from '../extract-gps/gps.ts'
import type { GpsState } from '../types.ts'
import './GpsStats.css'

type GpsStatsProps = {
  gps: GpsState
}

export function GpsStats({ gps }: GpsStatsProps) {
  if (gps.isExtracting) {
    return (
      <div className="gps-stats">
        <p className="gps-stats__extracting">
          Extracting GPS... {gps.extractionProgress}/{gps.extractionTotal}
        </p>
      </div>
    )
  }

  if (!gps.currentPosition) return null

  return (
    <div className="gps-stats">
      <StatItem label="Lat" value={formatCoord(gps.currentPosition.latitude)} />
      <StatItem label="Lon" value={formatCoord(gps.currentPosition.longitude)} />
      <StatItem label="Speed" value={formatSpeed(gps.currentPosition)} />
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="gps-stats__item">
      <span className="gps-stats__label">{label}</span>
      <span className="gps-stats__value">{value}</span>
    </span>
  )
}

function formatCoord(value: number): string {
  return value.toFixed(5)
}

function formatSpeed(position: GpsData): string {
  return `${position.speed.toFixed(1)} km/h`
}
