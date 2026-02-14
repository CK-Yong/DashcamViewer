import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { VideoItem } from '../types'
import { SortablePlaylistItem } from './SortablePlaylistItem'
import './PlaylistPanel.css'

type PlaylistPanelProps = {
  playlist: VideoItem[]
  currentIndex: number
  onSelect: (index: number) => void
  onRemove: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
}

export function PlaylistPanel({
  playlist,
  currentIndex,
  onSelect,
  onRemove,
  onReorder,
}: PlaylistPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id))
    }
  }

  if (playlist.length === 0) {
    return (
      <div className="playlist-panel playlist-panel--empty">
        <p>No videos loaded. Click "Add Videos" to get started.</p>
      </div>
    )
  }

  return (
    <div className="playlist-panel">
      <h2 className="playlist-panel__title">
        Playlist ({playlist.length} video{playlist.length !== 1 ? 's' : ''})
      </h2>
      <div className="playlist-panel__list">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={playlist.map((v) => v.id)}
            strategy={verticalListSortingStrategy}
          >
            {playlist.map((video, index) => (
              <SortablePlaylistItem
                key={video.id}
                video={video}
                isActive={index === currentIndex}
                index={index}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
