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
import generatePossibleMoves from './GeneratePossibleMoves'
import { Piece, Square, SquareToPieceMap } from './types'
// import generatePossibleMoves from './GeneratePossibleMoves'
// import Ranks from './Ranks'

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
  setPromoteData,
}: {
  board: SquareToPieceMap
  isBlack: boolean
  color: string
  player: string
  isKingInCheck?: string | null
  setPromoteData: React.Dispatch<
    React.SetStateAction<{
      from: string
      to: string
      show: boolean
    }>
  >
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

  function getRank(square: Square): number {
    return parseInt(square.charAt(1))
  }

  const handleSquareClick = (
    to_square: Square,
    piece: Piece,
    capturedPiece: Piece | null
  ) => {
    if (piece && selectedSquare) {
      setPromoteData({
        from: selectedSquare,
        to: to_square,
        show: true,
      })
      if (possMoves.includes(to_square)) {
        if (piece === 'wP' && getRank(to_square) === 8) {
          // Show pop up of avaiable promotion, if promotionPiece is selected run the mutation
          setPromoteData({
            from: selectedSquare,
            to: to_square,
            show: true,
          })
        }

        if (piece === 'bP' && getRank(to_square) === 1) {
          // Show pop up of avaiable promotion, if promotionPiece is selected run the mutation
          setPromoteData({
            from: selectedSquare,
            to: to_square,
            show: true,
          })
        }

        if (capturedPiece) {
          capturePiece(selectedSquare, to_square, piece, capturedPiece) // from, to, piece, capturedPiece
        } else {
          movePiece(selectedSquare, to_square, piece) // from, to, piece
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
      const moves = generatePossibleMoves(piece, to_square, board)
      setPossMoves(moves)
      setSelectedPiece(piece)
      setSelectedSquare(to_square)
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
    <div ref={boardRef} className="w-full h-full">
      {ranks.map((rank, rankIndex) => (
        <div key={rank} className="flex w-full h-full">
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
                key={file}
                style={{
                  backgroundColor,
                  borderRadius: '4px',
                }}
                className="md:h-[90px] w-[12vw] h-[12vw] md:w-[90px] flex justify-center items-center relative pieces"
                onClick={(e) => {
                  e.preventDefault()
                  if (color === 'WHITE') {
                    // color === player
                    handleSquareClick(square as Square, piece as Piece, null)
                  }
                }}
                onDrag={(e) => {
                  e.preventDefault()
                }}
              >
                {
                  <Tile
                    image={pieceImages[piece as Piece]}
                    piece={piece as Piece}
                    square={square as Square}
                    setSelectedSquare={setSelectedSquare}
                    board={board}
                    setPossMoves={setPossMoves}
                  />
                }

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
