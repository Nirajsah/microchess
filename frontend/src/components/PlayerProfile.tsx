import React from 'react'
import { Trophy, Target, Edit2, Check, X, ThumbsUpIcon } from 'lucide-react'

export const PlayerProfile = () => {
  const [activeTab, setActiveTab] = React.useState<'stats' | 'matches'>('stats')
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [tempName, setTempName] = React.useState('')

  // ⭐ Mock user data
  const [user, setUser] = React.useState({
    name: 'Niraj',
    elo: 1423,
    matches: 87,
    won: 52,
    lost: 28,
    ath: 1780,
    rank: 'Gold III',
  })

  // ⭐ Mock match history data
  const matches = [
    { id: 1, result: 'Win', opponent: 'Alice', eloGain: '+12' },
    { id: 2, result: 'Loss', opponent: 'Bob', eloGain: '-8' },
    { id: 3, result: 'Win', opponent: 'Carlos', eloGain: '+10' },
    { id: 4, result: 'Win', opponent: 'David', eloGain: '+15' },
  ]

  const handleSaveName = () => {
    setUser((prev) => ({ ...prev, name: tempName.trim() || prev.name }))
    setIsEditingName(false)
  }

  return (
    <div className="w-full space-y-4 max-h-[68%]">
      {/* ─── HEADER (Profile Image + Name + Rank) ────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-3xl font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + Rank */}
        <div className="flex flex-col">
          {/* Editable Name */}
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-white"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center"
              >
                <Check size={14} className="text-green-400" />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center"
              >
                <X size={14} className="text-red-400" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <button
                onClick={() => {
                  setTempName(user.name)
                  setIsEditingName(true)
                }}
                className="p-1 rounded-md hover:bg-zinc-700"
              >
                <Edit2 size={14} className="text-zinc-500" />
              </button>
            </div>
          )}
          <p className="text-sm text-zinc-400 mt-0.5">{user.rank}</p>
        </div>
      </div>

      {/* ─── TABS ───────────────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'stats'
              ? 'text-white border-b border-zinc-400'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'matches'
              ? 'text-white border-b border-zinc-400'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Matches
        </button>
      </div>

      {/* ─── TAB CONTENT ─────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className="space-y-4 max-h-[42%]">
          {/* Rating */}
          <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <Trophy className="text-amber-400" />
                Rating
              </div>
              <span className="text-3xl font-bold text-amber-400">
                {user.elo}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-zinc-800/40 p-4 text-center border border-zinc-700/50">
              <Target className="text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.matches}</p>
              <p className="text-xs text-zinc-400">Games Played</p>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-4 text-center border border-zinc-700/50">
              <ThumbsUpIcon className="text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.ath}</p>
              <p className="text-xs text-zinc-400">ATH</p>
            </div>
          </div>

          {/* Win / Loss / Draw */}
          <div className="space-y-2">
            <div className="flex justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-sm text-zinc-300">Wins</span>
              <span className="font-bold text-green-400">{user.won}</span>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-sm text-zinc-300">Losses</span>
              <span className="font-bold text-red-400">{user.lost}</span>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-zinc-500/10 border border-zinc-500/20">
              <span className="text-sm text-zinc-300">Draws</span>
              <span className="font-bold text-zinc-400">0</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-2 overflow-scroll max-h-[70%]">
          {matches.map((m) => (
            <div
              key={m.id}
              className="flex justify-between items-center p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/40"
            >
              <div>
                <p className="font-medium">{m.result}</p>
                <p className="text-sm text-zinc-400">vs {m.opponent}</p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  m.result === 'Win' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {m.eloGain}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
