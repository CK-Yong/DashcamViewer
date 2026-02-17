import { useCallback, useRef } from 'react'
import {
  Input,
  Output,
  Conversion,
  Mp4OutputFormat,
  BufferTarget,
  BlobSource,
  ALL_FORMATS,
} from 'mediabunny'
import type { Action, PipLayout } from '../types'

type ExportParams = {
  frontFile: File
  rearFile: File | undefined
  inPoint: number
  outPoint: number
  pipLayout: PipLayout | undefined
}

export function useVideoExport(dispatch: React.Dispatch<Action>) {
  const conversionRef = useRef<Conversion | null>(null)

  const startExport = useCallback(
    async ({ frontFile, rearFile, inPoint, outPoint, pipLayout }: ExportParams) => {
      dispatch({ type: 'EXPORT_START' })

      try {
        const frontInput = new Input({
          source: new BlobSource(frontFile),
          formats: ALL_FORMATS,
        })

        // Get front video dimensions for compositing
        const frontVideoTrack = await frontInput.getPrimaryVideoTrack()
        if (!frontVideoTrack) {
          dispatch({ type: 'EXPORT_ERROR', message: 'No video track found' })
          return
        }
        const outputWidth = frontVideoTrack.displayWidth
        const outputHeight = frontVideoTrack.displayHeight

        // Set up rear video input for PiP compositing
        let rearInput: Input | undefined
        if (rearFile && pipLayout) {
          rearInput = new Input({
            source: new BlobSource(rearFile),
            formats: ALL_FORMATS,
          })
        }

        const target = new BufferTarget()
        const output = new Output({
          format: new Mp4OutputFormat(),
          target,
        })

        // Set up compositing canvas if we have a rear view
        let ctx: OffscreenCanvasRenderingContext2D | null = null

        const conversionOptions: Parameters<typeof Conversion.init>[0] = {
          input: frontInput,
          output,
          trim: { start: inPoint, end: outPoint },
          video: rearInput && pipLayout
            ? {
                codec: 'avc',
                process: (sample) => {
                  if (!ctx) {
                    const canvas = new OffscreenCanvas(outputWidth, outputHeight)
                    ctx = canvas.getContext('2d')!
                  }

                  // Draw front video full-size
                  sample.draw(ctx, 0, 0, outputWidth, outputHeight)

                  // TODO: Draw rear video PiP overlay
                  // This requires reading rear frames in sync, which needs
                  // a separate decoding pipeline. For now, export front only.

                  return ctx.canvas
                },
                processedWidth: outputWidth,
                processedHeight: outputHeight,
              }
            : undefined,
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
