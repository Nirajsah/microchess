import React, { useState } from 'react'
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
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client'
import {
  CAPTURE_PIECE,
  GET_BOARD,
  GET_PLAYER,
  MOVE_PIECE,
  NOTIFICATIONS,
} from '../GraphQL/queries'
import Ranks from './ChessBoard/Ranks'
import Files from './ChessBoard/Files'
import { logMissingFieldErrors } from '@apollo/client/core/ObservableQuery'

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

const initialBoard = {
  wP: 0x000000000000ff00n,
  wR: 0x0000000000000081n,
  wN: 0x0000000000000042n,
  wB: 0x0000000000000024n,
  wQ: 0x0000000000000008n,
  wK: 0x0000000000000010n,
  bP: 0x00ff000000000000n,
  bR: 0x8100000000000000n,
  bN: 0x4200000000000000n,
  bB: 0x2400000000000000n,
  bQ: 0x0800000000000000n,
  bK: 0x1000000000000000n,
}

type Bitboard = number | bigint
type BoardArray = Array<Array<string | null>>

const bitboardToArray = (bitboards: Record<string, Bitboard>): BoardArray => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null))

  for (let [pieceType, bitboard] of Object.entries(bitboards)) {
    // Skip the __typename field
    if (pieceType === '__typename') continue

    // Convert number to BigInt if necessary
    if (typeof bitboard === 'number') {
      bitboard = BigInt(bitboard)
    }

    for (let i = 0; i < 64; i++) {
      if ((bitboard & (BigInt(1) << BigInt(i))) !== BigInt(0)) {
        const row = 7 - Math.floor(i / 8)
        const col = i % 8
        board[row][col] = pieceType
      }
    }
  }

  return board
}

const CzBoard = () => {
  const chainId = window.sessionStorage.getItem('chainId') ?? ''
  const owner = window.sessionStorage.getItem('owner') ?? ''
  const [boardState, setBoardState] = useState({})
  const [selectedPiece, setSelectedPiece] = React.useState<string | null>(null)
  const [color, setColor] = React.useState('black')

  const [moveMutation] = useMutation(MOVE_PIECE)
  const [captureMutation] = useMutation(CAPTURE_PIECE)

  const [boardQuery, { called }] = useLazyQuery(GET_BOARD, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      console.log(data)

      setBoardState(data.board)
    },
    fetchPolicy: 'network-only',
  })

  const [playerColorQuery] = useLazyQuery(GET_PLAYER, {
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

  useSubscription(NOTIFICATIONS, {
    variables: {
      chainId: chainId,
    },
    onData: () => boardQuery(),
  })

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)

  const handleSquareClick = (square: string, piece: string | null) => {
    // console.log('square', square, 'piece', piece)
    // console.log(
    //   'selectedSquare',
    //   selectedSquare,
    //   'selectedPiece',
    //   selectedPiece
    // )

    if (selectedPiece && selectedSquare) {
      console.log('move piece', selectedSquare, square, selectedPiece, piece)
    }

    if (selectedPiece && selectedSquare) {
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

  const movePiece = async (from: string, to: string, piece: string) => {
    await moveMutation({
      variables: {
        piece,
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
    void boardQuery()
    void playerColorQuery()
  }

  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  const renderSquare = (pieceType: string | null, row: number, col: number) => {
    const isWhiteSquare = (row + col) % 2 === 0
    const backgroundColor = isWhiteSquare ? '#ff685321' : '#ff2a00bf'

    return (
      <>
        <div
          className="cursor-pointer"
          onClick={() => {
            handleSquareClick(`${files[col]}${ranks[row]}`, pieceType)
          }}
          key={`${row}-${col}`}
          style={{
            width: '100px',
            height: '100px',
            backgroundColor,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid black',
          }}
        >
          {pieceType && (
            <img
              src={pieceImages[pieceType]}
              alt={pieceType}
              style={{ width: '100px', height: '100px' }}
            />
          )}
        </div>
      </>
    )
  }

  const boardArray = bitboardToArray(boardState)

  const renderBoard = () => {
    console.log('boardArray', boardArray)

    return boardArray.map((row, rowIndex) => (
      <div
        className="border border-black flex"
        style={{ display: 'flex' }}
        key={rowIndex}
      >
        {row.map((pieceType, colIndex) =>
          renderSquare(pieceType, rowIndex, colIndex)
        )}
      </div>
    ))
  }

  return (
    <div className="flex">
      <div className="flex flex-col">
        {color.toLowerCase() === 'black' ? (
          <Ranks ranks={ranks.reverse()} />
        ) : (
          <Ranks ranks={ranks} />
        )}
      </div>
      <div className="border border-black flex flex-col">
        <div>{renderBoard()}</div>
        <div className="flex">
          {color.toLowerCase() === 'black' ? (
            <Files files={files.reverse()} />
          ) : (
            <Files files={files} />
          )}
        </div>
      </div>
    </div>
  )
}

export default CzBoard
