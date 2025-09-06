export interface LineraRequest {
  method: string
  params?: any
}

export async function lineraRequest(request: LineraRequest) {
  if (!window.linera) throw new Error('Linera extension not found.')
  return await window.linera.request(request)
}
