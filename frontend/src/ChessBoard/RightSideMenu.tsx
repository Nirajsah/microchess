import { Color, PieceColor } from '../components/ChessBoard/types'
import React from 'react'
import { isGameChain } from '@/api'
import MatchSelect from './MatchSelect'
import MatchDataUI from './MatchData'
import { PieceRow } from './CapturedPieces'
import { GameControls } from './GameControls'
import { useWalletStore } from '@/store/wallet'
import { useBoard } from '@/store/board'

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
  player: PieceColor | '-'
  color?: Color
  checkStatus: string
  opponentId: string | null
  game_state: string
  timer: {
    white: number
    black: number
  }
  setIsGameChain?: (value: boolean | null) => void
  capturedPieces: string[] | null
}

export const RightSideMenu: React.FC<MatchData> = (matchData: MatchData) => {
  const { setIsGameChain, capturedPieces } = matchData

  const [playMatch, setPlayMatch] = React.useState(true)
  const ready = useWalletStore((s) => s.ready)

  React.useEffect(() => {
    const checkGameChain = async () => {
      try {
        const res = await isGameChain()
        const check = JSON.parse(res.result).data.isGameChain

        console.log('is gamechain', check)

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
  const localMakeMove = useBoard((s) => s.localMakeMove)

  return (
    <div className="w-full h-[400px] flex justify-center items-center">
      {matchData.game_state !== 'Resign' &&
      (matchData.color === 'White' || matchData.color === 'Black') ? (
        <div className="w-full h-full flex flex-col">
          {capturedPieces && <PieceRow pieces={blackPieces} />}

          {playMatch && (
            <GameControls
              onStart={() => console.log('Start')}
              onBack={() => console.log('Back')}
              onPlay={() => {
                console.log('Play')
              }}
              onNext={() => console.log('Next')}
              onEnd={() => console.log('End')}
              onStop={() => console.log('Stop')}
            />
          )}

          <div className="w-full flex-1 overflow-hidden">
            <MatchDataUI {...matchData} />
          </div>

          {capturedPieces && <PieceRow pieces={whitePieces} />}
        </div>
      ) : (
        <div className="">
          <MatchSelect />
        </div>
      )}
    </div>
  )
}
