import { DashCamVideo, GPS, VideoWithGpsData } from './gps.ts';
import { VantrueMp4GpsData } from './vantrue-mp4-gps-data.ts';
import { Logger } from '../core/logger.ts';
import { getGpsWorkerPool } from '../core/worker-pool.ts';
import { CameraType } from '../workers/worker-types.ts';

interface ILoader {
  canHandle(files: FileList): boolean;

  loadVideos(onVideoDoneCallback?: () => void): Promise<DashCamVideo[]>;

  init(files: FileList): void;
}

class NullLoader implements ILoader {
  canHandle(): boolean {
    return true;
  }

  loadVideos(): Promise<DashCamVideo[]> {
    return Promise.resolve([]);
  }

  init(): void {
    // No initialization needed
  }
}

class VantrueN4Loader implements ILoader {
  private videos!: File[];

  private predicate(file: File) {
    return (
      file.name.toLowerCase().endsWith('a.mp4') ||
      file.name.toLowerCase().endsWith('b.mp4') ||
      file.name.toLowerCase().endsWith('c.mp4')
    );
  }

  canHandle(files: FileList): boolean {
    let anyCompatibleVideo = false;

    for (const file of files) {
      if (this.predicate(file)) {
        anyCompatibleVideo = true;
      }
    }
    return anyCompatibleVideo;
  }

  async loadVideos(
    onVideoDoneCallback?: () => void,
    useWorkers: boolean = true
  ): Promise<DashCamVideo[]> {
    Logger.debug('Loading VantrueN4 videos');

    const filesFront = this.videos.filter((video) => video.name.toLowerCase().endsWith('a.mp4'));
    const filesRear = this.videos.filter((video) => video.name.toLowerCase().endsWith('c.mp4'));

    let videoGpsFront: VideoWithGpsData[];
    let videoGpsRear: VideoWithGpsData[];

    // Try to use workers if supported and enabled
    if (useWorkers && typeof Worker !== 'undefined') {
      try {
        const workerPool = getGpsWorkerPool();
        Logger.debug('Using worker pool for Vantrue GPS extraction');

        videoGpsFront = await Promise.all(
          filesFront.map(async (file) => {
            const video = await workerPool.extractGps(file, CameraType.VANTRUE);
            onVideoDoneCallback?.call(null);
            return video;
          })
        );

        videoGpsRear = await Promise.all(
          filesRear.map(async (file) => {
            const video = await workerPool.extractGps(file, CameraType.VANTRUE);
            onVideoDoneCallback?.call(null);
            return video;
          })
        );
      } catch (error) {
        Logger.warn('Worker pool failed, falling back to synchronous extraction:', error);
        // Fallback to synchronous extraction
        videoGpsFront = await Promise.all(
          filesFront.map(async (file) => {
            const video = await new VantrueMp4GpsData(file).extract();
            onVideoDoneCallback?.call(null);
            return video;
          })
        );
        videoGpsRear = await Promise.all(
          filesRear.map(async (file) => {
            const video = await new VantrueMp4GpsData(file).extract();
            onVideoDoneCallback?.call(null);
            return video;
          })
        );
      }
    } else {
      Logger.debug('Using synchronous GPS extraction (workers not available or disabled)');
      // Synchronous fallback
      videoGpsFront = await Promise.all(
        filesFront.map(async (file) => {
          const video = await new VantrueMp4GpsData(file).extract();
          onVideoDoneCallback?.call(null);
          return video;
        })
      );
      videoGpsRear = await Promise.all(
        filesRear.map(async (file) => {
          const video = await new VantrueMp4GpsData(file).extract();
          onVideoDoneCallback?.call(null);
          return video;
        })
      );
    }

    const dashCamVideos: DashCamVideo[] = [];
    videoGpsFront.forEach((frontVideo: VideoWithGpsData) => {
      // Find corresponding rear video, according to timestamp. Find files that start at most 15 seconds from each other.
      const rearVideo = videoGpsRear.find(
        (rearVideo) =>
          Math.abs(
            frontVideo.gpsData[0].timestamp.getTime() - rearVideo.gpsData[0].timestamp.getTime()
          ) <
          15 * 1000
      );

      dashCamVideos.push({
        frontGps: frontVideo.gpsData,
        frontView: filesFront.find((file) => file.name === frontVideo.filename)!,
        timestamp: frontVideo.gpsData[0].timestamp,
        rearGps: rearVideo?.gpsData,
        rearView: filesRear.find((file) => file.name === rearVideo?.filename)
      });
    });

    return dashCamVideos;
  }

  init(files: FileList): void {
    this.videos = [...files].filter(this.predicate);
  }
}

class ViofoMp4VideoLoader implements ILoader {
  private videos!: File[];

  private predicate(file: File) {
    return file.name.toLowerCase().endsWith('f.mp4') || file.name.toLowerCase().endsWith('r.mp4');
  }

  canHandle(files: FileList): boolean {
    let anyCompatibleVideo = false;

    for (const file of files) {
      if (this.predicate(file)) {
        anyCompatibleVideo = true;
      }
    }
    return anyCompatibleVideo;
  }

  loadVideos(onVideoDoneCallback?: () => void): Promise<DashCamVideo[]> {
    Logger.debug('Loading Viofo videos');
    return GPS.loadFromViofoMp4(this.videos, onVideoDoneCallback);
  }

  init(files: FileList): void {
    this.videos = [...files].filter(this.predicate);
  }
}

/* Utility class that determines which type of videos we are dealing with, and hands back an appropriate handler for loading videos */
export class GpsLoaderFactory {
  private loaders: ILoader[] = [new ViofoMp4VideoLoader(), new VantrueN4Loader()];

  get(files: FileList): ILoader {
    const loader = this.loaders.filter((loader) => loader.canHandle(files))[0];
    if (loader) {
      loader.init(files);
      return loader;
    }
    return new NullLoader();
  }
}
