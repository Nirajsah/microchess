import { Piece } from './types'

import whitePawn from '@/assets/wp.png'
import whiteRook from '@/assets/wr.png'
import whiteKnight from '@/assets/wn.png'
import whiteBishop from '@/assets/wb.png'
import whiteQueen from '@/assets/wq.png'
import whiteKing from '@/assets/wk.png'
import blackPawn from '@/assets/bp.png'
import blackRook from '@/assets/br.png'
import blackKnight from '@/assets/bn.png'
import blackBishop from '@/assets/bb.png'
import blackQueen from '@/assets/bq.png'
import blackKing from '@/assets/bk.png'

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
