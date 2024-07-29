import { gql } from 'graphql-tag'

export const NOTIFICATIONS = gql`
  subscription Notifications($chainId: ID!) {
    notifications(chainId: $chainId)
  }
`

export const GET_BOARD = gql`
  query {
    board {
      entries {
        value {
          board {
            wP
            wN
            wB
            wR
            wQ
            wK
            bP
            bN
            bB
            bR
            bQ
            bK
          }
        }
      }
    }
  }
`

export const MOVE_PIECE = gql`
  mutation MovePiece($piece: String!, $from: String!, $to: String!) {
    movePiece(piece: $piece, from: $from, to: $to) {
      from
      to
    }
  }
`
