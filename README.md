# Dashcam Viewer

A browser-based dashcam video viewer with GPS map integration. Load dashcam footage, view front and rear camera feeds simultaneously, and see the driven route on an interactive map.

## Features

- **Video Playback** — Play, pause, seek, skip, adjust speed, and control volume
- **Front + Rear Camera** — Rear camera shown as a draggable, resizable picture-in-picture overlay synced to the front video
- **GPS Map** — Extracts GPS data from dashcam MP4 files and displays the route on a Leaflet map
- **Multi-Video Routes** — All loaded video routes displayed on the map simultaneously
- **Follow Mode** — Keep the map centered on the current position during playback
- **GPS Stats** — Live latitude, longitude, and speed readout synced to playback position
- **Playlist** — Drag-and-drop reorderable playlist with keyboard shortcuts
- **Web Workers** — GPS extraction runs in parallel to keep the UI responsive

## Supported Cameras

- Viofo (binary GPS data from MP4 atoms)
- Vantrue (GNRMC string parsing)

Front/rear video pairing is automatic based on file naming conventions (`*F.MP4` / `*R.MP4`) and timestamp matching.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser, then use the file picker to load your dashcam MP4 files.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Tech Stack

- React 19 + TypeScript
- Vite
- Leaflet (vanilla, no wrapper library)
- dnd-kit (drag-and-drop playlist)
- Web Workers (parallel GPS extraction)
