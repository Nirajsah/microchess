import { Color, PieceColor } from './types'
import React from 'react'
import { isGameChain } from '@/api'
import MatchSelect from './MatchSelect'
import MatchDataUI from './MatchData'

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

  return (
    <div className="h-full w-full">
      {matchData.color === 'White' || matchData.color === 'Black' ? (
        <MatchDataUI {...matchData} />
      ) : (
        <MatchSelect />
      )}
    </div>
  )
}
