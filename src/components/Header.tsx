import { FileUploadButton } from './FileUploadButton'
import './Header.css'

type HeaderProps = {
  onFilesSelected: (files: File[], fileList: FileList) => void
  onClearAll: () => void
  hasVideos: boolean
}

export function Header({ onFilesSelected, onClearAll, hasVideos }: HeaderProps) {
  return (
    <header className="header">
      <h1>Dashcam Viewer</h1>
      <div className="header-actions">
        <FileUploadButton onFilesSelected={onFilesSelected} />
        <button onClick={onClearAll} disabled={!hasVideos}>
          Clear All
        </button>
      </div>
    </header>
  )
}
