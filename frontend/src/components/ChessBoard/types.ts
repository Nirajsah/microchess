// types.ts

export type PieceColor = 'w' | 'b'

export type PieceType = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K'

export type Piece = `${PieceColor}${PieceType}`

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'

export type Square = `${File}${Rank}`

export type SquareToPieceMap = {
  [key in Square]?: Piece
}

export type ChessBoard = SquareToPieceMap

export type Move = {
  from: Square
  to: Square
  piece: Piece
  capturedPiece?: Piece
}

export type GameState = {
  board: ChessBoard
  currentTurn: PieceColor
  moveHistory: Move[]
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
}
