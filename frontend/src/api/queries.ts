import { Piece, Square } from "../components/ChessBoard/types.ts";

export function connect_wallet(): Promise<any> {
  if (!window.linera) throw new Error("Linera extension not found.");

  return window.linera.request({
    type: "CONNECT_WALLET",
  });
}

// Ask the wallet to assign the wallet with new chain
export function assignChain(chainId: string, timestamp: number) {
  (async () => {
    await window.linera?.request({
      type: "ASSIGNMENT",
      chainId: chainId,
      timestamp: timestamp,
    });
  })();
}

function request(query: string): Promise<any> {
  let APP_ID = import.meta.env.VITE_MICROCHESS_APPLICATION_ID;

  if (!window.linera) throw new Error("Linera extension not found.");

  return window.linera.request({
    type: "QUERY",
    applicationId: APP_ID,
    query: query,
  });
}

export function isGameChain() {
  return request(`{ "query": "query { isGameChain }" }`);
}

export function getGameChainInfo() {
  return request(`{ "query": "query { gameChain { chainId timestamp } }" }`);
}

export function getMvString() {
  return request(`{ "query": "query { mvString }" }`);
}

export function timer() {
  return request(`{ "query": "query { timer { white black } }" }`);
}

export function gameData(player: string): Promise<any> {
  const query = `query {
    gameData(player: "${player}") {
      fen
      color
      opponent
      gameState
      winner
    }
  }`;
  const gqlQuery = buildGraphQLQuery(query);
  return request(gqlQuery);
}

export function opponentProfile(opponent: string) {
  const query = `query {
    opponentProfile(opponent: "${opponent}") {
      name
      elo
      matches
      ath
    }
  }`;
  const gqlQuery = JSON.stringify({ query: query });
  return request(gqlQuery);
}

export function getProfile() {
  const query = `query { profile {
          name
          elo
          matches
          won
          lost
          ath
        } }`;

  const gqlQuery = JSON.stringify({ query: query });
  return request(gqlQuery);
}

export function friendId() {
  const query = `query { friendId }`;
  const gqlQuery = JSON.stringify({ query: query });
  return request(gqlQuery);
}

function buildGraphQLQuery(queryBody: string): string {
  return JSON.stringify({ query: queryBody });
}

/** ---------------------------------------Mutation---------------------- */
// Start a new game
export function startGame() {
  const mutation = `mutation { newGame }`;
  let query = buildGraphQLQuery(mutation);
  return request(query);
}
// Request a friendly match
export function reqFriendlyGame() {
  const mutation = `mutation { frGame }`;
  let query = buildGraphQLQuery(mutation);
  return request(query);
}

export function resign() {
  const mutation = `mutation { resign }`;
  let query = buildGraphQLQuery(mutation);
  return request(query);
}

export function gameWithToken(token: string) {
  const mutation = `mutation { frGameHash(token: "${token}") }`;
  let query = buildGraphQLQuery(mutation);
  return request(query);
}

export function updateProfile(name: string) {
  const mutation = `mutation { profile(name: "${name}") }`;
  let query = buildGraphQLQuery(mutation);
  return request(query);
}

export function makeMove(from: string, to: string, piece: string) {
  const mutation = `mutation { makeMove(from: "${from}", to: "${to}", piece: "${piece}") }`;
  const gqlQuery = JSON.stringify({ query: mutation });
  request(gqlQuery).then((res) => console.log(res));
}

export function promotePiece(
  from: Square | string,
  to: Square | string,
  piece: Piece | string,
  promoted_to: Piece | string
) {
  const mutation = `mutation { promotePiece(from: "${from}", to: "${to}", piece: "${piece}", promoted_to: "${promoted_to}") }`;
  const query = buildGraphQLQuery(mutation);
  request(query).then((res) => console.log(res));
}

export const storage = {
  getTheme: () => localStorage.getItem("chess.theme"),
  setTheme: (id: string) => localStorage.setItem("chess.theme", id),

  getPublicKey: () => localStorage.getItem("chess.public_key"),
  setPublicKey: (key: string) => localStorage.setItem("chess.public_key", key),

  getSessionId: () => sessionStorage.getItem("chess.session_id"),
  setSessionId: (id: string) => sessionStorage.setItem("chess.session_id", id),
};
