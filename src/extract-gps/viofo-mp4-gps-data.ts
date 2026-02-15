// Logic based on blog post on extracting Viofo data:
// https://sergei.nz/extracting-gps-data-from-viofo-a119-and-other-novatek-powered-cameras/
import { Mp4Utility } from '../utils.ts'
import type { GpsData, VideoWithGpsData } from './gps.ts'

export class ViofoMp4GpsData {
  constructor(file: File) {
    this.file = file
  }

  private file
  private fileReader: FileReader = new FileReader()

  extract(): Promise<VideoWithGpsData> {
    let promiseResolve: (value: VideoWithGpsData | PromiseLike<VideoWithGpsData>) => void

    const promise = new Promise<VideoWithGpsData>((resolve, _) => {
      promiseResolve = resolve
    })

    this.fileReader.onload = (e) => {
      const file = (e.target as FileReader).result as ArrayBuffer
      const atom = Mp4Utility.getAtom(file, 'moov')
      const gpsAtom = Mp4Utility.getAtom(atom, 'gps ')
      const videoGPSData: GpsData[] = []

      let idx = 8 // Skip first 8 bytes, as these contain some Novatek arbitrary data.
      while (idx < gpsAtom.byteLength) {
        const gpsItem = gpsAtom.slice(idx, idx + 8)
        const gpsItemDataView = new DataView(gpsItem)
        let address = gpsItemDataView.getInt32(0, false)
        const size = gpsItemDataView.getInt32(4, false)

        // Go to the offset as defined in the file
        // Skip the initial 16 bytes starting with "GPS " as it is unknown what they represent, nor are they important.
        address += 16
        const gpsDataBox = file.slice(address, address + size)

        const dataView = new DataView(gpsDataBox)
        const hour = dataView.getInt32(0, true)
        const minutes = dataView.getInt32(4, true)
        const seconds = dataView.getInt32(8, true)
        const year = dataView.getInt32(12, true)
        const month = dataView.getInt32(16, true)
        const day = dataView.getInt32(20, true)

        const decoder = new TextDecoder()
        const latHemisphere = decoder.decode(dataView.buffer.slice(25, 26)) // 'N'orth or 'South'
        const lonHemisphere = decoder.decode(dataView.buffer.slice(26, 27)) // 'E'ast or 'W'est

        // The 27th byte in this series is an unknown value.. So skip right to 28th byte
        // Keep in mind that according to the blog post, the coordinates are in DDDmm.mmmm values.
        const latitude = dataView.getFloat32(28, true)
        const longitude = dataView.getFloat32(32, true)
        const knots = dataView.getFloat32(36, true)
        const bearing = dataView.getFloat32(40, true)

        // Knots to km/h
        const speed = knots * 1.852

        // Fix coordinates
        const latitudeFixed = this.fixCoordinates(latHemisphere, latitude)
        const longitudeFixed = this.fixCoordinates(lonHemisphere, longitude)

        videoGPSData.push({
          timestamp: new Date(2000 + year, month - 1, day, hour, minutes, seconds),
          latitude: latitudeFixed,
          longitude: longitudeFixed,
          speed: speed,
          bearing: bearing,
        })

        idx += 8
      }

      promiseResolve({ filename: this.file.name, gpsData: videoGPSData })
    }

    this.fileReader.readAsArrayBuffer(this.file)

    return promise
  }

  fixCoordinates(hemisphere: string, coordinate: number) {
    const minutes = coordinate % 100
    const degrees = coordinate - minutes
    const result = degrees / 100 + minutes / 60

    if (['S', 'W'].includes(hemisphere)) {
      return -1 * result
    }

    return result
  }
}
