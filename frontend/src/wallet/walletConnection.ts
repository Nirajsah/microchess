export function connect_wallet(): Promise<any> {
  if (!window.linera) throw new Error('Linera extension not found.')

  return window.linera.request({
    type: 'CONNECT_WALLET',
  })
}
