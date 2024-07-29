import { useState } from 'react'
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
import { useLazyQuery, useSubscription } from '@apollo/client'
import { GET_BOARD, NOTIFICATIONS } from '../GraphQL/queries'

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
  const [boardState, setBoardState] = useState({})
  const [boardQuery, { called }] = useLazyQuery(GET_BOARD, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      setBoardState(data?.board?.entries[0]?.value?.board)
    },
  })
  useSubscription(NOTIFICATIONS, {
    variables: {
      chainId: chainId,
    },
    onData: () => boardQuery(),
  })

  if (!called) {
    void boardQuery()
  }
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const renderSquare = (pieceType: string | null, row: number, col: number) => {
    const isWhiteSquare = (row + col) % 2 === 0
    const backgroundColor = isWhiteSquare ? '#ff685321' : '#ff2a00bf'

    return (
      <>
        <div
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

  const renderBoard = () => {
    const boardArray = bitboardToArray(boardState)

    return boardArray.map((row, rowIndex) => (
      <div style={{ display: 'flex' }} key={rowIndex}>
        {row.map((pieceType, colIndex) =>
          renderSquare(pieceType, rowIndex, colIndex)
        )}
      </div>
    ))
  }

  return (
    <div className="border border-black flex">
      <div className="flex flex-col">
        {ranks.map((rank) => (
          <div
            key={rank}
            className="h-[100px] p-2 flex justify-center items-center"
          >
            {rank}
          </div>
        ))}
      </div>
      <div>
        {renderBoard()}
        <div className="flex">
          {files.map((file) => (
            <div
              key={file}
              className="w-[100px] p-1 flex justify-center items-center"
            >
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CzBoard
