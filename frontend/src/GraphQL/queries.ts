import { gql } from 'graphql-tag'

export const NOTIFICATIONS = gql`
  subscription Notifications($chainId: ID!) {
    notifications(chainId: $chainId)
  }
`

export const GET_BOARD = gql`
  query {
    board
  }
`

export const MOVE_PIECE = gql`
  mutation MakeMove($from: String!, $to: String!, $piece: String!) {
    makeMove(from: $from, to: $to, piece: $piece)
  }
`
// mutation {
//   capturePiece(from: "e5", to: "f7", piece: "wN", capturedPiece: "bP")
// }

export const CAPTURE_PIECE = gql`
  mutation CapturePiece(
    $from: String!
    $to: String!
    $piece: String!
    $capturedPiece: String!
  ) {
    capturePiece(
      from: $from
      to: $to
      piece: $piece
      capturedPiece: $capturedPiece
    )
  }
`

export const GET_PLAYER_TURN = gql`
  query {
    playerTurn
  }
`

export const GET_PLAYER = gql`
  query Player($player: ID!) {
    player(player: $player)
  }
`
// query {
//   getMoves {
//     white
//     black
//   }
// }

export const GET_MOVES = gql`
  query {
    getMoves {
      white
      black
    }
  }
`
