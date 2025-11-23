import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Color } from '../components/ChessBoard/types'
import { capturedPiece, getMvString, opponentProfile } from '@/api'
// import { ResignButton } from './ResignButton'
import { useWalletStore } from '@/store/wallet'

interface MatchData {
  player: string
  color?: Color
  opponentId: string | null
  checkStatus: string
  timer: {
    white: number
    black: number
  }
  game_state: string
}

const MatchDataUI = (data: MatchData) => {
  const { player, color, checkStatus, timer, game_state, opponentId } = data
  const [opponent, setOpponent] = React.useState({
    ath: 0,
    elo: 0,
    matches: 0,
    name: null,
  })
  const [moves, setMoves] = React.useState<string[] | null>(null)
  const [capturedPieces, setCapturedPieces] = React.useState<string[] | null>(
    null
  )

  const notification = useWalletStore((s) => s.notification)

  React.useEffect(() => {
    const getCapturedPieces = async () => {
      try {
        const data = await capturedPiece()
        const res = JSON.parse(data.result).data.capturedPieces
        setCapturedPieces(res)
      } catch (e) {
        console.error('failed', e)
      }
    }
    const getMoves = async () => {
      try {
        const data = await getMvString()
        const res = JSON.parse(data.result).data.mvString
        setMoves(res)
      } catch (e) {
        console.error('failed', e)
      }
    }
    getCapturedPieces()
    getMoves()
  }, [notification])

  const movePairs = React.useMemo(
    () =>
      moves
        ? Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => ({
            white: moves[i * 2] || '',
            black: moves[i * 2 + 1] || '',
          }))
        : [],
    [moves]
  )

  React.useEffect(() => {
    const checkGameChain = async () => {
      try {
        const res = await opponentProfile(opponentId!)
        const check = JSON.parse(res.result).data.opponentProfile
        if (!check) {
          return
        }
        setOpponent(check)
      } catch (err) {
        console.error('Error checking game chain:', err)
      }
    }

    checkGameChain()
  }, [opponentId])

  return (
    <div className="w-full h-full flex flex-col gap-4 bg-[#262626] rounded-xl">
      {/* Move History */}
      <div className="flex-1 rounded-xl border border-zinc-800 overflow-hidden flex flex-col min-h-full">
        <div className="border-b border-zinc-800 backdrop-blur-sm">
          <table className="w-full">
            <thead>
              <tr className="text-zinc-400 text-sm font-medium">
                <th className="w-[20%] text-center px-2 py-2">#</th>
                <th className="w-[40%] text-center px-2 py-2">White</th>
                <th className="w-[40%] text-center px-2 py-2">Black</th>
              </tr>
            </thead>
          </table>
        </div>
        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent flex-1">
          <table className="w-full">
            <tbody>
              {moves && movePairs.length > 0 ? (
                movePairs.map((move: any, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/30 last:border-0"
                  >
                    <td className="w-[20%] px-2 py-1 text-zinc-500 font-medium text-sm text-center bg-zinc-900/20">
                      {index + 1}
                    </td>
                    <td className="w-[40%] px-2 py-1 text-center">
                      <span className="text-zinc-300 font-mono text-sm group-hover:text-white transition-colors">
                        {move.white || '—'}
                      </span>
                    </td>
                    <td className="w-[40%] px-2 py-1 text-center">
                      <span className="text-zinc-300 font-mono text-sm group-hover:text-white transition-colors">
                        {move.black || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-zinc-500">
                    No moves yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check Status Alert */}
      {checkStatus && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-200 text-sm">Check!</p>
              <p className="text-xs text-amber-500/80">
                {checkStatus} is under attack
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Player Info & Resign */}
      {/* <div className="flex gap-2">
        <ResignButton />
      </div> */}
    </div>
  )
}

export default MatchDataUI
