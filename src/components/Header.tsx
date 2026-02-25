import type { AppMode } from '../types'
import { FileUploadButton } from './FileUploadButton'
import './Header.css'

type HeaderProps = {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  onFilesSelected: (files: File[], fileList: FileList) => void
  onClearAll: () => void
  hasVideos: boolean
}

export function Header({ mode, onModeChange, onFilesSelected, onClearAll, hasVideos }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header__title">Dashcam Viewer</h1>
      <div className="header-mode-toggle">
        <button
          className={`header-mode-toggle__btn ${mode === 'viewer' ? 'header-mode-toggle__btn--active' : ''}`}
          onClick={() => onModeChange('viewer')}
        >
          Viewer
        </button>
        <button
          className={`header-mode-toggle__btn ${mode === 'editor' ? 'header-mode-toggle__btn--active' : ''}`}
          onClick={() => onModeChange('editor')}
        >
          Editor
        </button>
      </div>
      <div className="header-actions">
        <FileUploadButton onFilesSelected={onFilesSelected} />
        <button onClick={onClearAll} disabled={!hasVideos}>
          Clear All
        </button>
      </div>
    </header>
  )
}
