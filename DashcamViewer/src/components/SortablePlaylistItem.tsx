import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { VideoItem } from '../types'
import './SortablePlaylistItem.css'

type SortablePlaylistItemProps = {
  video: VideoItem
  isActive: boolean
  index: number
  onSelect: (index: number) => void
  onRemove: (id: string) => void
}

export function SortablePlaylistItem({
  video,
  isActive,
  index,
  onSelect,
  onRemove,
}: SortablePlaylistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`playlist-item ${isActive ? 'playlist-item--active' : ''}`}
    >
      <button
        className="playlist-item__drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        &#8942;&#8942;
      </button>
      <button
        className="playlist-item__name"
        onClick={() => onSelect(index)}
        title={video.name}
      >
        {isActive && <span className="playlist-item__playing-indicator" />}
        <span className="playlist-item__text">{video.name}</span>
      </button>
      <button
        className="playlist-item__remove"
        onClick={() => onRemove(video.id)}
        aria-label={`Remove ${video.name}`}
      >
        &times;
      </button>
    </div>
  )
}
