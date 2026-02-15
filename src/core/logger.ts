export class Logger {
  static debug(...args: unknown[]): void {
    console.log('[GPS]', ...args)
  }

  static warn(...args: unknown[]): void {
    console.warn('[GPS]', ...args)
  }
}
