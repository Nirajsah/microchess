/** TODO: Replace with <ChessBoard /> after complete porting */
import Tile from './Tile'
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
import React from 'react'
import { useMutation } from '@apollo/client'
import { CAPTURE_PIECE, MOVE_PIECE } from '../../GraphQL/queries'
import generatePossibleMoves from './GeneratePossibleMoves'
import { BoardType, Color, Piece, Square, SquareToPieceMap } from './types'
import { useMicroChess } from '../../context/MicroChessProvider'
import { generate_possible_moves } from 'wasm'

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
  boardData,
  isBlack,
  color,
  player,
  setBoard,
  setPromoteData,
}: {
  boardData: BoardType
  isBlack: boolean
  color: Color
  player: Color
  setBoard: React.Dispatch<React.SetStateAction<any>>
  setPromoteData: React.Dispatch<
    React.SetStateAction<{
      from: string
      to: string
      piece: string
      show: boolean
    }>
  >
}) {
  const [hoveredSquare, setHoverSquare] = React.useState<Square | null>(null)
  const [possMoves, setPossMoves] = React.useState<Square[]>([])
  const [selectedPiece, setSelectedPiece] = React.useState<Piece | null>(null)
  const [selectedSquare, setSelectedSquare] = React.useState<Square | null>(
    null
  )
  const { chessSettings } = useMicroChess()

  const {
    position: board,
    KingInCheck,
    whiteCastle,
    blackCastle,
    en_passant,
  } = boardData

  const [moveMutation] = useMutation(MOVE_PIECE)
  const [captureMutation] = useMutation(CAPTURE_PIECE)

  function getKingPosition(board: SquareToPieceMap) {
    for (const [square, piece] of Object.entries(board)) {
      if (piece === 'wK' && KingInCheck === 'wK') {
        return square
      }
      if (piece === 'bK' && KingInCheck === 'bK') {
        return square
      }
    }
    return null // Return null if no white king is found
  }

  function getRank(square: Square): number {
    return parseInt(square.charAt(1))
  }

  const capturePiece = async (
    from: string,
    to: string,
    piece: string,
    capturedPiece: string
  ) => {
    captureMutation({
      variables: {
        piece,
        from: from,
        to: to,
        endpoint: 'chess',
        capturedPiece: capturedPiece,
      },
      onError: (error) => {
        console.error('Message:', error.message)
        // need to update the board State
        localCapture(to as Square, from as Square, piece as Piece)
      },
    })
  }

  const movePiece = async (from: string, to: string, piece: string) => {
    moveMutation({
      variables: {
        piece: piece,
        from: from,
        to: to,
        endpoint: 'chess',
      },
      onError: (error) => {
        console.error('Message:', error.message)
        // need to update the board State
        localMove(to as Square, from as Square, piece as Piece)
      },
    })
  }

  const handleSquareClick = async (
    to_square: Square,
    piece: Piece,
    capturedPiece: Piece | null
  ) => {
    if (color === 'w' && piece?.charAt(0) === 'b') {
      return
    }
    if (color === 'b' && piece?.charAt(0) === 'w') {
      return
    }

    if (
      (piece && selectedSquare && chessSettings.enableDrag) ||
      (selectedPiece && selectedSquare)
    ) {
      if (possMoves.includes(to_square)) {
        if (piece === 'wP' && getRank(to_square) === 8) {
          // Show pop up of avaiable promotion, if promotionPiece is selected run the mutation
          setPromoteData({
            from: selectedSquare,
            to: to_square,
            piece,
            show: true,
          })
          return
        }

        if (piece === 'bP' && getRank(to_square) === 1) {
          // Show pop up of avaiable promotion, if promotionPiece is selected run the mutation
          setPromoteData({
            from: selectedSquare,
            to: to_square,
            piece,
            show: true,
          })
          return
        }

        if (capturedPiece) {
          // used to make a capture on the local board
          localCapture(selectedSquare, to_square, piece)
          await capturePiece(selectedSquare, to_square, piece, capturedPiece)
        } else {
          // used to make a move on the local board
          localMove(selectedSquare, to_square, piece)
          await movePiece(
            selectedSquare,
            to_square,
            chessSettings.enableDrag ? piece : (selectedPiece as Piece)
          )
        }
        reset()
      } else {
        reset()
      }
    } else if (piece) {
      try {
        console.log('called inside try block')
        const possibleMoves = generate_possible_moves(
          piece,
          to_square,
          board,
          whiteCastle,
          blackCastle,
          en_passant as Square
        )
        console.log('Possible moves:', possibleMoves)
        setPossMoves(possibleMoves as Square[])
      } catch (err) {
        console.error('Error generating possible moves:', err)
      }
      setSelectedPiece(piece)
      setSelectedSquare(to_square)
    } else {
      reset()
    }
  }

  function localCapture(
    selectedSquare: Square,
    to_square: Square,
    piece: Piece
  ) {
    setBoard((prevBoard: BoardType) => {
      const updatedPosition = { ...prevBoard.position }

      // Remove the piece from the original square
      delete updatedPosition[selectedSquare]

      // Remove the piece from the destination square
      delete updatedPosition[to_square]

      // Place the piece in the new square
      updatedPosition[to_square] = piece

      return { ...prevBoard, position: updatedPosition }
    })
  }

  function localMove(selectedSquare: Square, to_square: Square, piece: Piece) {
    console.log('from', selectedSquare, 'to', to_square, 'piece', piece)
    setBoard((prevBoard: BoardType) => {
      const updatedPosition = { ...prevBoard.position }

      // Remove the piece from the original square
      delete updatedPosition[selectedSquare]

      // Place the piece in the new square
      updatedPosition[to_square] = piece

      return { ...prevBoard, position: updatedPosition }
    })
  }

  function reset() {
    setSelectedPiece(null)
    setSelectedSquare(null)
    setPossMoves([])
  }

  const boardRef = React.useRef<HTMLDivElement>(null)

  const themes = {
    classicWood: {
      light: '#d2b48c', // Tan
      dark: '#8b5a2b', // Saddle Brown
    },
    modernMinimalist: {
      light: '#f0f0f0', // Light Gray
      dark: '#4d4d4d', // Charcoal
    },
    forest: {
      light: '#c8e6c9', // Light Green
      dark: '#388e3c', // Forest Green
    },
    oceanBreeze: {
      light: '#b3e5fc', // Light Blue
      dark: '#0277bd', // Deep Blue
    },
    mutedPastel: {
      light: '#e0f7fa', // Pastel Cyan
      dark: '#b39ddb', // Pastel Purple
    },
    nightMode: {
      light: '#8c8c8c', // Soft Gray
      dark: '#333333', // Dark Charcoal
    },
    desertSand: {
      light: '#f7e9d7', // Sandy Beige
      dark: '#bc8f8f', // Rosy Brown
    },
    softViolet: {
      light: '#f3e5f5', // Light Violet
      dark: '#9575cd', // Deep Violet
    },
    default: {
      light: '#ff685324',
      dark: '#ff2a00bf',
    },
  }

  return (
    <div ref={boardRef} className="w-full h-full relative">
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

            const selectedTheme = themes.forest

            const backgroundColor =
              square === KingInCheck
                ? 'purple'
                : selectedSquare === square
                ? 'green'
                : number % 2 === 0
                ? selectedTheme.light
                : selectedTheme.dark

            const bg =
              number % 2 === 0
                ? 'bg-green-200/80'
                : 'bg-lime-400/30 dark:bg-lime-400/30'

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
              setHoverSquare(null)
            }

            const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault()
              setHoverSquare(square as Square)
            }

            const borderRadius = {
              borderTopLeftRadius: square === 'a8' ? '6px' : '0px',
              borderTopRightRadius: square === 'h8' ? '6px' : '0px',
              borderBottomLeftRadius: square === 'a1' ? '6px' : '0px',
              borderBottomRightRadius: square === 'h1' ? '6px' : '0px',
            }

            const highlight = {
              border: hoveredSquare === square ? '3px solid #fafafa' : 'none',
            }

            return (
              <div
                key={file}
                id={square}
                style={{
                  // backgroundColor,
                  ...borderRadius,
                  ...highlight,
                }}
                className={`${bg} md:h-[90px] w-[12vw] aspect-square md:w-[90px] flex justify-center items-center relative pieces`}
                onClick={(e) => {
                  e.preventDefault()
                  // if (color === player && !chessSettings.dragNdrop) {
                  //   if (selectedPiece) {
                  //     handleSquareClick(
                  //       square as Square,
                  //       selectedPiece,
                  //       piece as Piece
                  //     )
                  //   } else {
                  //     handleSquareClick(square as Square, piece as Piece, null)
                  //   }
                  // }
                }}
              >
                {
                  <Tile
                    localMove={localMove}
                    isBlack={isBlack}
                    boardRef={boardRef}
                    image={pieceImages[piece as Piece]}
                    piece={piece as Piece}
                    square={square as Square}
                    setSelectedSquare={setSelectedSquare}
                    board={board}
                    whiteCastle={whiteCastle}
                    blackCastle={blackCastle}
                    en_passant={en_passant}
                    setPossMoves={setPossMoves}
                  />
                }

                {possMoves.includes(square as Square) && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '30px',
                      height: '30px',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)', // Background with 50% opacity
                      border: '1px solid white', // Fully opaque white border
                      borderRadius: '50%', // This makes it a circle
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
