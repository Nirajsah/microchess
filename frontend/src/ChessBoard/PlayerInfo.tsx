import React from 'react'
import { User } from 'lucide-react'
import Timer from './Timer'
import { opponentProfile, getProfile } from '@/api'

interface PlayerInfoProps {
  isOpponent?: boolean
  id: string | null
  timer: number
  isActive: boolean
  isStarted: boolean
}

export const PlayerInfo = ({
  isOpponent,
  id,
  timer,
  isActive,
  isStarted,
}: PlayerInfoProps) => {
  const [profile, setProfile] = React.useState<{
    name: string | null
    avatar?: string
  }>({ name: null })

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isOpponent && id) {
          const res = await opponentProfile(id)
          const data = JSON.parse(res.result).data.opponentProfile
          if (data) {
            setProfile({ name: data.name })
          }
        } else if (!isOpponent) {
          const res = await getProfile()
          const data = JSON.parse(res.result).data.profile
          if (data) {
            setProfile({ name: data.name })
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }

    fetchProfile()
  }, [isOpponent, id])

  return (
    <div className="flex items-center justify-between w-full bg-[#262626] rounded-xl">
      {/* Player Info */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-zinc-400" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">
            {profile.name || id}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`rounded-lg font-mono font-bold text-lg min-w-[80px] text-center transition-colors ${
            isActive
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}
        >
          <Timer
            initialTime={timer}
            isActive={isActive}
            isStarted={isStarted}
          />
        </div>
      </div>
    </div>
  )
}
