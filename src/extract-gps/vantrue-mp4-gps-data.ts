import { Mp4Utility } from '../utils.ts';
import { GpsData, VideoWithGpsData } from './gps.ts';

export class VantrueMp4GpsData {
  constructor(file: File) {
    this.file = file;
  }

  private file;
  private fileReader: FileReader = new FileReader();

  extract(): Promise<VideoWithGpsData> {
    let promiseResolve: (value: VideoWithGpsData | PromiseLike<VideoWithGpsData>) => void;

    const promise = new Promise<VideoWithGpsData>((resolve, _) => {
      promiseResolve = resolve;
    });

    this.fileReader.onload = (e) => {
      const file = (e.target as FileReader).result as ArrayBuffer;
      const atom = Mp4Utility.getAtom(file, 'moov');
      const gpsAtom = Mp4Utility.getAtom(atom, 'gps ');
      const videoGPSData: GpsData[] = [];

      let idx = 8; // Skip first 8 bytes, as these contain some Novatek arbitrary data.
      while (idx < gpsAtom.byteLength) {
        const gpsItem = gpsAtom.slice(idx, idx + 8);
        const gpsItemDataView = new DataView(gpsItem);
        const address = gpsItemDataView.getInt32(0, false);
        const size = gpsItemDataView.getInt32(4, false);

        // Vantrue device given by Bojack has its GPS data in the GNRMC format, which looks something like this:
        // freeGPS [92 bytes, with arbitrary data?] $GNRMC,232018.000,A,3342.1299,N,08406.2615,W,52.078,78.91,251124,,,A*59
        // So we take the entire GPS data box, and read it as a string, so we can extract the GNRMC data.
        const gpsDataBox = file.slice(address, address + size);

        const decoder = new TextDecoder();
        const gnrmcString = decoder.decode(gpsDataBox);
        const stripped = gnrmcString.substring(
          gnrmcString.indexOf('$GNRMC'),
          gnrmcString.indexOf('*')
        );

        const components = stripped.split(',');

        if (components.length <= 10) {
          idx += 8;
          continue;
        }

        const hour = parseInt(components[1].slice(0, 2));
        const minutes = parseInt(components[1].slice(2, 4));
        const seconds = parseInt(components[1].slice(4, 6));

        const year = parseInt(components[9].slice(4, 6));
        const month = parseInt(components[9].slice(2, 4));
        const day = parseInt(components[9].slice(0, 2));

        // const activeGPS = components[2];
        const latHemisphere = components[4]; // 'N'orth or 'South'
        const lonHemisphere = components[6]; // 'E'ast or 'W'est

        const latitude = parseFloat(components[3]);
        const longitude = parseFloat(components[5]);
        const knots = parseFloat(components[7]);

        // Skipping bearing because it is not provided in the GNRMC format.
        // const bearing = dataView.getFloat32(40, true);

        // Knots to km/h
        const speed = knots * 1.852;

        // Fix coordinates
        const latitudeFixed = this.fixCoordinates(latHemisphere, latitude);
        const longitudeFixed = this.fixCoordinates(lonHemisphere, longitude);

        videoGPSData.push({
          timestamp: new Date(2000 + year, month - 1, day, hour, minutes, seconds),
          latitude: latitudeFixed,
          longitude: longitudeFixed,
          speed: speed,
          bearing: 0
        });

        idx += 8;
      }

      promiseResolve({ filename: this.file.name, gpsData: videoGPSData });
    };

    this.fileReader.readAsArrayBuffer(this.file);

    return promise;
  }

  fixCoordinates(hemisphere: string, coordinate: number) {
    const minutes = coordinate % 100;
    const degrees = coordinate - minutes;
    const result = degrees / 100 + minutes / 60;

    if (['S', 'W'].includes(hemisphere)) {
      return -1 * result;
    }

    return result;
  }
}
