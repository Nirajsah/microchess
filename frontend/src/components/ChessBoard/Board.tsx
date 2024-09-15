import Tile from './Tile'
import whitePawn from '../../assets/new_assets/wp.png'
import whiteRook from '../../assets/new_assets/wr.png'
import whiteKnight from '../../assets/new_assets/wn.png'
import whiteBishop from '../../assets/new_assets/wb.png'
import whiteQueen from '../../assets/new_assets/wq.png'
import whiteKing from '../../assets/new_assets/wk.png'
import blackPawn from '../../assets/new_assets/bp.png'
import blackRook from '../../assets/new_assets/br.png'
import blackKnight from '../../assets/new_assets/bn.png'
import blackBishop from '../../assets/new_assets/bb.png'
import blackQueen from '../../assets/new_assets/bq.png'
import blackKing from '../../assets/new_assets/bk.png'
import React from 'react'
import { useMutation } from '@apollo/client'
import { CAPTURE_PIECE, MOVE_PIECE } from '../../GraphQL/queries'
// import generatePossibleMoves from './GeneratePossibleMoves'
// import Ranks from './Ranks'
export type Piece =
  | 'wP'
  | 'wN'
  | 'wB'
  | 'wR'
  | 'wQ'
  | 'wK'
  | 'bP'
  | 'bN'
  | 'bB'
  | 'bR'
  | 'bQ'
  | 'bK'

export type Square =
  | 'a1'
  | 'b1'
  | 'c1'
  | 'd1'
  | 'e1'
  | 'f1'
  | 'g1'
  | 'h1'
  | 'a2'
  | 'b2'
  | 'c2'
  | 'd2'
  | 'e2'
  | 'f2'
  | 'g2'
  | 'h2'
  | 'a3'
  | 'b3'
  | 'c3'
  | 'd3'
  | 'e3'
  | 'f3'
  | 'g3'
  | 'h3'
  | 'a4'
  | 'b4'
  | 'c4'
  | 'd4'
  | 'e4'
  | 'f4'
  | 'g4'
  | 'h4'
  | 'a5'
  | 'b5'
  | 'c5'
  | 'd5'
  | 'e5'
  | 'f5'
  | 'g5'
  | 'h5'
  | 'a6'
  | 'b6'
  | 'c6'
  | 'd6'
  | 'e6'
  | 'f6'
  | 'g6'
  | 'h6'
  | 'a7'
  | 'b7'
  | 'c7'
  | 'd7'
  | 'e7'
  | 'f7'
  | 'g7'
  | 'h7'
  | 'a8'
  | 'b8'
  | 'c8'
  | 'd8'
  | 'e8'
  | 'f8'
  | 'g8'
  | 'h8'

export type SquareToPieceMap = {
  [key in Square]?: Piece
}
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

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

export default function Board({
  board,
  isBlack,
  color,
  player,
  isKingInCheck,
}: {
  board: SquareToPieceMap
  isBlack: boolean
  color: string
  player: string
  isKingInCheck?: string | null
}) {
  const [possMoves, setPossMoves] = React.useState<Square[]>([])

  const [selectedPiece, setSelectedPiece] = React.useState<Piece | null>(null)
  const [selectedSquare, setSelectedSquare] = React.useState<Square | null>(
    null
  )

  const [moveMutation] = useMutation(MOVE_PIECE)
  const [captureMutation] = useMutation(CAPTURE_PIECE)

  function getKingPosition(board: SquareToPieceMap) {
    for (const [square, piece] of Object.entries(board)) {
      if (piece === 'wK' && isKingInCheck === 'wK') {
        return square
      }
      if (piece === 'bK' && isKingInCheck === 'bK') {
        return square
      }
    }
    return null // Return null if no white king is found
  }

  const handleSquareClick = (
    square: Square,
    piece: Piece,
    capturedPiece: Piece | undefined
  ) => {
    if (piece && selectedSquare) {
      if (possMoves.includes(square)) {
        if (capturedPiece) {
          capturePiece(selectedSquare, square, piece, capturedPiece) // from, to, piece, capturedPiece
        } else {
          movePiece(selectedSquare, square, piece) // from, to, piece
        }
        setSelectedPiece(null)
        setSelectedSquare(null)
        setPossMoves([])
      } else {
        setSelectedPiece(null)
        setSelectedSquare(null)
        setPossMoves([])
      }
    } else if (piece) {
      setSelectedPiece(piece)
      setSelectedSquare(square)
    }
  }

  const capturePiece = async (
    from: string,
    to: string,
    piece: string,
    capturedPiece: string
  ) => {
    await captureMutation({
      variables: {
        piece,
        from: from,
        to: to,
        endpoint: 'chess',
        capturedPiece: capturedPiece,
      },
      onError: (error) => {
        console.error('Message:', error.message)
      },
    })
  }

  const movePiece = async (from: string, to: string, piece: string) => {
    await moveMutation({
      variables: {
        piece: piece,
        from: from,
        to: to,
        endpoint: 'chess',
      },
      onError: (error) => {
        console.error('Message:', error.message)
      },
    })
  }

  const boardRef = React.useRef<HTMLDivElement>(null)

  return (
    <div ref={boardRef} className="">
      {ranks.map((rank, rankIndex) => (
        <div key={rank} className="flex">
          {files.map((file, fileIndex) => {
            // Calculate the square position
            const square = isBlack
              ? files[7 - fileIndex] + (rankIndex + 1) // Adjust rank for black perspective
              : file + rank

            // Get the piece from the map using the square notation
            const piece = board[square as Square]

            const number = fileIndex + rankIndex

            const KingInCheck = getKingPosition(board)

            const backgroundColor =
              square === KingInCheck
                ? 'purple'
                : selectedSquare === square
                  ? '#69ba53'
                  : number % 2 === 0
                    ? '#ff685321'
                    : '#ff2a00bf'

            const onDrop = (
              e: React.DragEvent<HTMLDivElement>,
              to: Square,
              capturedPiece: Piece
            ) => {
              e.preventDefault()
              const [piece] = e.dataTransfer.getData('text').split(',')
              setSelectedPiece(piece as Piece)
              setSelectedSquare(null)
              setPossMoves([])
              handleSquareClick(to, piece as Piece, capturedPiece)
            }

            const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault()
            }

            return (
              <div
                onDrop={(e) => {
                  onDrop(e, square as Square, piece as Piece)
                }}
                onDragOver={(e) => {
                  onDragOver(e)
                }}
                className="flex w-full justify-center items-center relative pieces"
                key={file}
                style={{
                  backgroundColor,
                  width: '90px',
                  height: '90px',
                  borderRadius: '4px',
                }}
                // onClick={(e) => {
                //   e.preventDefault()
                //   if (color === player) {
                //     handleSquareClick(square as Square, piece)
                //   }
                // }}
                onDrag={(e) => {
                  e.preventDefault()
                }}
              >
                {piece && (
                  <Tile
                    image={pieceImages[piece]}
                    piece={piece}
                    square={square as Square}
                    setSelectedSquare={setSelectedSquare}
                    board={board}
                    setPossMoves={setPossMoves}
                  />
                )}

                {possMoves.includes(square as Square) && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      backgroundColor: 'red', // Adjust color if needed
                      borderRadius: '50%',
                      zIndex: 1,
                    }}
                  ></div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
