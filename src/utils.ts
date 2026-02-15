export class Mp4Utility {
  static getAtom(buffer: ArrayBuffer, atomName: string): ArrayBuffer {
    const view = new DataView(buffer)
    let offset = 0

    while (offset < buffer.byteLength - 8) {
      const size = view.getUint32(offset, false)
      const name = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7),
      )

      if (size < 8) break

      if (name === atomName) {
        return buffer.slice(offset + 8, offset + size)
      }

      offset += size
    }

    return new ArrayBuffer(0)
  }
}
