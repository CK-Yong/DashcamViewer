import van, { State } from 'vanjs-core';
import { ViofoMp4GpsData } from './viofo-mp4-gps-data.ts';
import { Logger } from '../core/logger.ts';
import { getGpsWorkerPool } from '../core/worker-pool.ts';
import { CameraType } from '../workers/worker-types.ts';

export class GPS {
  private static videosWithGpsData: VideoWithGpsData[];

  static data() {
    return this.videosWithGpsData;
  }

  static async loadFromViofoMp4(
    files: FileList | File[],
    onVideoDoneCallback?: () => void,
    useWorkers: boolean = true
  ): Promise<DashCamVideo[]> {
    Logger.debug('Loading GPS data from Viofo MP4...');
    if (!files) {
      return [];
    }

    const filesFront = [...files].filter((video) => video.name.toLowerCase().endsWith('f.mp4'));
    const filesRear = [...files].filter((video) => video.name.toLowerCase().endsWith('r.mp4'));

    let videoGpsFront: VideoWithGpsData[];
    let videoGpsRear: VideoWithGpsData[];

    // Try to use workers if supported and enabled
    if (useWorkers && typeof Worker !== 'undefined') {
      try {
        const workerPool = getGpsWorkerPool();
        Logger.debug('Using worker pool for GPS extraction');

        videoGpsFront = await Promise.all(
          filesFront.map(async (file) => {
            const video = await workerPool.extractGps(file, CameraType.VIOFO);
            onVideoDoneCallback?.call(null);
            return video;
          })
        );

        videoGpsRear = await Promise.all(
          filesRear.map(async (file) => {
            const video = await workerPool.extractGps(file, CameraType.VIOFO);
            onVideoDoneCallback?.call(null);
            return video;
          })
        );
      } catch (error) {
        Logger.warn('Worker pool failed, falling back to synchronous extraction:', error);
        // Fallback to synchronous extraction
        videoGpsFront = await Promise.all(
          filesFront.map(async (file) => {
            const video = await new ViofoMp4GpsData(file).extract();
            onVideoDoneCallback?.call(null);
            return video;
          })
        );
        videoGpsRear = await Promise.all(
          filesRear.map(async (file) => {
            const video = await new ViofoMp4GpsData(file).extract();
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
          const video = await new ViofoMp4GpsData(file).extract();
          onVideoDoneCallback?.call(null);
          return video;
        })
      );
      videoGpsRear = await Promise.all(
        filesRear.map(async (file) => {
          const video = await new ViofoMp4GpsData(file).extract();
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
}

export type VideoWithGpsData = {
  filename: string;
  gpsData: GpsData[];
};

export type GpsData = {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed: number;
  bearing: number;
};

const { div } = van.tags;

export const GpsStats = ({ classes, gpsData }: { classes: string; gpsData: State<GpsData> }) => {
  return div(
    { class: classes },
    div(
      { class: 'stat' },
      div({ class: 'stat-title' }, 'Speed'),
      div(
        { class: 'stat-value' },
        van.derive(() => (gpsData.val ? gpsData.val.speed.toFixed(1) : 0))
      ),
      div({ class: 'stat-desc' }, 'km/h')
    ),
    div(
      { class: 'stat' },
      div({ class: 'stat-title' }, 'Latitude'),
      div(
        { class: 'stat-value' },
        van.derive(() => (gpsData.val ? gpsData.val.latitude.toFixed(4) : '0'))
      )
    ),
    div(
      { class: 'stat' },
      div({ class: 'stat-title' }, 'Longitude'),
      div(
        { class: 'stat-value' },
        van.derive(() => (gpsData.val ? gpsData.val.longitude.toFixed(4) : '0'))
      )
    )
  );
};

export type DashCamVideo = {
  frontView: File;
  rearView: File | undefined;
  frontGps: GpsData[];
  rearGps: GpsData[] | undefined;
  timestamp: Date;
};
