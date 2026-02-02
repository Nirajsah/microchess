import { useWalletStore } from '@/store/wallet.ts'
import { Piece, Square } from '../ChessBoard/types.ts'
import { TournamentInput, TournamentUpdate } from '@/graphql/graphql.ts'

// export function connect_wallet(): Promise<any> {
//   if (!window.linera) throw new Error('Linera extension not found.')

//   return window.linera.request({
//     type: 'CONNECT_WALLET',
//   })
// }

// // Ask the wallet to assign the wallet with new chain
// export function assignChain(chainId: string, timestamp: number) {
//   ;(async () => {
//     await window.linera?.request({
//       type: 'ASSIGNMENT',
//       chainId: chainId,
//       timestamp: timestamp,
//     })
//   })()
// }

function request(query: string): Promise<any> {
  const APP_ID = import.meta.env.VITE_MICROCHESS_APPLICATION_ID

  const ready = useWalletStore.getState().ready
  const requestAsync = useWalletStore.getState().requestAsync

  if (!ready) {
    console.log('Server NOT READY!')
    return Promise.reject('Server not ready')
  }

  return requestAsync({
    type: 'QUERY',
    applicationId: APP_ID,
    query: query,
  })

  // if (!window.linera) throw new Error('Linera extension not found.')

  // return window.linera.request({
  //   type: 'QUERY',
  //   applicationId: APP_ID,
  //   query: query,
  // })
}
export function getNofitications() {
  const query =
    'query { notifications { title notificationType chainId data sender read createdAt } }'
  return request(buildGraphQLQuery(query))
}

export function getNofiticationCount() {
  const query = 'query { notificationCount }'
  return request(buildGraphQLQuery(query))
}

export function myTournaments() {
  const query =
    'query { myTournaments { tournamentId bannerImageUrl tournamentName tournamentFormat tournamentDescription status maxPlayers prizePool } }'
  return request(buildGraphQLQuery(query))
}

export function myTournament(tournamentId: string) {
  const query = `query { myTournament(tournamentId: "${tournamentId}") { organiserChain organiserId organiserName tournamentId bannerImageUrl sponsorLogoUrl timeControl { baseMinutes incrementSeconds } tournamentName tournamentDescription tournamentFormat matchType gameMode maxPlayers minPlayers startingTime endTime status prizePool prizePoolDescription customTags visibility } }`
  return request(buildGraphQLQuery(query))
}

export function getSanFromBlob(blobHash: string) {
  const query = `query { readMoves(hash: "${blobHash}") { moves outcome } }`
  const gqlQuery = JSON.stringify({ query: query })
  return request(gqlQuery)
}

export function _isGameChain() {
  return request(`{ "query": "query { isGameChain }" }`)
}

// Triggers processing of pending incoming messages on the current chain
export function syncChain() {
  const mutation = `mutation { sync }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}

export function getGameChainInfo() {
  return request(`{ "query": "query { gameChain }" }`)
}

export function getMvString() {
  return request(`{ "query": "query { mvString }" }`)
}

export function timer() {
  return request(`{ "query": "query { timer { white black } }" }`)
}

export function gameData(player: string): Promise<any> {
  const query = `query {
    gameData(player: "${player}") {
      fen
      color
      opponent
      gameState
      winner
      lastMove {
        from
        to
      }
    }
  }`
  const gqlQuery = buildGraphQLQuery(query)
  return request(gqlQuery)
}

export function opponentProfile(opponent: string) {
  const query = `query {
    opponentProfile(opponent: "${opponent}") {
      name
      elo
      matches
      ath
    }
  }`
  const gqlQuery = JSON.stringify({ query: query })
  return request(gqlQuery)
}

export function getProfile() {
  const query = `query { profile {
          name
          elo
          matches
          won
          lost
          ath
          chainId
          id
        } }`

  const gqlQuery = JSON.stringify({ query: query })
  return request(gqlQuery)
}

export function getMatchHistory() {
  const query = `query {
    matchHistoryAll {
      you {
        id
        name
      }
      opponent {
        id
        name
      }
      blobHash
    }
  }`

  const gqlQuery = JSON.stringify({ query: query })
  return request(gqlQuery)
}

export function friendId() {
  const query = `query { friendId }`
  const gqlQuery = JSON.stringify({ query: query })
  return request(gqlQuery)
}

export function capturedPiece() {
  const query = `query { capturedPieces }`
  const gqlQuery = JSON.stringify({ query: query })
  return request(gqlQuery)
}

function buildGraphQLQuery(queryBody: string): string {
  return JSON.stringify({ query: queryBody })
}

/** ---------------------------------------Mutation---------------------- */

export function hostTournament(input: TournamentInput) {
  const m = `mutation { hostTournament(value: {
    organiserName: "${input.organiserName}",
    tournamentName: "${input.tournamentName}",
    tournamentDescription: "${input.tournamentDescription}",
    tournamentFormat: "${input.tournamentFormat}"
    matchType: "${input.matchType}",
    gameMode: "${input.gameMode}",
    timeControl: {
      baseMinutes: ${input.timeControl.baseMinutes},
      incrementSeconds: ${input.timeControl.incrementSeconds},
    },
    maxPlayers: ${input.maxPlayers},
    minPlayers: ${input.minPlayers},
    startingTime: ${input.startingTime},
    endTime: ${input.endTime},
    prizeType: "${input.prizeType}",
    prizePool: ${input.prizePool},
    prizePoolDescription: "${input.prizePoolDescription}",
    bannerImageUrl: "${input.bannerImageUrl}",
    sponsorLogoUrl: "${input.sponsorLogoUrl}",
    visibility: "${input.visibility}",
    customTags: "${input.customTags}",
    status: "${input.status}"
  }) }`
  const gqlQuery = JSON.stringify({ query: m })
  return request(gqlQuery)
}

export function tournamentRegistration(
  tournamentId: string,
  tournamentChain: string
) {
  const mutation = `mutation { tournamentRegistration(tournamentId: "${tournamentId}", tournamentChain: "${tournamentChain}" ) }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}

