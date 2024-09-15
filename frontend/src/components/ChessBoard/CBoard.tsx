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
  TIME_LEFT,
} from '../../GraphQL/queries'
import Board from './Board'
import { Link } from 'react-router-dom'
import Timer from './Timer'
import { RightSideMenu } from './RightSideMenu'
import Modal from '../Modal'
import { Welcome } from '../popup/Welcome'
import { LeftSideMenu } from './LeftSideMenu'

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
    return statusPart // 'bK' or any other status
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
  const [whiteTime, setWhiteTime] = React.useState(0) // 10 minutes
  const [blackTime, setBlackTime] = React.useState(0)

  const [timeQuery] = useLazyQuery(TIME_LEFT, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      console.log('time left', data.timeLeft)
      setWhiteTime(data.timeLeft.white)
      setBlackTime(data.timeLeft.black)
    },
    fetchPolicy: 'network-only',
  })

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
      timeQuery()
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
    timeQuery()
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
      <div className="w-full h-full">
        <div className="flex flex-col z-50 absolute">
          <Ranks color={color} />
        </div>
        <Board
          board={board}
          isBlack={isBlack}
          color={color}
          player={player}
          isKingInCheck={checkStatus}
        />
        <div className="flex">
          <Files color={color} />
        </div>
      </div>
    )
  }
  const [open, setOpen] = React.useState(true)
  const unselect = () => {
    setOpen(!open)
  }

  return (
    <div>
      <div className="flex justify-center z-[100px]">
        <Modal select={open} unselect={unselect}>
          <Welcome />
        </Modal>
        <div className="min-w-[250px] p-6">
          <Link to="/" className="text-2xl tracking-wide font-semibold">
            Stella
          </Link>

          <LeftSideMenu />
        </div>

        <div className="flex flex-col p-1 relative">
          <div className="flex w-full justify-between my-2 text-sm font-semibold font-sans">
            Opponent {opponentId}
            <Timer
              initialTimeMs={color === 'BLACK' ? blackTime : whiteTime}
              start
            />
          </div>

          <div className="w-full relative max-w-[720px] -z-10">
            {renderSquare()}
          </div>

          <div className="flex w-full justify-between my-2 text-sm font-semibold font-sans">
            Player {owner}
            <Timer
              initialTimeMs={color === 'WHITE' ? whiteTime : blackTime}
              start
            />
          </div>
        </div>

        {/* Right Side Menu */}
        <RightSideMenu
          checkStatus={checkStatus}
          player={player}
          opponentId={opponentId}
          capturedPieces={capturedPieces}
          moves={moves}
          startGame={startGame}
          key={chainId}
        />
      </div>
    </div>
  )
}

export default CBoard
