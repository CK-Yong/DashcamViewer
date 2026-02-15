export const CameraType = {
  VIOFO: 'VIOFO',
  VANTRUE: 'VANTRUE',
} as const

export type CameraType = (typeof CameraType)[keyof typeof CameraType]

export type GpsWorkerMessage = {
  file: File
  cameraType: CameraType
  taskId: string
}

export type SerializedGpsPoint = {
  latitude: number
  longitude: number
  timestamp: string
  speed: number
  bearing: number
}

export type GpsWorkerResult =
  | {
      taskId: string
      success: true
      data: {
        filename: string
        gpsData: SerializedGpsPoint[]
      }
    }
  | {
      taskId: string
      success: false
      error: string
    }
