import { Piece, Square, SquareToPieceMap } from './types'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['1', '2', '3', '4', '5', '6', '7', '8']

function isValidSquare(square: string): square is Square {
  return /^[a-h][1-8]$/.test(square)
}

export function generatePossibleMoves(
  piece: Piece,
  square: Square,
  board: SquareToPieceMap,
  whiteCastle: boolean,
  blackCastle: boolean,
  en_passant: Square
): Square[] {
  const [file, rank] = square.split('')
  const fileIndex = files.indexOf(file)
  const rankIndex = ranks.indexOf(rank)
  const possibleMoves: Square[] = []

  const isWhitePiece = piece.charAt(0) === 'w'

  function addMove(newFile: number, newRank: number): boolean {
    if (newFile < 0 || newFile > 7 || newRank < 0 || newRank > 7) {
      return false
    }
    const newSquare = `${files[newFile]}${ranks[newRank]}` as Square
    const pieceAtNewSquare = board[newSquare]
    if (!pieceAtNewSquare) {
      possibleMoves.push(newSquare)
      return true
    } else if (pieceAtNewSquare.charAt(0) !== piece.charAt(0)) {
      possibleMoves.push(newSquare)
      return false
    }
    return false
  }

  function addMovesInDirection(dx: number, dy: number, maxSteps: number = 7) {
    for (let i = 1; i <= maxSteps; i++) {
      if (!addMove(fileIndex + i * dx, rankIndex + i * dy)) break
    }
  }

  // Helper function to check if a square is under attack
  function isSquareUnderAttack(square: Square, isWhite: boolean): boolean {
    for (const [sq, pc] of Object.entries(board)) {
      if (!pc || pc.charAt(0) === (isWhite ? 'w' : 'b')) continue
      const attackingMoves = generatePossibleMoves(
        pc,
        sq as Square,
        board,
        false, // Prevent infinite recursion
        false,
        'a1' as Square // Dummy value
      )
      if (attackingMoves.includes(square)) return true
    }
    return false
  }

  const pieceType = piece.charAt(1)

  switch (pieceType) {
    case 'P': // Pawn
      const direction = isWhitePiece ? 1 : -1
      if (addMove(fileIndex, rankIndex + direction)) {
        if ((isWhitePiece && rank === '2') || (!isWhitePiece && rank === '7')) {
          addMove(fileIndex, rankIndex + 2 * direction)
        }
      }
      // Diagonal captures
      ;[-1, 1].forEach((dx) => {
        const captureSquare =
          `${files[fileIndex + dx]}${ranks[rankIndex + direction]}` as Square
        // Normal capture
        if (
          isValidSquare(captureSquare) &&
          board[captureSquare] &&
          board[captureSquare]?.charAt(0) !== piece.charAt(0)
        ) {
          possibleMoves.push(captureSquare)
        }

        // En passant capture
        if (
          isValidSquare(captureSquare) &&
          captureSquare === en_passant &&
          ((isWhitePiece && rank === '5') || (!isWhitePiece && rank === '4'))
        ) {
          possibleMoves.push(captureSquare)
        }
      })
      break

    case 'R': // Rook
      ;[
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ].forEach(([dx, dy]) => addMovesInDirection(dx, dy))
      break

    case 'N': // Knight
      ;[
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ].forEach(([dx, dy]) => addMove(fileIndex + dx, rankIndex + dy))
      break

    case 'B': // Bishop
      ;[
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dx, dy]) => addMovesInDirection(dx, dy))
      break

    case 'Q': // Queen
      ;[
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dx, dy]) => addMovesInDirection(dx, dy))
      break

    case 'K': // King
      ;[
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dx, dy]) => addMovesInDirection(dx, dy, 1))

      // Castling
      if ((isWhitePiece && whiteCastle) || (!isWhitePiece && blackCastle)) {
        const baseRank = isWhitePiece ? '1' : '8'
        const kingStartSquare = `e${baseRank}` as Square

        // Only check castling if king is in starting position
        if (square === kingStartSquare) {
          // Kingside castling
          if (
            !board[`f${baseRank}` as Square] &&
            !board[`g${baseRank}` as Square] &&
            board[`h${baseRank}` as Square]?.charAt(1) === 'R'
          ) {
            // Check if king's path is not under attack
            if (
              !isSquareUnderAttack(kingStartSquare, isWhitePiece) &&
              !isSquareUnderAttack(`f${baseRank}` as Square, isWhitePiece) &&
              !isSquareUnderAttack(`g${baseRank}` as Square, isWhitePiece)
            ) {
              possibleMoves.push(`g${baseRank}` as Square)
            }
          }

          // Queenside castling
          if (
            !board[`d${baseRank}` as Square] &&
            !board[`c${baseRank}` as Square] &&
            !board[`b${baseRank}` as Square] &&
            board[`a${baseRank}` as Square]?.charAt(1) === 'R'
          ) {
            // Check if king's path is not under attack
            if (
              !isSquareUnderAttack(kingStartSquare, isWhitePiece) &&
              !isSquareUnderAttack(`d${baseRank}` as Square, isWhitePiece) &&
              !isSquareUnderAttack(`c${baseRank}` as Square, isWhitePiece)
            ) {
              possibleMoves.push(`c${baseRank}` as Square)
            }
          }
        }
      }
      break
  }

  return possibleMoves
}

export default generatePossibleMoves
