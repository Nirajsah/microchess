import { Piece } from './types'
import whiteRook from '../../assets/new_assets/wr.png'
import whiteKnight from '../../assets/new_assets/wn.png'
import whiteBishop from '../../assets/new_assets/wb.png'
import whiteQueen from '../../assets/new_assets/wq.png'
import blackRook from '../../assets/new_assets/br.png'
import blackKnight from '../../assets/new_assets/bn.png'
import blackBishop from '../../assets/new_assets/bb.png'
import blackQueen from '../../assets/new_assets/bq.png'

interface PromotionCardProps {
  color: 'white' | 'black'
  promoteData: { from: string; to: string; show: boolean }
  setPromoteData: (value: { from: string; to: string; show: boolean }) => void
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

const promotePiece = (
  piece: Piece,
  setPromoteData: (value: { from: string; to: string; show: boolean }) => void,
  promoteData: { from: string; to: string; show: boolean }
) => {
  setPromoteData({ ...promoteData, show: false })
  console.log('PromotedPiece', piece, promoteData)
}

export const PromotionCard = ({
  color,
  promoteData,
  setPromoteData,
}: PromotionCardProps) => {
  const pieceData = color === 'white' ? whitePieces : blackPieces
  return (
    <div className="w-fit flex border bg-white drop-shadow-sm rounded-xl">
      {pieceData.map((piece, index) => (
        <div
          className="w-[12vw] h-[12vh] max-w-[90px] max-h-[50px] sm:max-h-[80px] flex items-center hover:scale-110 p-2 hover:cursor-pointer"
          key={index}
        >
          <img
            onClick={() =>
              promotePiece(piece.piece, setPromoteData, promoteData)
            }
            className="w-full h-full object-contain"
            src={piece.image}
            alt={piece.piece}
          />
        </div>
      ))}
    </div>
  )
}
