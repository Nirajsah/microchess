import React from 'react'

interface GameHistoryItem {
  opponent: string
  result: 'Win' | 'Loss' | 'Draw'
  date: string
}

export interface PlayerProfile {
  username: string
  avatarUrl: string
  title: string
  rating: number
  bestRating: number
  country: string
  recentGames: GameHistoryItem[]
}

export const PlayerProfileCard: React.FC<{ player: PlayerProfile }> = ({
  player,
}) => {
  return (
    <div className="w-[360px] text-white rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0b0b0c]/90 backdrop-blur-md">
      {/* Cover */}
      <div className="h-20 w-full bg-gradient-to-r from-purple-600/60 via-blue-600/60 to-cyan-500/60" />

      {/* Header */}
      <div className="px-5 -mt-8 flex items-end gap-3">
        <img
          src={player.avatarUrl}
          alt="Avatar"
          className="w-16 h-16 rounded-full object-cover ring-4 ring-[#0b0b0c]"
        />
        <div className="pb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold m-0">{player.username}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
              {player.title}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-0.5">{player.country}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
          <div className="text-[10px] uppercase tracking-wide text-white/60">Rating</div>
          <div className="text-lg font-semibold">{player.rating}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
          <div className="text-[10px] uppercase tracking-wide text-white/60">Best</div>
          <div className="text-lg font-semibold">{player.bestRating}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
          <div className="text-[10px] uppercase tracking-wide text-white/60">Games</div>
          <div className="text-lg font-semibold">{player.recentGames.length}</div>
        </div>
      </div>

      {/* Recent Games */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Recent Games</h3>
          <span className="text-[10px] text-white/50">Last {player.recentGames.length}</span>
        </div>
        <div className="space-y-1.5">
          {player.recentGames.map((game, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs px-2 py-2 rounded-md bg-white/5 border border-white/5"
            >
              <span className="text-white/70">{game.date}</span>
              <span
                className={
                  game.result === 'Win'
                    ? 'text-green-400'
                    : game.result === 'Loss'
                    ? 'text-red-400'
                    : 'text-yellow-300'
                }
              >
                vs {game.opponent} — {game.result}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
