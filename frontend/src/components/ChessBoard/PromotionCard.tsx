import { Piece } from './types'
import whiteRook from '../../assets/new_assets/wr.png'
import whiteKnight from '../../assets/new_assets/wn.png'
import whiteBishop from '../../assets/new_assets/wb.png'
import whiteQueen from '../../assets/new_assets/wq.png'
import blackRook from '../../assets/new_assets/br.png'
import blackKnight from '../../assets/new_assets/bn.png'
import blackBishop from '../../assets/new_assets/bb.png'
import blackQueen from '../../assets/new_assets/bq.png'
import { useMutation } from '@apollo/client'
import { PROMOTE_PIECE } from '../../GraphQL/queries'

interface PromotionCardProps {
  color: 'white' | 'black'
  promoteData: { from: string; to: string; piece: string; show: boolean }
  setPromoteData: (value: {
    from: string
    to: string
    piece: string
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
  const [promoteMutation] = useMutation(PROMOTE_PIECE)

  const pieceData = color === 'white' ? whitePieces : blackPieces

  const promotePiece = async (
    piece: Piece,
    promoteData: { from: string; to: string; piece: string; show: boolean }
  ) => {
    console.log('Promote Piece:', promoteData, piece)
    await promoteMutation({
      variables: {
        from: promoteData.from,
        to: promoteData.to,
        piece: promoteData.piece,
        promotedPiece: piece,
        endpoint: 'chess',
      },
      onError: (error: any) => {
        console.error('Message:', error.message)
      },
    })
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
            onClick={() => promotePiece(piece.piece, promoteData)}
            className="w-full h-full object-contain"
            src={piece.image}
            alt={piece.piece}
          />
        </div>
      ))}
    </div>
  )
}
