import { Piece, Square } from './types'

export function makeMove(from: Square, to: Square, piece: Piece) {
  console.log(from, to, piece)
}

export function promotePiece(
  from: Square,
  to: Square,
  piece: Piece,
  promoted_to: Piece
) {
  console.log(from, to, piece, promoted_to)
}
