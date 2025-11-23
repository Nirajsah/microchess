import React from 'react'
import Ranks from '../components/ChessBoard/Ranks'
import Files from '../components/ChessBoard/Files'
import {
  Color,
  Piece,
  PromoteData,
  Square,
} from '../components/ChessBoard/types'
import { RightSideMenu } from './RightSideMenu'
import { useBoard } from '@/store/board'
import Board from './Board'
import { capturedPiece, makeMove } from '@/api'
import { PlayerInfo } from './PlayerInfo'
import { GameControls } from './GameControls'

import { useWalletStore } from '@/store/wallet'
import Navbar from '@/components/ChessBoard/Navbar'
import LeftMenu from '@/components/LeftSideMenu'

const ChessBoard = () => {
  const { state: board, initDefaultAsync, localMakeMove } = useBoard((s) => s)

  const initAsync = useWalletStore((s) => s.initAsync)
  const notification = useWalletStore((s) => s.notification)

  React.useEffect(() => {
    initAsync()
  }, [])

  React.useEffect(() => {
    console.log('notification', notification)
  }, [notification])

  const [isGameChain, setIsGameChain] = React.useState<boolean | null>(null)
  const [capturedPieces, setCapturedPieces] = React.useState<string[]>([])

  React.useEffect(() => {
    initDefaultAsync()
  }, [])

  React.useEffect(() => {
    const getCapturedPieces = async () => {
      try {
        const data = await capturedPiece()
        const res = JSON.parse(data.result).data.capturedPieces
        setCapturedPieces(res || [])
      } catch (e) {
        console.error('failed', e)
      }
    }
    getCapturedPieces()
  }, [notification, board.lastMove])

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
    const audio = new Audio('/move-sound.mp3')
    audio.play().catch((e) => console.log('Audio play failed', e))

    // updates the local board
    localMakeMove(selectedSquare, to_square, piece)
    makeMove(selectedSquare, to_square, piece)
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

  const renderSquare = () => {
    return (
      <div className="w-full chess-board">
        <div className="h-[12.5%] z-50 absolute text-black">
          <Ranks color={board.color as Color} />
        </div>
        <Board boardData={board} makeMove={localMove} />
        <div className="flex text-black">
          <Files color={board.color as Color} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full w-full bg-[#161616]">
      <LeftMenu />
      <Navbar />
      <div className="flex justify-center items-center gap-4">
        <div className="w-full max-w-[720px] bg-[#262626] p-2.5 rounded-[18px]">
          {board.color && board.timer && (
            <div className="w-full flex justify-between">
              <div className="w-full pt-0 pb-2.5">
                <PlayerInfo
                  isOpponent
                  id={board.opponent}
                  timer={
                    board.color === 'White'
                      ? board.timer.black
                      : board.timer.white
                  }
                  isActive={
                    board.color === 'White'
                      ? board.player_turn === 'b'
                      : board.player_turn === 'w'
                  }
                />
              </div>
            </div>
          )}
          <div className="w-full relative max-w-[720px] rounded-md">
            {renderSquare()}
          </div>
          {board.color && board.timer && (
            <div className="w-full flex justify-between">
              <div className="w-full pb-0 pt-2.5">
                <PlayerInfo
                  id={board.color}
                  timer={
                    board.color === 'White'
                      ? board.timer.white
                      : board.timer.black
                  }
                  isActive={
                    board.color === 'White'
                      ? board.player_turn === 'w'
                      : board.player_turn === 'b'
                  }
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col h-full justify-center w-full max-w-[400px]">
          <div className="w-full h-full flex-1 rounded-[18px]">
            <RightSideMenu
              player={board.player_turn || '-'}
              color={board.color}
              checkStatus={board.KingInCheck}
              opponentId={board.opponent}
              game_state={board.game_state}
              timer={board.timer}
              setIsGameChain={setIsGameChain}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChessBoard
