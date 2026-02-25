import { useState } from 'react'
import type { TrimState, ExportState } from '../types'
import './TrimControls.css'

const RESOLUTION_OPTIONS = [
  { value: 720, label: '720p' },
  { value: 1080, label: '1080p' },
  { value: 1440, label: '1440p' },
  { value: 0, label: 'Original' },
] as const

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

type TrimControlsProps = {
  trim: TrimState
  duration: number
  currentTime: number
  exportState: ExportState
  onSetIn: () => void
  onSetOut: () => void
  onClear: () => void
  onExport: (outputHeight: number | null) => void
  onExportReset: () => void
  onSeek: (time: number) => void
}

export function TrimControls({
  trim,
  duration,
  currentTime,
  exportState,
  onSetIn,
  onSetOut,
  onClear,
  onExport,
  onExportReset,
  onSeek,
}: TrimControlsProps) {
  const [outputHeight, setOutputHeight] = useState(1080)

  const canExport =
    trim.inPoint !== null &&
    trim.outPoint !== null &&
    trim.inPoint < trim.outPoint &&
    exportState.status.phase === 'idle'

  const isExporting =
    exportState.status.phase !== 'idle' &&
    exportState.status.phase !== 'done' &&
    exportState.status.phase !== 'error'

  const inPct = trim.inPoint !== null && duration > 0 ? (trim.inPoint / duration) * 100 : null
  const outPct = trim.outPoint !== null && duration > 0 ? (trim.outPoint / duration) * 100 : null
  const curPct = duration > 0 ? (currentTime / duration) * 100 : 0

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if (duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(fraction * duration)
  }

  return (
    <div className="trim-controls">
      <div className="trim-controls__timeline">
        <span className="trim-controls__time">{formatTime(currentTime)}</span>
        <div
          className="trim-controls__track"
          onClick={handleTrackClick}
          style={{ cursor: duration > 0 ? 'pointer' : 'default' }}
        >
          {inPct !== null && outPct !== null && (
            <div
              className="trim-controls__range"
              style={{ left: `${inPct}%`, width: `${outPct - inPct}%` }}
            />
          )}
          {inPct !== null && (
            <div className="trim-controls__marker trim-controls__marker--in" style={{ left: `${inPct}%` }} />
          )}
          {outPct !== null && (
            <div className="trim-controls__marker trim-controls__marker--out" style={{ left: `${outPct}%` }} />
          )}
          <div className="trim-controls__playhead" style={{ left: `${curPct}%` }} />
        </div>
        <span className="trim-controls__time">{formatTime(duration)}</span>
      </div>
      <div className="trim-controls__actions">
        <div className="trim-controls__points">
          <button className="trim-controls__btn" onClick={onSetIn} title="Set in point (i)">
            In: {trim.inPoint !== null ? formatTime(trim.inPoint) : '--:--'}
          </button>
          <button className="trim-controls__btn" onClick={onSetOut} title="Set out point (o)">
            Out: {trim.outPoint !== null ? formatTime(trim.outPoint) : '--:--'}
          </button>
          {(trim.inPoint !== null || trim.outPoint !== null) && (
            <button className="trim-controls__btn trim-controls__btn--clear" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
        <div className="trim-controls__export-group">
          {trim.inPoint !== null && trim.outPoint !== null && trim.inPoint < trim.outPoint && (
            <span className="trim-controls__duration">
              {formatTime(trim.outPoint - trim.inPoint)}
            </span>
          )}
          {exportState.status.phase === 'done' && (
            <>
              <a
                className="trim-controls__btn trim-controls__btn--download"
                href={exportState.status.blobUrl}
                download={exportState.status.filename}
              >
                Download
              </a>
              <button className="trim-controls__btn" onClick={onExportReset}>
                New
              </button>
            </>
          )}
          {exportState.status.phase === 'error' && (
            <>
              <span className="trim-controls__error">{exportState.status.message}</span>
              <button className="trim-controls__btn" onClick={onExportReset}>
                Retry
              </button>
            </>
          )}
          {isExporting && (
            <div className="trim-controls__progress">
              <div className="trim-controls__progress-bar">
                <div
                  className={`trim-controls__progress-fill${exportState.status.phase === 'muxing' ? ' trim-controls__progress-fill--indeterminate' : ''}`}
                  style={{
                    width: exportState.status.phase === 'encoding'
                      ? `${exportState.status.progress * 100}%`
                      : exportState.status.phase === 'muxing'
                      ? undefined
                      : '0%',
                  }}
                />
              </div>
              <span className="trim-controls__progress-label">
                {exportState.status.phase === 'preparing' && 'Preparing...'}
                {exportState.status.phase === 'encoding' && `Encoding ${Math.round(exportState.status.progress * 100)}%`}
                {exportState.status.phase === 'muxing' && 'Muxing...'}
              </span>
            </div>
          )}
          {exportState.status.phase === 'idle' && (
            <>
              <select
                className="trim-controls__resolution"
                value={outputHeight}
                onChange={(e) => setOutputHeight(Number(e.target.value))}
              >
                {RESOLUTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                className="trim-controls__btn trim-controls__btn--export"
                onClick={() => onExport(outputHeight || null)}
                disabled={!canExport}
              >
                Export Clip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
