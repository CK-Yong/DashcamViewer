import { useRef } from 'react'

type FileUploadButtonProps = {
  onFilesSelected: (files: File[], fileList: FileList) => void
}

export function FileUploadButton({ onFilesSelected }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files), files)
    }
    // Reset so the same files can be re-selected
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button onClick={() => inputRef.current?.click()}>Add Videos</button>
    </>
  )
}
