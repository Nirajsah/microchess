import { Piece, Square } from './types'
import {
  whiteRook,
  whiteKnight,
  whiteBishop,
  whiteQueen,
  blackRook,
  blackKnight,
  blackBishop,
  blackQueen
} from "@/assets"

import { promotePiece } from './utils'

interface PromotionCardProps {
  color: 'white' | 'black'
  promoteData: { from: Square; to: Square; piece: Piece; show: boolean }
  setPromoteData: (value: {
    from: Square
    to: Square
    piece: Piece
    show: boolean
  }) => void
}

const blackPieces: { image: string; piece: Piece }[] = [
  { image: blackQueen, piece: 'bQ' },
  {
    image: blackRook,
    piece: 'bR',
  },
  { image: blackBishop, piece: 'bB' },
  {
    image: blackKnight,
    piece: 'bN',
  },
]

const whitePieces: { image: string; piece: Piece }[] = [
  { image: whiteQueen, piece: 'wQ' },
  {
    image: whiteRook,
    piece: 'wR',
  },
  { image: whiteBishop, piece: 'wB' },
  {
    image: whiteKnight,
    piece: 'wN',
  },
]

export const PromotionCard = ({
  color,
  promoteData,
  setPromoteData,
}: PromotionCardProps) => {

  const pieceData = color === 'white' ? whitePieces : blackPieces

  const promotion = async (
    piece: Piece,
    promoteData: { from: Square; to: Square; piece: Piece; show: boolean }
  ) => {
    console.log('Promote Piece:', promoteData, piece)

    promotePiece(promoteData.from, promoteData.to, promoteData.piece, piece)

    setPromoteData({ ...promoteData, show: false })
  }

  return (
    <div className="w-fit flex border bg-white drop-shadow-sm rounded-xl">
      {pieceData.map((piece, index) => (
        <div
          className="w-[10vw] h-[10vh] max-w-[90px] max-h-[50px] sm:max-h-[80px] flex items-center hover:scale-110 p-2 md:p-3 hover:cursor-pointer"
          key={index}
        >
          <img
            onClick={() => promotion(piece.piece, promoteData)}
            className="w-full h-full object-contain"
            src={piece.image}
            alt={piece.piece}
          />
        </div>
      ))}
    </div>
  )
}
