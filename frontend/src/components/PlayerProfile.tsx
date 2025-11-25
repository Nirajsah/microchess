import React from 'react'
import { Trophy, Target, Edit2, Check, X, ThumbsUpIcon } from 'lucide-react'
import { useUserStore } from '@/store/microchess'
import { getMatchHistory } from '@/api'

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-zinc-800/60 rounded-md ${className}`} />
)

type MatchHistory = {
  you: {
    id: string
    name: string | null
  }
  opponent: {
    id: string
    name: string | null
  }
  blobHash: string
}

const formatElo = (elo?: number) => elo ?? 0
const formatNumber = (num?: number) => num ?? 0

export const PlayerProfile = () => {
  const profile = useUserStore((s) => s.userProfile)

  const [activeTab, setActiveTab] = React.useState<'stats' | 'matches'>('stats')
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [tempName, setTempName] = React.useState('')
  const [matcheHistory, setMatchHistory] = React.useState<MatchHistory[]>([
    {
      you: {
        id: '',
        name: '',
      },
      opponent: {
        id: '',
        name: '',
      },
      blobHash: '',
    },
  ])

  const user = React.useMemo(() => {
    return {
      name: profile?.name || 'Player',
      elo: formatElo(profile?.elo),
      matches: formatNumber(profile?.matches),
      won: formatNumber(profile?.won),
      lost: formatNumber(profile?.lost),
      ath: formatElo(profile?.ath),
      id: profile?.id || 'update your profile',
      draws: formatNumber(0),
    }
  }, [profile])

  React.useEffect(() => {
    const fetchMatches = async () => {
      const data = await getMatchHistory()
      setMatchHistory(JSON.parse(data.result).data.matchHistoryAll)
    }
    fetchMatches()
  }, [profile])

  const handleSaveName = () => {
    setIsEditingName(false)
  }

  return (
    <div className="w-full space-y-4 max-h-[68%]">
      {/* ─── HEADER (Profile Image + Name + Rank) ────────────────────────── */}
      <div className="flex items-center gap-4">
        {!user ? (
          <Skeleton className="w-14 h-14 rounded-2xl" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name + Rank */}
        <div className="flex flex-col">
          {!user ? (
            <>
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </>
          ) : (
            <>
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
              <p className="text-xs text-zinc-400 mt-0.5 max-w-[270px] truncate">
                {user.id}
              </p>
            </>
          )}
        </div>
      </div>

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

      {activeTab === 'stats' && (
        <div className="space-y-4 max-h-[42%]">
          {!user ? (
            <Skeleton className="h-[74px] w-full rounded-xl" />
          ) : (
            <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/50 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Trophy className="text-amber-400" />
                  Rating
                </div>
                <span className="text-2xl font-bold text-amber-400">
                  {user.elo}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {!user ? (
              <>
                <Skeleton className="h-[90px] rounded-xl" />
                <Skeleton className="h-[90px] rounded-xl" />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="space-y-2">
            {!user ? (
              <>
                <Skeleton className="h-[46px] w-full rounded-lg" />
                <Skeleton className="h-[46px] w-full rounded-lg" />
                <Skeleton className="h-[46px] w-full rounded-lg" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm text-zinc-300">Wins</span>
                  <span className="font-bold text-green-400">{user.won}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-sm text-zinc-300">Losses</span>
                  <span className="font-bold text-red-400">{user.lost}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-500/10 border border-zinc-500/20">
                  <span className="text-sm text-zinc-300">Draws</span>
                  <span className="font-bold text-zinc-400">{user.draws}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="space-y-2 overflow-scroll max-h-[70%]"
        >
          {!user ? (
            <>
              <Skeleton className="h-[66px] w-full rounded-lg" />
              <Skeleton className="h-[66px] w-full rounded-lg" />
              <Skeleton className="h-[66px] w-full rounded-lg" />
            </>
          ) : (
            matcheHistory.map((m: MatchHistory, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/40"
              >
                <div>
                  <p className="font-medium truncate max-w-[300px]">
                    {m.you.id}
                  </p>
                  <p className="text-sm text-zinc-400 truncate max-w-[300px]">
                    vs {m.opponent.id}
                  </p>
                </div>
                {/* <span
                  className={`text-sm font-semibold ${
                    m.result === 'Win' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {m.eloGain}
                </span> */}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
