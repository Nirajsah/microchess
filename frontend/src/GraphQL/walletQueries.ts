export type Query = {
  type: 'QUERY'
  application_id: string
  query: string
}

const quote = (str: string) => `"${str}"`
const wrapQuery = (query: string): Query => ({
  type: 'QUERY',
  application_id: import.meta.env.VITE_MICROCHESS_APPLICATION_ID,
  query,
})

export const getGameData = (player: string): Query =>
  wrapQuery(`query { gameData(player: ${quote(player)}) {
    board
    gameState
    moves {
      black
      white
    }
    opponent
    player
    playerTurn
  }}`)

export const getCapturedPieces = (): Query =>
  wrapQuery(`query { capturedPieces }`)

export const getTimeLeft = (): Query =>
  wrapQuery(`query { timeLeft { white black } }`)

export const getTimer = (): Query =>
  wrapQuery(`query { timer { blockDelay currentTurnStart timeLeft } }`)

export const getGameChain = (pubKey: string): Query =>
  wrapQuery(`query { getGameChain(pubKey: ${quote(pubKey)}) { chainId } }`)

export const getOwners = (): Query => wrapQuery(`query { owners }`)

export const makeMove = (from: string, to: string, piece: string): Query =>
  wrapQuery(
    `mutation { makeMove(from: ${quote(from)}, to: ${quote(to)}, piece: ${quote(
      piece
    )}) }`
  )

export const capturePiece = (
  from: string,
  to: string,
  piece: string,
  capturedPiece: string
): Query =>
  wrapQuery(
    `mutation { capturePiece(from: ${quote(from)}, to: ${quote(
      to
    )}, piece: ${quote(piece)}, capturedPiece: ${quote(capturedPiece)}) }`
  )

export const pawnPromotion = (
  from: string,
  to: string,
  piece: string,
  promotedPiece: string
): Query =>
  wrapQuery(
    `mutation { pawnPromotion(from: ${quote(from)}, to: ${quote(
      to
    )}, piece: ${quote(piece)}, promotedPiece: ${quote(promotedPiece)}) }`
  )

export const resign = (): Query => wrapQuery(`mutation { resign }`)

export const newGame = (player: string): Query =>
  wrapQuery(`mutation { newGame(player: ${quote(player)}) }`)

export const friendlyGame = (player: string, timer: string): Query =>
  wrapQuery(
    `mutation { friendlyGame(player: ${quote(player)}, timer: ${quote(
      timer
    )}) }`
  )

export const requestGame = (
  player: string,
  rank: string,
  timer: string
): Query =>
  wrapQuery(
    `mutation { requestGame(player: ${quote(player)}, rank: ${quote(
      rank
    )}, timer: ${quote(timer)}) }`
  )

export const startFriendlyGame = (hash: string, player: string): Query =>
  wrapQuery(
    `mutation { startFriendlyGame(hash: { id: ${quote(hash)} }, player: ${quote(
      player
    )}) }`
  )

export const startGame = (
  amount: string,
  matchTime: string,
  players: string[]
): Query =>
  wrapQuery(
    `mutation { startGame(amount: ${quote(amount)}, matchTime: ${quote(
      matchTime
    )}, players: [${players.map(quote).join(', ')}]) }`
  )
