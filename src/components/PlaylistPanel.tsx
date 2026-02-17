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
import type { DashCamVideo } from '../extract-gps/gps'
import { SortablePlaylistItem } from './SortablePlaylistItem'
import './PlaylistPanel.css'

type PlaylistPanelProps = {
  playlist: VideoItem[]
  currentIndex: number
  dashCamVideos: DashCamVideo[]
  onSelect: (index: number) => void
  onRemove: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
}

export function PlaylistPanel({
  playlist,
  currentIndex,
  dashCamVideos,
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
            {playlist.map((video, index) => {
              const dcv = dashCamVideos.find(
                (d) => d.frontView.name === video.file.name,
              )
              return (
                <SortablePlaylistItem
                  key={video.id}
                  video={video}
                  isActive={index === currentIndex}
                  index={index}
                  rearViewName={dcv?.rearView?.name}
                  onSelect={onSelect}
                  onRemove={onRemove}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
