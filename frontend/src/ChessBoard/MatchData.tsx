import React from 'react'
import { AlertCircle } from 'lucide-react'
import { getMvString } from '@/api'
import { useWalletStore } from '@/store/wallet'

interface MatchData {
  checkStatus: string
  moves?: string[] | null
  replay: boolean
  outcome?: string | null
}

const MatchDataUI = (data: MatchData) => {
  const { checkStatus, moves: propMoves, replay, outcome } = data
  const [moves, setMoves] = React.useState<string[] | null>(
    replay ? propMoves || null : null
  )

  const notification = useWalletStore((s) => s.notification)

  // When replay mode: update moves if propMoves changes
  React.useEffect(() => {
    if (replay) {
      setMoves(propMoves || null)
    }
  }, [propMoves, replay])

  // When NOT replay mode: fetch moves
  React.useEffect(() => {
    if (!replay) {
      const getMoves = async () => {
        try {
          const data = await getMvString()
          const res = JSON.parse(data).data.mvString
          setMoves(res)
        } catch (e) {
          console.error('failed', e)
        }
      }
      getMoves()
    }
  }, [notification, replay])

  const movePairs = React.useMemo(() => {
    if (!moves) return []

    // Create a copy of moves to avoid mutating the state directly if we were to (though strings are immutable)
    const displayMoves = [...moves]

    // If there is an outcome, append it as the next "move"
    if (outcome) {
      displayMoves.push(outcome)
    }

    return Array.from({ length: Math.ceil(displayMoves.length / 2) }, (_, i) => ({
      white: displayMoves[i * 2] || '',
      black: displayMoves[i * 2 + 1] || '',
    }))
  }, [moves, propMoves, outcome])

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
        <div
          style={{
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            overscrollBehavior: 'contain',
          }}
          className="overflow-y-auto flex-1 no-scrollbar"
        >
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

      {/* Forfeit Game Status Alert */}
      {checkStatus === 'Forfeit' && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-200 text-sm">Game Ended by Forfeit</p>
              <p className="text-xs text-red-500/80">
                Opponent timed out
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Check Status Alert */}
      {checkStatus && checkStatus !== 'Forfeit' && (
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
    </div>
  )
}

export default MatchDataUI
