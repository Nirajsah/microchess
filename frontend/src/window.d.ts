export {}

declare global {
  interface Window {
    linera?: {
      request: (args: unknown) => Promise<unknown>
      on: (event: string, handler: (data: unknown) => void) => void
      off: (event: string, handler: (data: unknown) => void) => void
      // You can type it better if you know the exact shape of the args/response
    }
  }
}
