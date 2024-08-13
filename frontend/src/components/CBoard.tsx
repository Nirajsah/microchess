import Tile from './Tile'
import whitePawn from '../assets/wp.png'
import whiteRook from '../assets/wr.png'
import whiteKnight from '../assets/wn.png'
import whiteBishop from '../assets/wb.png'
import whiteQueen from '../assets/wq.png'
import whiteKing from '../assets/wk.png'
import blackPawn from '../assets/bp.png'
import blackRook from '../assets/br.png'
import blackKnight from '../assets/bn.png'
import blackBishop from '../assets/bb.png'
import blackQueen from '../assets/bq.png'
import blackKing from '../assets/bk.png'
import React from 'react'
import Ranks from './Ranks'
import Files from './Files'
import { useLazyQuery, useMutation } from '@apollo/client'
import { CAPTURE_PIECE, GET_PLAYER, MOVE_PIECE } from '../GraphQL/queries'

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
const CBoard = ({ boardState, active }: any) => {
  const chainId = window.sessionStorage.getItem('chainId') ?? ''
  const owner = window.sessionStorage.getItem('owner') ?? ''
  const [selectedPiece, setSelectedPiece] = React.useState<any>(null)
  const [selectedSquare, setSelectedSquare] = React.useState<string | null>(
    null
  )
  const [color, setColor] = React.useState('')

  const [moveMutation] = useMutation(MOVE_PIECE)
  const [captureMutation] = useMutation(CAPTURE_PIECE)
  const [playerColorQuery, { called }] = useLazyQuery(GET_PLAYER, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
      player: owner,
    },
    onCompleted: (data) => {
      console.log('player: ', data)
      setColor(data.player)
    },
    fetchPolicy: 'network-only',
  })

  const handleSquareClick = (square: string, piece: string) => {
    // Convert board coordinates to array indices
    console.log('square after click', square, 'piece', piece)
    console.log(
      'selectedSquare',
      selectedSquare,
      'selectedPiece',
      selectedPiece
    )

    if (selectedPiece && selectedSquare && piece) {
      console.log('move piece', selectedSquare, square, selectedPiece, piece)
      capturePiece(selectedSquare, square, selectedPiece, piece)
    }

    if (selectedPiece && selectedSquare) {
      console.log('move piece', selectedSquare, square, selectedPiece)
      movePiece(selectedSquare, square, selectedPiece)
      setSelectedPiece(null) // Deselect the piece after moving
      setSelectedSquare(null) // Reset the selected square
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
  if (!called) {
    void playerColorQuery()
  }

  type ChessPiece =
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

  const bitboardToArray = (
    bitboards: Record<ChessPiece, number | bigint>
  ): ChessPiece[] => {
    const board: ChessPiece[] = Array(64).fill(null)

    for (let [pieceType, bitboard] of Object.entries(bitboards)) {
      // Skip the __typename field
      if (pieceType === '__typename') continue

      // Convert number to BigInt if necessary
      if (typeof bitboard === 'number') {
        bitboard = BigInt(bitboard)
      }

      let bigIntBitboard = BigInt(bitboard)

      for (let i = 0; i < 64; i++) {
        if ((bigIntBitboard & (BigInt(1) << BigInt(i))) !== BigInt(0)) {
          board[i] = pieceType as ChessPiece
        }
      }
    }

    return board
  }

  // const boardArray = bitboardToArray(boardState)
  const boardArray = React.useMemo(
    () => bitboardToArray(boardState),
    [boardState]
  )

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

  const renderSquare = () => {
    // Determine if the current player is black
    const isBlack = color.toLowerCase() === 'black'

    return (
      <div>
        {ranks.map((rank, rankIndex) => (
          <div key={rank} className="flex">
            {files.map((file, fileIndex) => {
              const index = isBlack
                ? rankIndex * 8 + (7 - fileIndex)
                : fileIndex + (7 - rankIndex) * 8

              const piece = boardArray[index]
              // Calculate the square position
              const square = isBlack
                ? files[7 - fileIndex] + (rankIndex + 1)
                : file + rank
              // Calculate the background color for alternating squares
              const number = fileIndex + rankIndex
              const backgroundColor =
                selectedSquare === square
                  ? '#9ae1dc'
                  : number % 2 === 0
                  ? '#ff685321'
                  : '#ff2a00bf'

              return (
                <div
                  key={file}
                  style={{
                    backgroundColor,
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    if (color === active) {
                      console.log(
                        'square',
                        square,
                        'piece',
                        piece,
                        'index',
                        index
                      )
                      handleSquareClick(square, piece)
                      console.log(
                        'index',
                        rankIndex * 8 + (7 - fileIndex),
                        'square',
                        files[7 - fileIndex] + (rankIndex + 1),
                        'fileIndex',
                        fileIndex
                      )
                    }
                  }}
                  className="w-[100px] h-[100px] flex justify-center items-center"
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

  return (
    <div className="flex">
      <div className="flex flex-col">
        <Ranks color={color} />
      </div>
      <div className="flex flex-col">
        <div className="">{renderSquare()}</div>
        <div className="flex">
          <Files color={color} />
        </div>
      </div>
    </div>
  )
}

export default CBoard