export function startRound(tournamentId: string) {
  const mutation = `mutation { startRound(tournamentId: "${tournamentId}") }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}


export function updateTournamentLocal(
  tournamentId: string,
  updates: TournamentUpdate
) {
  const m = `mutation { updateTournamentLocal(tournamentId: "${tournamentId}" update: {
      tournamentName: "${updates.tournamentName}",
      tournamentDescription: "${updates.tournamentDescription}",
      bannerImageUrl: "${updates.bannerImageUrl}",
      sponsorLogoUrl: "${updates.sponsorLogoUrl}",
      customTags: "${updates.customTags}",
      status: "${updates.status}",
      prizePool: ${updates.prizePool},
      prizeType: "${updates.prizeType}",
      visibility: "${updates.visibility}",
    }) }`

  const gqlQuery = JSON.stringify({ query: m })
  return request(gqlQuery)
}

export function updateTournament(
  tournamentId: string,
  updates: TournamentUpdate
) {
  const m = `mutation { updateTournament(tournamentId: "${tournamentId}" update: {
      tournamentName: "${updates.tournamentName}",
      tournamentDescription: "${updates.tournamentDescription}",
      bannerImageUrl: "${updates.bannerImageUrl}",
      sponsorLogoUrl: "${updates.sponsorLogoUrl}",
      customTags: "${updates.customTags}",
      status: "${updates.status}",
      prizePool: ${updates.prizePool},
      prizeType: "${updates.prizeType}",
      visibility: "${updates.visibility}",
    }) }`

  const gqlQuery = JSON.stringify({ query: m })
  return request(gqlQuery)
}

export function markAllNotificationsRead() {
  const mutation = `mutation { markAllRead }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}

// Start a new game
export function startGame() {
  const mutation = `mutation { newGame }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}

export function resign() {
  const mutation = `mutation { resign }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}

export function claimForfeit() {
  const mutation = `mutation { claimForfeit }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}

// Deletes chain metadata from user's state
export function deleteInfo() {
  const mutation = `mutation { deleteChainMetadata }`
  const query = buildGraphQLQuery(mutation)
  request(query).then((_) => console.log('chain info metadata deleted'))
}

export function gameWithToken(token: string) {
  const mutation = `mutation { frGameHash(token: "${token}") }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}

export function updateProfile(name: string) {
  const mutation = `mutation { profile(name: "${name}") }`
  const query = buildGraphQLQuery(mutation)
  return request(query)
}

export function makeMove(from: string, to: string, piece: string) {
  const mutation = `mutation { makeMove(from: "${from}", to: "${to}", piece: "${piece}") }`
  const gqlQuery = JSON.stringify({ query: mutation })
  request(gqlQuery).then((p) => console.log(p))
}

export function promotePiece(
  from: Square | string,
  to: Square | string,
  piece: Piece | string,
  promoted_to: Piece | string
) {
  const mutation = `mutation { pawnPromotion(from: "${from}", to: "${to}", piece: "${piece}", promotedPiece: "${promoted_to}") }`
  const query = buildGraphQLQuery(mutation)
  request(query).then((res) => console.log(res))
}

// Generate wager token and schedule createWager operation
// Returns encoded token that should be shared with opponent
export function generateWagerToken(amount: string) {
  const query = `query { generateWagerToken(amount: "${amount}") }`
  const gqlQuery = buildGraphQLQuery(query)
  return request(gqlQuery)
}

// Join a wager match using the token shared by creator
export function joinWager(token: string) {
  const query = `query { joinWager(tokenStr: "${token}") }`
  const gqlQuery = buildGraphQLQuery(query)
  return request(gqlQuery)
}

// Decode wager token on frontend to show details before joining
export function decodeWagerToken(token: string): WagerTokenDetails | null {
  try {
    const decoded = atob(token)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export interface WagerTokenDetails {
  creator: {
    value: string
  }
  amount: string
  created_at: { micros: number }
  expires_at: { micros: number }
}

export const storage = {
  getTheme: () => localStorage.getItem('chess.theme'),
  setTheme: (id: string) => localStorage.setItem('chess.theme', id),

  getPublicKey: () => localStorage.getItem('chess.public_key'),
  setPublicKey: (key: string) => localStorage.setItem('chess.public_key', key),

  getSessionId: () => sessionStorage.getItem('chess.session_id'),
  setSessionId: (id: string) => sessionStorage.setItem('chess.session_id', id),

  getGameState: () => localStorage.getItem('chess.game_state'),
  setGameState: (state: string) =>
    localStorage.setItem('chess.game_state', state),
  removeGameState: () => localStorage.removeItem('chess.game_state'),
}
