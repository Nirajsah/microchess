import { Piece, Square } from './types'

function request(query: string): Promise<any> {
  let APP_ID =
    'f8b151c115ec1f363ebf2d607fd2b1842906f23de2948ae8fcfb81fdef9c078e'
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
  storage.setPublicKey(player)
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

export function getGameChainInfo() {
  return request(`{ "query": "query { gameChain { chainId timestamp } }" }`)
}

export function gameData() {
  return request(`{ "query": "query { getFen }" }`)
}



export const storage = {
  getTheme: () => localStorage.getItem("chess.theme"),
  setTheme: (id: string) => localStorage.setItem("chess.theme", id),

  getPublicKey: () => localStorage.getItem("chess.public_key"),
  setPublicKey: (key: string) => localStorage.setItem("chess.public_key", key),

  getSessionId: () => sessionStorage.getItem("chess.session_id"),
  setSessionId: (id: string) => sessionStorage.setItem("chess.session_id", id),
};
