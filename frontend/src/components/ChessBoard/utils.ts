import { Piece, Square } from './types'

function request(query: string): Promise<any> {
  let APP_ID =
    '4b2a9e5098c0eb3a747e47b953902e77866aabf44eae633cd2d2266e7cc3aee7'
  // ;(async () => {
  //   await window.linera?.request({
  //     type: 'QUERY',
  //     applicationId: APP_ID,
  //     query: query,
  //   })
  // })()
  if (!window.linera) throw new Error('Linera extension not found.')

  return window.linera.request({
    type: 'QUERY',
    applicationId: APP_ID,
    query: query,
  })
}

export function makeMove(from: Square, to: Square, piece: Piece) {
  let query = `{ "query": "mutation { makeMove(from: ${from}, to: ${to}, piece: ${piece}) }" }`
  request(query).then((res) => res)
}

export function promotePiece(
  from: Square,
  to: Square,
  piece: Piece,
  promoted_to: Piece
) {
  let query = `{ "query": "mutation { promotePiece(from: ${from}, to: ${to}, piece: ${piece}, promoted_to: ${promoted_to}) }" }`
  request(query)
}
function buildGraphQLQuery(queryBody: string): string {
  return JSON.stringify({ query: queryBody })
}

/**
 * Constructs a `newGame` mutation payload for the given player address.
 */
// Escape backslashes and double-quotes in the player string

// Start a new game
export function startGame(player: string) {
  const escapedPlayer = player.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  console.log('Starting new game for player:', player)
  const mutation = `mutation { newGame(player: "${escapedPlayer}") }`
  let query = buildGraphQLQuery(mutation)
  request(query)
}

// Ask the wallet to assign the wallet with new chain
export function assign(chainId: string, timestamp: string) {
  ;(async () => {
    await window.linera?.request({
      type: 'ASSIGNMENT',
      chainId: chainId,
      timestamp: timestamp,
    })
  })()
}

// export function getGameChainInfo() {
//   request(`{ "query": "query { gameChain { chainId timestamp } }" }`)
//     .then((response) => {
//       // {id: '1mgidwkeyasj', result: '{"data":{"gameChain":{"chainId":"62d7d16a20c647562…9095f4e9ec3b7381","timestamp":1761042563936459}}}'}

//       return response
//     })
//     .catch((error) => {
//       console.error('Error fetching game chain info:', error)
//     })
// }

export function getGameChainInfo() {
  return request(`{ "query": "query { gameChain { chainId timestamp } }" }`)
}

export function requestFen() {
  return request(`{ "query": "query { getFen }" }`)
}
