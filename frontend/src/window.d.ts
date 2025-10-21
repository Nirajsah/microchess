export {}

declare global {
  interface Window {
    linera?: {
      request: (args: unknown) => Promise<unknown>
      // You can type it better if you know the exact shape of the args/response
    }
  }
}
