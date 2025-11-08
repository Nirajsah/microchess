import { Piece, Square } from './types'

function request(query: string): Promise<any> {
  let APP_ID = import.meta.env.VITE_MICROCHESS_APPLICATION_ID

  if (!window.linera) throw new Error('Linera extension not found.')

  return window.linera.request({
    type: 'QUERY',
    applicationId: APP_ID,
    query: query,
  })
}

export function gameData(player: string): Promise<any> {
  const escapedPlayer = player.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const query = `query {
    gameData(player: "${escapedPlayer}") {
      fen
      color
      opponent
      gameState
      winner
    }
  }`
  const gqlQuery = buildGraphQLQuery(query)
  return request(gqlQuery)
}

export function makeMove(from: string, to: string, piece: string) {
  console.log(from, to, piece)
  const mutation = `mutation { makeMove(from: "${from}", to: "${to}", piece: "${piece}") }`
  const gqlQuery = JSON.stringify({ query: mutation })
  request(gqlQuery).then((res) => console.log(res))
}

export function promotePiece(
  from: Square | string,
  to: Square | string,
  piece: Piece | string,
  promoted_to: Piece | string
) {
  const mutation = `mutation { promotePiece(from: "${from}", to: "${to}", piece: "${piece}", promoted_to: "${promoted_to}") }`
  const query = buildGraphQLQuery(mutation)
  request(query).then((res) => console.log(res))
}

function buildGraphQLQuery(queryBody: string): string {
  return JSON.stringify({ query: queryBody })
}

/**
 * Constructs a `newGame` mutation payload for the given player address.
 */
// Escape backslashes and double-quotes in the player string

// Start a new game
export function startGame() {
  const mutation = `mutation { newGame }`
  let query = buildGraphQLQuery(mutation)
  request(query).then((res) => console.log(res))
}
// Request a friendly match
export function reqFriendlyGame() {
  const mutation = `mutation { frGame }`
  let query = buildGraphQLQuery(mutation)
  request(query).then((res) => console.log(res))
}

export function gameId() {
  const mutation = `query { friendId }`
  let query = buildGraphQLQuery(mutation)
  return request(query)
}

// query {
//   friendId
// }

// Ask the wallet to assign the wallet with new chain
export function assignChain(chainId: string, timestamp: number) {
  ;(async () => {
    await window.linera?.request({
      type: 'ASSIGNMENT',
      chainId: chainId,
      timestamp: timestamp,
    })
  })()
}

export function isGameChain() {
  return request(`{ "query": "query { isGameChain }" }`)
}

export function getGameChainInfo() {
  return request(`{ "query": "query { gameChain { chainId timestamp } }" }`)
}

export function getMvString() {
  return request(`{ "query": "query { mvString }" }`)
}

export function timer() {
  return request(`{ "query": "query { timer { white black } }" }`)
}

export const storage = {
  getTheme: () => localStorage.getItem('chess.theme'),
  setTheme: (id: string) => localStorage.setItem('chess.theme', id),

  getPublicKey: () => localStorage.getItem('chess.public_key'),
  setPublicKey: (key: string) => localStorage.setItem('chess.public_key', key),

  getSessionId: () => sessionStorage.getItem('chess.session_id'),
  setSessionId: (id: string) => sessionStorage.setItem('chess.session_id', id),
}
