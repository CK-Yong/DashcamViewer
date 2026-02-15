import { ViofoMp4GpsData } from '../extract-gps/viofo-mp4-gps-data.ts'
import { VantrueMp4GpsData } from '../extract-gps/vantrue-mp4-gps-data.ts'
import { CameraType } from './worker-types.ts'
import type { GpsWorkerMessage, GpsWorkerResult } from './worker-types.ts'

self.onmessage = async (e: MessageEvent<GpsWorkerMessage>) => {
  const { file, cameraType, taskId } = e.data

  try {
    const extractor =
      cameraType === CameraType.VIOFO
        ? new ViofoMp4GpsData(file)
        : new VantrueMp4GpsData(file)

    const result = await extractor.extract()

    const response: GpsWorkerResult = {
      taskId,
      success: true,
      data: {
        filename: result.filename,
        gpsData: result.gpsData.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp.toISOString(),
          speed: point.speed,
          bearing: point.bearing,
        })),
      },
    }

    self.postMessage(response)
  } catch (error) {
    const response: GpsWorkerResult = {
      taskId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    self.postMessage(response)
  }
}
