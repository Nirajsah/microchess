import { gql } from 'graphql-tag'

export const NOTIFICATIONS = gql`
  subscription Notifications($chainId: ID!) {
    notifications(chainId: $chainId)
  }
`

export const GET_BOARD = gql`
  query {
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
`

export const MOVE_PIECE = gql`
  mutation MakeMove($from: String!, $to: String!, $piece: String!) {
    makeMove(from: $from, to: $to, piece: $piece)
  }
`
export const GET_PLAYER_TURN = gql`
  query {
    playerTurn
  }
`

export const GET_PLAYER_COLOR = gql`
  query {
    PlayerColor(player: Owner!) {
      color
    } 
  }
`
