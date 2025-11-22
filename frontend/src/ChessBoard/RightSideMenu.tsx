import { Color, PieceColor } from '../components/ChessBoard/types'
import React from 'react'
import { isGameChain } from '@/api'
import MatchSelect from './MatchSelect'
import MatchDataUI from './MatchData'
import { PieceRow } from './CapturedPieces'
import { GameControls } from './GameControls'

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
}

export const RightSideMenu: React.FC<MatchData> = (matchData: MatchData) => {
  const { setIsGameChain } = matchData
  const [capturedPieces, setCapturedPieces] = React.useState<string[] | null>(
    null
  )
  const [playMatch, setPlayMatch] = React.useState(false)

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
    checkGameChain()
  }, [])

  const blackPieces = capturedPieces?.filter((p) => p.startsWith('b')) || []
  const whitePieces = capturedPieces?.filter((p) => p.startsWith('w')) || []

  return (
    <div className="h-full w-full">
      {(matchData.game_state !== 'Resign' && matchData.color === 'White') ||
      (matchData.game_state !== 'Resign' && matchData.color === 'Black') ? (
        <div className="w-full h-full">
          {capturedPieces && <PieceRow pieces={blackPieces} />}
          {playMatch && (
            <GameControls
              onStart={() => console.log('Start')}
              onBack={() => console.log('Back')}
              onPlay={() => console.log('Play')}
              onNext={() => console.log('Next')}
              onEnd={() => console.log('End')}
              onStop={() => console.log('Stop')}
            />
          )}
          <MatchDataUI {...matchData} />
          {capturedPieces && <PieceRow pieces={whitePieces} />}
        </div>
      ) : (
        <MatchSelect />
      )}
      {/* Captured White Pieces (Captured by Black) */}
    </div>
  )
}
