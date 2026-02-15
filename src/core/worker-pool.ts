import type { VideoWithGpsData } from '../extract-gps/gps.ts'
import type { CameraType, GpsWorkerMessage, GpsWorkerResult } from '../workers/worker-types.ts'

type PendingTask = {
  resolve: (value: VideoWithGpsData) => void
  reject: (error: Error) => void
}

export class GpsWorkerPool {
  private workers: Worker[] = []
  private taskQueue: Array<{ file: File; cameraType: CameraType; taskId: string }> = []
  private pendingTasks = new Map<string, PendingTask>()
  private busyWorkers = new Set<Worker>()
  private taskCounter = 0

  constructor(poolSize: number = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(
        new URL('../workers/gps-worker.ts', import.meta.url),
        { type: 'module' },
      )
      worker.onmessage = (e: MessageEvent<GpsWorkerResult>) => {
        this.handleWorkerResult(worker, e.data)
      }
      worker.onerror = (e) => {
        this.busyWorkers.delete(worker)
        console.error('Worker error:', e)
        this.processNextTask(worker)
      }
      this.workers.push(worker)
    }
  }

  extractGps(file: File, cameraType: CameraType): Promise<VideoWithGpsData> {
    const taskId = `task-${this.taskCounter++}`

    return new Promise((resolve, reject) => {
      this.pendingTasks.set(taskId, { resolve, reject })
      this.taskQueue.push({ file, cameraType, taskId })
      this.dispatchTasks()
    })
  }

  private dispatchTasks() {
    for (const worker of this.workers) {
      if (!this.busyWorkers.has(worker) && this.taskQueue.length > 0) {
        this.processNextTask(worker)
      }
    }
  }

  private processNextTask(worker: Worker) {
    const task = this.taskQueue.shift()
    if (!task) return

    this.busyWorkers.add(worker)
    const message: GpsWorkerMessage = {
      file: task.file,
      cameraType: task.cameraType,
      taskId: task.taskId,
    }
    worker.postMessage(message)
  }

  private handleWorkerResult(worker: Worker, result: GpsWorkerResult) {
    this.busyWorkers.delete(worker)
    const pending = this.pendingTasks.get(result.taskId)

    if (pending) {
      this.pendingTasks.delete(result.taskId)

      if (result.success) {
        pending.resolve({
          filename: result.data.filename,
          gpsData: result.data.gpsData.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            timestamp: new Date(point.timestamp),
            speed: point.speed,
            bearing: point.bearing,
          })),
        })
      } else {
        pending.reject(new Error(result.error))
      }
    }

    this.dispatchTasks()
  }

  terminate() {
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers = []
    this.busyWorkers.clear()
  }
}

let poolInstance: GpsWorkerPool | null = null

export function getGpsWorkerPool(): GpsWorkerPool {
  if (!poolInstance) {
    poolInstance = new GpsWorkerPool()
  }
  return poolInstance
}
