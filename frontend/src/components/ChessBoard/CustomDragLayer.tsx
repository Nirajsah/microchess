import { Piece } from './types'

import {
  whitePawn,
  whiteRook,
  whiteKnight,
  whiteBishop,
  whiteQueen,
  whiteKing,
  blackPawn,
  blackRook,
  blackKnight,
  blackBishop,
  blackQueen,
  blackKing,
} from '../../assets'

const pieceImages: any = {
  wP: whitePawn,
  wR: whiteRook,
  wN: whiteKnight,
  wB: whiteBishop,
  wQ: whiteQueen,
  wK: whiteKing,
  bP: blackPawn,
  bR: blackRook,
  bN: blackKnight,
  bB: blackBishop,
  bQ: blackQueen,
  bK: blackKing,
}

interface LayerProps {
  dragPosition: { xPercent: number; yPercent: number }
  draggingPiece: Piece | null
}

export default function CustomDragLayer({
  draggingPiece,
  dragPosition,
}: LayerProps) {
  if (!draggingPiece) return null
  return (
    <div className="absolute w-full h-full pointer-events-none z-50">
      {draggingPiece && (
        <div
          style={{
            position: 'absolute',
            width: '10.5%', // One tile width (100 / 8)
            height: '10.5%',
            backgroundImage: `url(${pieceImages[draggingPiece]})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            left: `${dragPosition.xPercent}%`,
            top: `${dragPosition.yPercent}%`,
            transform: 'translate(-50%, -50%)', // Center the piece on the cursor
          }}
        />
      )}
    </div>
  )
}
