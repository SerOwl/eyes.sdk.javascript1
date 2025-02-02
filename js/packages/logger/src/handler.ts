export type Handler = {
  log(message: any): void
  warn?(message: any): void
  error?(message: any): void
  fatal?(message: any): void
  open?(): void
  close?(): void
}
