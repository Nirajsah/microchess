import { Color } from './types'
import React from 'react'
import { isGameChain } from '@/api'
import MatchSelect from './MatchSelect'
import MatchDataUI from './MatchData'
import { PieceRow } from './CapturedPieces'
import { GameControls } from './GameControls'
import { useWalletStore } from '@/store/wallet'
import { ResignButton } from '@/ChessBoard/ResignButton'

export const PieceMap: any = {
  bP: '♙',
  bN: '♘',
  bB: '♗',
  bR: '♖',
  bQ: '♕',
  bK: '♔',
  wP: '♟',
  wN: '♞',
  wB: '♝',
  wR: '♜',
  wQ: '♛',
  wK: '♚',
}

// Define piece values and order
export const pieceOrder: { [key: string]: number } = {
  Q: 9,
  R: 5,
  B: 3,
  N: 3,
  P: 1,
}

export interface MatchData {
  color?: Color
  checkStatus: string
  game_state?: string
  setIsGameChain?: (value: boolean | null) => void
  capturedPieces?: string[] | null
  replay: boolean
}

export const RightSideMenu: React.FC<MatchData> = (matchData: MatchData) => {
  const { setIsGameChain, capturedPieces } = matchData

  const ready = useWalletStore((s) => s.ready)

  React.useEffect(() => {
    const checkGameChain = async () => {
      try {
        const res = await isGameChain()
        const check = JSON.parse(res.result).data.isGameChain

        if (setIsGameChain) {
          setIsGameChain(check)
        }
      } catch (error) {
        console.error('Failed to check game chain:', error)
        setIsGameChain?.(false)
      }
    }
    if (ready) {
      checkGameChain()
    }
  }, [ready])

  const blackPieces = capturedPieces?.filter((p) => p.startsWith('b')) || []
  const whitePieces = capturedPieces?.filter((p) => p.startsWith('w')) || []

  return (
    <div className="w-full h-[500px] flex justify-center items-center">
      {matchData.game_state !== 'Resign' &&
      (matchData.color === 'White' || matchData.color === 'Black') ? (
        <div className="w-full h-full flex flex-col">
          {capturedPieces && <PieceRow pieces={blackPieces} />}

          {matchData.replay && <GameControls />}

          <div className="w-full flex-1 overflow-hidden">
            <MatchDataUI {...matchData} />
          </div>

          {capturedPieces && <PieceRow pieces={whitePieces} />}

          {!matchData.replay && (
            <div className="max-h-[100px]">
              <ResignButton />
            </div>
          )}
        </div>
      ) : (
        <div className="">
          <MatchSelect />
        </div>
      )}
    </div>
  )
}
