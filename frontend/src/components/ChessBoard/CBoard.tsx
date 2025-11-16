import React from 'react'
import Ranks from './Ranks'
import Files from './Files'
import { PromotionCard } from './PromotionCard'
import {
  BoardType,
  Color,
  Piece,
  PieceColor,
  PromoteData,
  Square,
} from './types'
import { RightSideMenu } from './RightSideMenu'
import ChessBoard from './ChessBoard'
import Navbar from './Navbar'
import { LeftSideMenu } from '../LeftSideMenu'
import { useWalletNotifications } from '@/hooks/useWalletNotification'
import { useChessWasm } from '@/hooks/useWasm'
import { gameData, timer } from '@/api'
import { useMicroChess } from '@/context/MicroChessProvider'
import { makeMove } from '@/api'

const CBoard = () => {
  const [isGameChain, setIsGameChain] = React.useState<boolean | null>(null)
  const { initBoard, isInitialized } = useChessWasm()
  const { userKey } = useMicroChess()
  const notification = useWalletNotifications()
  const [board, setBoard] = React.useState<BoardType>({
    position: {},
    KingInCheck: '',
    en_passant: '',
    player_turn: 'w',
    color: '' as Color,
    game_state: 'NotStarted',
    opponent: '',
    timer: {
      white: 900,
      black: 900,
    },
    winner: null,
    lastMove: {
      from: '',
      to: '',
    },
  })

  const fetchAndUpdateBoard = React.useCallback(async () => {
    if (!isInitialized || isGameChain !== true) return

    try {
      const res = await gameData(userKey)
      console.log(res)
      const playerClock = await timer()
      if (!res?.result || !playerClock?.result) {
        throw new Error('No response from API')
      }

      const data = JSON.parse(res.result).data.gameData
      const { white, black } = JSON.parse(playerClock.result).data.timer
      const boardData = initBoard(data.fen)

      if (boardData) {
        setBoard({
          position: boardData.position,
          KingInCheck: boardData.king_in_check,
          en_passant: boardData.en_passant,
          player_turn: boardData.player_turn as PieceColor,
          color: data.color,
          game_state: data.gameState,
          opponent: data.opponent,
          timer: { white, black },
          winner: data.winner,
          lastMove: data.lastMove,
        })
      }
    } catch (error) {
      console.error('Error fetching game', error)
    }
  }, [isInitialized, isGameChain, initBoard, userKey])

  React.useEffect(() => {
    const defaultFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const defaultBoardData = initBoard(defaultFen)

    if (defaultBoardData) {
      setBoard({
        position: defaultBoardData.position,
        KingInCheck: defaultBoardData.king_in_check,
        en_passant: defaultBoardData.en_passant,
        player_turn: defaultBoardData.player_turn as PieceColor,
        color: '' as Color,
        game_state: 'NotStarted',
        opponent: '',
        timer: { white: 900, black: 900 },
        winner: null,
        lastMove: {
          from: '',
          to: '',
        },
      })
    }

    if (isInitialized && isGameChain === true) {
      fetchAndUpdateBoard()
    }
  }, [isInitialized, isGameChain])

  React.useEffect(() => {
    if (notification && isGameChain === true) {
      fetchAndUpdateBoard()
    }
  }, [notification, isGameChain])

  const renderSquare = () => {
    return (
      <div className="w-full chess-board">
        <div className="h-[12.5%] z-50 absolute text-black">
          <Ranks color={board.color as Color} />
        </div>
        <ChessBoard boardData={board} makeMove={localMove} />
        <div className="flex text-black">
          <Files color={board.color as Color} />
        </div>
      </div>
    )
  }

  function localMove(selectedSquare: Square, to_square: Square, piece: Piece) {
    if (board.color === 'White' && piece.charAt(0) === 'b') return
    if (board.color === 'Black' && piece.charAt(0) === 'w') return
    if (board.player_turn !== piece.charAt(0)) return
    if (piece.charAt(0) === board.color) return

    if (
      (piece === 'bP' && getRank(to_square) === 1) ||
      (piece === 'wP' && getRank(to_square) === 8)
    ) {
      setPromoteData({
        from: selectedSquare,
        to: to_square,
        piece,
        show: true,
      })
      return
    }

    makeMove(selectedSquare, to_square, piece)

    setBoard((prevBoard: BoardType) => {
      const updatedPosition = { ...prevBoard.position }
      if (updatedPosition[to_square]) {
        delete updatedPosition[to_square]
      }
      delete updatedPosition[selectedSquare]
      updatedPosition[to_square] = piece

      return { ...prevBoard, position: updatedPosition }
    })
  }

  function getRank(square: Square): number {
    return parseInt(square.charAt(1))
  }

  const [promoteData, setPromoteData] = React.useState<PromoteData>({
    from: '' as Square,
    to: '' as Square,
    piece: '' as Piece,
    show: false,
  })

  return (
    <div className="w-full min-h-full relative bg-[#0a0a0a]">
      <LeftSideMenu />
      <Navbar />
      <div className="flex flex-col items-center p-3">
        <div className="flex flex-col lg:flex-row gap-4 w-full justify-center items-center">
          <div className="flex flex-col w-full max-w-[720px] relative">
            <div className="w-full relative max-w-[720px] rounded-md">
              {renderSquare()}
            </div>
            {promoteData.show && (
              <div className="absolute w-full h-full flex justify-center items-center drop-shadow-2xl z-50 rounded-md">
                <PromotionCard
                  color={board.color as Color}
                  promoteData={promoteData}
                  setPromoteData={setPromoteData}
                />
              </div>
            )}
          </div>

          <div className="w-full max-w-[400px]">
            <RightSideMenu
              checkStatus={board.KingInCheck}
              player={board.player_turn || '-'} // Pass player info
              color={board.color as Color}
              game_state={board.game_state}
              opponentId={board.opponent}
              timer={board.timer}
              setIsGameChain={setIsGameChain}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CBoard
