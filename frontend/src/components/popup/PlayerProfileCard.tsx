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
    <div className="max-w-sm w-full mx-auto my-5 p-4 shadow-md rounded-lg bg-background-primary border border-[#ffffff24] text-white">
      {/* Header */}
      <div className="flex items-center mb-4">
        <img
          src={player.avatarUrl}
          alt="Avatar"
          className="w-20 h-20 rounded-full object-cover mr-4"
        />
        <div>
          <h2 className="text-xl font-semibold m-0">{player.username}</h2>
          <p className="text-gray-500 m-0">{player.title}</p>
          <p className="text-sm mt-1">{player.country}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <div className="mb-1">
          <strong>Current Rating:</strong> {player.rating}
        </div>
        <div className="mb-1">
          <strong>Best Rating:</strong> {player.bestRating}
        </div>
      </div>

      {/* Recent Games */}
      <div className="border-t pt-3">
        <h3 className="font-semibold text-lg mb-2">Recent Games</h3>
        {player.recentGames.map((game, index) => (
          <div
            key={index}
            className="flex justify-between text-sm py-1 border-b last:border-b-0"
          >
            <span className="text-gray-600">{game.date}</span>
            <span
              className={
                game.result === 'Win'
                  ? 'text-green-400'
                  : game.result === 'Loss'
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }
            >
              vs {game.opponent} — {game.result}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
