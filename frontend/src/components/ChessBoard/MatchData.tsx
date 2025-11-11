import React from 'react'
import { AlertCircle, Clock, Flag, Crown } from 'lucide-react'
import Timer from './Timer'
import CapturedPieces from './CapturedPieces'
import { Color } from './types'
import { opponentProfile } from '@/api'

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

  const getStatusColor = () => {
    switch (game_state) {
      case 'OnGoing':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30'
      case 'Checkmate':
        return 'from-red-500/20 to-rose-500/20 border-red-500/30'
      case 'Draw':
        return 'from-zinc-500/20 to-gray-500/20 border-zinc-500/30'
      default:
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
    }
  }

  const getStatusIcon = () => {
    switch (game_state) {
      case 'OnGoing':
        return <Clock className="w-6 h-6 text-green-400" />
      case 'Checkmate':
        return <Crown className="w-6 h-6 text-red-400" />
      case 'Draw':
        return <Flag className="w-6 h-6 text-zinc-400" />
      default:
        return <Clock className="w-6 h-6 text-blue-400" />
    }
  }

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
    <div className="w-full flex flex-col gap-4 h-[720px]">
      {/* Game Status Header */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getStatusColor()} backdrop-blur-sm px-3 py-2 transition-all duration-300`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              {getStatusIcon()}
            </div>
            <div>
              <p className="text-sm text-zinc-400 font-medium">Game Status</p>
              <p className="text-2xl font-bold text-white">{game_state}</p>
            </div>
          </div>
          {game_state === 'OnGoing' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-green-400 font-medium">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Timers and Moves Container */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Opponent Timer */}
        <div className="relative group">
          <div
            className={`rounded-xl border transition-all duration-300 ${
              color === 'White'
                ? player === 'b'
                  ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900/50 border-zinc-800'
                : player === 'w'
                ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/50 border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl">
                  {color === 'White' ? '♚' : '♔'}
                </div>
                <div>
                  <p className="text-md font-medium truncate max-w-[200px]">
                    {opponent.name ? opponent.name : opponentId}
                  </p>
                  <p className="text-xs text-zinc-400">Opponent</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-white">
                  <Timer
                    initialTime={color === 'White' ? timer.black : timer.white}
                    isActive={
                      color === 'White' ? player === 'b' : player === 'w'
                    }
                    isStarted={game_state === 'OnGoing'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Move History */}
        <div className="flex-1 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/50 to-zinc-950/50 overflow-hidden">
          <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <table className="w-full">
              <thead>
                <tr className="text-zinc-400 text-sm font-medium">
                  <th className="w-[25%] text-left px-4 py-3">#</th>
                  <th className="w-[37.5%] text-left px-4 py-3">White</th>
                  <th className="w-[37.5%] text-left px-4 py-3">Black</th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <table className="w-full">
              <tbody>
                {moves && movePairs.length > 0 ? (
                  movePairs.map((move: any, index) => (
                    <tr
                      key={index}
                      className="group hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/30 last:border-0"
                    >
                      <td className="w-[25%] px-4 py-0.5 text-zinc-500 font-medium text-sm">
                        {index + 1}
                      </td>
                      <td className="w-[37.5%] px-4 py-0.5">
                        <span className="text-white font-mono text-sm group-hover:text-blue-400 transition-colors">
                          {move.white || '—'}
                        </span>
                      </td>
                      <td className="w-[37.5%] px-4 py-0.5">
                        <span className="text-white font-mono text-sm group-hover:text-blue-400 transition-colors">
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

        {/* Player Timer */}
        <div className="relative group">
          <div
            className={`rounded-xl border transition-all duration-300 ${
              color === 'White'
                ? player === 'w'
                  ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900/50 border-zinc-800'
                : player === 'b'
                ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/50 border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl">
                  {color === 'White' ? '♔' : '♚'}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">{color}</p>
                  <p className="text-sm text-zinc-400">You</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-white">
                  <Timer
                    initialTime={color === 'White' ? timer.white : timer.black}
                    isActive={
                      color === 'White' ? player === 'w' : player === 'b'
                    }
                    isStarted={game_state === 'OnGoing'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Check Status Alert */}
      {checkStatus && (
        <div className="rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-amber-200">King in Check!</p>
              <p className="text-sm text-amber-300/80">
                {player === 'w' ? 'White' : 'Black'} king is under attack
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Captured Pieces */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="text-sm font-semibold text-zinc-300">
            Captured Pieces
          </h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2 min-h-[60px] items-center justify-center">
            {capturedPieces && Object.keys(capturedPieces).length > 0 ? (
              <CapturedPieces pieces={capturedPieces} />
            ) : (
              <p className="text-zinc-600 text-sm">No pieces captured yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchDataUI
