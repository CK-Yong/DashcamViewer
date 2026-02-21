import { useCallback, useRef } from 'react'
import {
  Input,
  Output,
  Conversion,
  Mp4OutputFormat,
  BufferTarget,
  BlobSource,
  VideoSampleSink,
  ALL_FORMATS,
} from 'mediabunny'
import type { Action, PipLayout } from '../types'

type ExportParams = {
  frontFile: File
  rearFile: File | undefined
  inPoint: number
  outPoint: number
  pipLayout: PipLayout | undefined
  outputHeight: number | null
}

type RearFrame = {
  timestamp: number
  bitmap: ImageBitmap
}

export function useVideoExport(dispatch: React.Dispatch<Action>) {
  const conversionRef = useRef<Conversion | null>(null)

  const startExport = useCallback(
    async ({ frontFile, rearFile, inPoint, outPoint, pipLayout, outputHeight: requestedHeight }: ExportParams) => {
      dispatch({ type: 'EXPORT_START' })

      const rearFrames: RearFrame[] = []

      try {
        const frontInput = new Input({
          source: new BlobSource(frontFile),
          formats: ALL_FORMATS,
        })

        const frontVideoTrack = await frontInput.getPrimaryVideoTrack()
        if (!frontVideoTrack) {
          dispatch({ type: 'EXPORT_ERROR', message: 'No video track found' })
          return
        }

        // Scale to requested resolution (or use original if null)
        const sourceWidth = frontVideoTrack.displayWidth
        const sourceHeight = frontVideoTrack.displayHeight
        const aspect = sourceWidth / sourceHeight
        const outputHeight = requestedHeight ?? sourceHeight
        const outputWidth = Math.round(outputHeight * aspect)

        // Pre-decode rear video frames if we have a rear file and PiP layout
        const hasPip = !!(rearFile && pipLayout)
        if (hasPip) {
          dispatch({ type: 'EXPORT_PROGRESS', progress: 0 })

          const rearInput = new Input({
            source: new BlobSource(rearFile!),
            formats: ALL_FORMATS,
          })
          const rearTrack = await rearInput.getPrimaryVideoTrack()
          if (rearTrack) {
            const sink = new VideoSampleSink(rearTrack)
            for await (const sample of sink.samples(inPoint, outPoint)) {
              const tempCanvas = new OffscreenCanvas(
                sample.displayWidth,
                sample.displayHeight,
              )
              const tempCtx = tempCanvas.getContext('2d')!
              sample.draw(tempCtx, 0, 0)
              const bitmap = await createImageBitmap(tempCanvas)
              // Store timestamp relative to trim start so it matches the front video's
              // trimmed timeline (which starts at 0)
              rearFrames.push({ timestamp: sample.timestamp - inPoint, bitmap })
            }
          }
        }

        // Find closest rear frame by timestamp (binary search for efficiency)
        function findRearFrame(timestamp: number): ImageBitmap | null {
          if (rearFrames.length === 0) return null
          let lo = 0
          let hi = rearFrames.length - 1
          while (lo < hi) {
            const mid = (lo + hi) >> 1
            if (rearFrames[mid].timestamp < timestamp) lo = mid + 1
            else hi = mid
          }
          // Check if previous index is closer
          if (lo > 0 && Math.abs(rearFrames[lo - 1].timestamp - timestamp) < Math.abs(rearFrames[lo].timestamp - timestamp)) {
            lo--
          }
          return rearFrames[lo].bitmap
        }

        const target = new BufferTarget()
        const output = new Output({
          format: new Mp4OutputFormat(),
          target,
        })

        let ctx: OffscreenCanvasRenderingContext2D | null = null

        const conversionOptions: Parameters<typeof Conversion.init>[0] = {
          input: frontInput,
          output,
          trim: { start: inPoint, end: outPoint },
          video: {
            codec: 'avc',
            processedWidth: outputWidth,
            processedHeight: outputHeight,
            process: hasPip
              ? (sample) => {
                  if (!ctx) {
                    const canvas = new OffscreenCanvas(outputWidth, outputHeight)
                    ctx = canvas.getContext('2d')!
                  }

                  // Draw front video scaled to 720p
                  sample.draw(ctx, 0, 0, outputWidth, outputHeight)

                  // Draw rear video PiP overlay
                  const rearBitmap = findRearFrame(sample.timestamp)
                  if (rearBitmap && pipLayout) {
                    const pipW = Math.round(pipLayout.width * outputWidth)
                    const pipH = Math.round(pipW * rearBitmap.height / rearBitmap.width)
                    const pipX = Math.round(pipLayout.x * outputWidth)
                    const pipY = Math.round(pipLayout.y * outputHeight)
                    ctx.drawImage(rearBitmap, pipX, pipY, pipW, pipH)
                  }

                  return ctx.canvas
                }
              : undefined,
          },
        }

        const conversion = await Conversion.init(conversionOptions)
        conversionRef.current = conversion

        conversion.onProgress = (progress: number) => {
          dispatch({ type: 'EXPORT_PROGRESS', progress })
        }

        dispatch({ type: 'EXPORT_PROGRESS', progress: 0 })
        await conversion.execute()

        dispatch({ type: 'EXPORT_MUXING' })

        const buffer = target.buffer!
        const blob = new Blob([buffer], { type: 'video/mp4' })
        const blobUrl = URL.createObjectURL(blob)
        const baseName = frontFile.name.replace(/\.[^.]+$/, '')
        const filename = `${baseName}_clip.mp4`

        dispatch({ type: 'EXPORT_DONE', blobUrl, filename })
      } catch (error) {
        if (error instanceof Error && error.name === 'ConversionCanceledError') {
          dispatch({ type: 'EXPORT_RESET' })
        } else {
          dispatch({
            type: 'EXPORT_ERROR',
            message: error instanceof Error ? error.message : 'Export failed',
          })
        }
      } finally {
        // Clean up rear frame bitmaps
        for (const frame of rearFrames) {
          frame.bitmap.close()
        }
        conversionRef.current = null
      }
    },
    [dispatch],
  )

  const cancelExport = useCallback(async () => {
    if (conversionRef.current) {
      await conversionRef.current.cancel()
    }
  }, [])

  return { startExport, cancelExport }
}
