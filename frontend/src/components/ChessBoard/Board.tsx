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
  // const chainId = window.sessionStorage.getItem('chainId') ?? ''
  // const owner = window.sessionStorage.getItem('owner') ?? ''
  const [selectedPiece, setSelectedPiece] = React.useState<any>(null)
  const [selectedSquare, setSelectedSquare] = React.useState<string | null>(
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

  const handleSquareClick = (square: string, piece: string | undefined) => {
    console.log('square after click', square, 'piece', piece)
    console.log(
      'selectedSquare',
      selectedSquare,
      'selectedPiece',
      selectedPiece
    )

    if (selectedPiece && selectedSquare) {
      if (piece) {
        // A piece is on the destination square, so capture it
        console.log(
          'capture piece',
          selectedSquare,
          square,
          selectedPiece,
          piece
        )
        capturePiece(selectedSquare, square, selectedPiece, piece)
      } else {
        // No piece on the destination square, so just move the piece
        console.log('move piece', selectedSquare, square, selectedPiece)
        movePiece(selectedSquare, square, selectedPiece)
      }

      // Deselect the piece and reset the selected square after moving/capturing
      setSelectedPiece(null)
      setSelectedSquare(null)
    } else if (piece) {
      // Select the piece and square if nothing is currently selected
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
    console.log('captured called')
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

  const movePiece = async (from: string, to: string, selectedPiece: string) => {
    await moveMutation({
      variables: {
        piece: selectedPiece,
        from: from,
        to: to,
        endpoint: 'chess',
      },
      onError: (error) => {
        console.error('Message:', error.message)
      },
    })
  }
  return (
    <div className="">
      {ranks.map((rank, rankIndex) => (
        <div key={rank} className="flex">
          {files.map((file, fileIndex) => {
            // Calculate the square position
            const square = isBlack
              ? files[7 - fileIndex] + (rankIndex + 1) // Adjust rank for black perspective
              : file + rank

            // Get the piece from the map using the square notation
            const piece = board[square as Square]

            // Calculate the background color for alternating squares
            const number = fileIndex + rankIndex

            const KingInCheck = getKingPosition(board)

            const backgroundColor =
              square === KingInCheck
                ? '#af26bf'
                : selectedSquare === square || square === piece
                  ? '#91bf26'
                  : number % 2 === 0
                    ? '#ff685321'
                    : '#ff2a00bf'
            return (
              <div
                key={file}
                style={{
                  backgroundColor,
                  width: '90px',
                  height: '90px',
                }}
                onClick={(e) => {
                  e.preventDefault()
                  if (color === player) {
                    handleSquareClick(square, piece)
                  }

                  console.log(
                    'index',
                    (7 - rankIndex) * 8 + (7 - fileIndex),
                    'square',
                    square
                  )
                }}
                className="flex w-full justify-center items-center"
              >
                {piece && <Tile image={pieceImages[piece]} />}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
