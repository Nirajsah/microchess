import React from 'react'
import Ranks from './Ranks'
import Files from './Files'
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client'
import {
  GET_BOARD,
  GET_CAPTURED_PIECES,
  GET_MOVES,
  GET_PLAYER,
  GET_PLAYER_TURN,
  NEW_GAME,
  NOTIFICATIONS,
  OPPONENT,
} from '../../GraphQL/queries'
import Board from './Board'
import CapturedPieces from './CapturedPieces'
import { Link } from 'react-router-dom'
import Timer from './Timer'

const COLUMNS = 'abcdefgh'.split('')
type Fen = string
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
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function fenToPieceCode(piece: any) {
  // black piece
  if (piece.toLowerCase() === piece) {
    return 'b' + piece.toUpperCase()
  }

  // white piece
  return 'w' + piece.toUpperCase()
}

function getCheckStatusFromFEN(fen: string): string | null {
  // Split the FEN string based on the semicolon delimiter
  const parts = fen.split(';')

  // The last part contains the check status
  if (parts.length > 1) {
    const statusPart = parts[1].trim()
    return statusPart // 'bk_inCheck' or any other status
  }

  return null // No check status found
}

function fenToObj(fen: string): {
  position: SquareToPieceMap
  KingInCheck: string
} {
  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '')
  const rows = fen.split('/')
  const position: any = {}

  let currentRow = 8
  for (let i = 0; i < 8; i++) {
    const row = rows[i].split('')
    let colIdx = 0

    // loop through each character in the FEN section
    for (let j = 0; j < row.length; j++) {
      // number / empty squares
      if (row[j].search(/[1-8]/) !== -1) {
        const numEmptySquares = parseInt(row[j], 10)
        colIdx = colIdx + numEmptySquares
      } else {
        // piece
        const square = COLUMNS[colIdx] + currentRow
        position[square] = fenToPieceCode(row[j])
        colIdx = colIdx + 1
      }
    }

    currentRow = currentRow - 1
  }

  return position
}

const CBoard = () => {
  const chainId = window.sessionStorage.getItem('chainId') ?? ''
  const owner = window.sessionStorage.getItem('owner') ?? ''
  const [player, setPlayer] = React.useState('')
  const [boardState, setBoardState] = React.useState<Fen>(fen)
  const [color, setColor] = React.useState('')
  const [capturedPieces, setCapturedPieces] = React.useState<string[]>([])
  const [opponentId, setOpponentId] = React.useState<string | null>(null)
  const [play] = useMutation(NEW_GAME)
  const [capturedPiecesQuery] = useLazyQuery(GET_CAPTURED_PIECES, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      console.log('captured pieces', data)
      setCapturedPieces(data.capturedPieces)
    },
    fetchPolicy: 'network-only',
  })
  const [opponentIdQuery] = useLazyQuery(OPPONENT, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
      player: owner,
    },
    onCompleted: (data) => {
      setOpponentId(data.getOpponent)
    },
    fetchPolicy: 'network-only',
  })

  const [boardQuery] = useLazyQuery(GET_BOARD, {
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

  const [playerTurn, { called }] = useLazyQuery(GET_PLAYER_TURN, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      console.log(data)
      setPlayer(data.playerTurn)
    },
    fetchPolicy: 'network-only',
  })
  const [moveQuery] = useLazyQuery(GET_MOVES, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      setMoves(data.getMoves)
    },
    fetchPolicy: 'network-only',
  })

  useSubscription(NOTIFICATIONS, {
    variables: {
      chainId: chainId,
    },
    onData: () => {
      console.log('Notification received')
      playerTurn()
      boardQuery()
      moveQuery()
      capturedPiecesQuery()
    },
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

  if (!called) {
    playerTurn()
    boardQuery()
    playerColorQuery()
    capturedPiecesQuery()
    opponentIdQuery()
  }

  async function startGame() {
    await play({
      variables: {
        player: owner,
        endpoint: 'chess',
        chainId: chainId,
      },
    })
  }

  if (!called) {
    void playerColorQuery()
    moveQuery()
  }

  const board: any = React.useMemo(() => fenToObj(boardState), [boardState])
  const checkStatus = getCheckStatusFromFEN(boardState)
  const [moves, setMoves] = React.useState<
    Array<{ white: string; black: string }>
  >([])

  const renderSquare = () => {
    const isBlack = color.toLowerCase() === 'black'

    return (
      <Board
        board={board}
        isBlack={isBlack}
        color={color}
        player={player}
        isKingInCheck={checkStatus}
      />
    )
  }

  return (
    <div className="flex">
      <div className="min-w-[250px] p-6">
        <Link to="/" className="text-2xl tracking-wide font-semibold">
          Stella
        </Link>
      </div>
      <div className="flex flex-col p-1 relative">
        <div className="flex flex-col">
          <Ranks color={color} />
        </div>
        <div className="mb-2 text-sm font-semibold font-sans">
          Opponent {opponentId}
        </div>

        <div className="w-full max-w-[720px]">{renderSquare()}</div>
        <div className="flex">
          <Files color={color} />
        </div>

        <div className="mt-4 text-sm font-semibold font-sans">
          Player {owner}
        </div>
        {player &&
          (player === color ? <Timer start={true} /> : <Timer start={false} />)}
      </div>

      {/* Right Side Menu */}
      <div className="w-full font-sans my-3 rounded-lg mx-5 p-2 flex flex-col bg-[#cdc6c654]">
        <div className="p-5 drop-shadow-2xl bg-[#cdc6c6ab] rounded w-full max-w-[300px]">
          {player} Plays
        </div>

        <div className="bg-[#cdc6c6ab] mt-5 w-full rounded">
          <div className="w-full">
            <table className="w-full">
              <thead className="">
                <tr>
                  <th className="w-[33.3%] text-left p-2">Move</th>
                  <th className="w-[33.3%] text-center p-2">White</th>
                  <th className="w-[33.3%] text-right p-2">Black</th>
                </tr>
              </thead>
            </table>
            <div className="h-[250px] overflow-y-scroll scrollbar-hide flex flex-col-reverse">
              <table className="w-full">
                <tbody>
                  {moves.map((move, index) => (
                    <tr
                      className={`flex px-2 w-full ${
                        index % 2 === 0 ? 'bg-[#d6d1c7]' : 'bg-white'
                      }`}
                      key={index}
                    >
                      <td className="w-[33.3%]">{index + 1}</td>
                      <td className="w-[33.3%] text-center">
                        {move.white || ''}
                      </td>
                      <td className="w-[33.3%] text-end">{move.black || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {!opponentId && (
          <button
            onClick={(event) => {
              event.preventDefault()
              startGame()
            }}
            className="px-5 py-2 mt-10 drop-shadow-2xl hover:scale-105 transition-all bg-[#cdc6c6ab] rounded max-w-[100px]"
          >
            Play
          </button>
        )}
        {checkStatus !== null && checkStatus === 'wK' && (
          <div>White King In Check</div>
        )}
        {checkStatus !== null && checkStatus === 'bK' && (
          <div>Black King In Check</div>
        )}
        <CapturedPieces pieces={capturedPieces} />
      </div>
    </div>
  )
}

export default CBoard
