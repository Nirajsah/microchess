import { useEffect, useState } from 'react'
import Navbar from '../ChessBoard/Navbar'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/utils'
import { useParams } from 'react-router-dom'
import { useUserStore } from '@/store/microchess'
import { toast } from 'sonner'
import { tournamentRegistration } from '@/api'
import {
  Trophy,
  Users,
  Clock,
  Calendar,
  MapPin,
  Shield,
  Zap,
  Target,
  Medal,
  ChevronRight,
  User,
  Star,
  Timer,
  Gamepad2,
  Crown,
  Sparkles,
} from 'lucide-react'

type Participant = {
  id: string
  tournament_id: string
  player_name: string
  player_elo: number
  player_ath: number
  player_matches: number
}

type Tournament = {
  tournament_id: string
  organiserChain: string
  organiserId: string
  organiserName: string
  tournamentName: string
  tournamentDescription: string | null
  tournamentFormat: string
  matchType: string
  gameMode: string
  timeControlBaseMinutes: number
  timeControlIncrementSeconds: number
  timeControlModeLabel: string | null
  maxPlayers: number | null
  minPlayers: number | null
  startingTime: number
  endTime: number
  prizePoolDescription: string | null
  visibility: string
  bannerImageUrl: string | null
  sponsorLogoUrl: string | null
  prizeType: string
  prizePool: number
  customTags: string[]
  version: string
  createdAt: number
  updatedAt: number
  status: string
  tournamentparticipants: Participant[]
}

function shortAddress(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTimeUntil(timestamp: number): string {
  const now = Date.now()
  const diff = timestamp - now
  if (diff <= 0) return 'Started'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h`
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'REGISTRATION_OPEN':
      return {
        label: 'Registration Open',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        icon: Users,
      }
    case 'IN_PROGRESS':
      return {
        label: 'Live',
        color: 'bg-red-500',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: Zap,
      }
    case 'COMPLETED':
      return {
        label: 'Completed',
        color: 'bg-gray-500',
        textColor: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        icon: Trophy,
      }
    case 'REGISTRATION_CLOSED':
      return {
        label: 'Registration Closed',
        color: 'bg-orange-500',
        textColor: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        icon: Shield,
      }
    default:
      return {
        label: status,
        color: 'bg-gray-500',
        textColor: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        icon: Shield,
      }
  }
}

export default function TournamentPage() {
  const { id: tournamentId } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [rounds, _setRounds] = useState<any[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [failed, setFailed] = useState(false)

  const name = useUserStore((s) => s.userProfile.state?.name)

  useEffect(() => {
    async function getTournament() {
      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
        *,
        tournament_participants (
          id,
          tournament_id,
          player_name,
          player_elo,
          player_ath,
          player_matches
        )
      `
        )
        .eq('tournament_id', tournamentId)
        .single()

      if (error) {
        console.error('Error fetching tournament:', error)
        setFailed(true)
        return
      }

      setTournament(data)
      setParticipants(data.tournament_participants ?? [])
    }

    getTournament()

    const channel_tournament = supabase
      .channel('tournament-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
        },
        () => {
          getTournament()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel_tournament)
    }
  }, [])

  const handleRegister = async (tournamentId: string) => {
    if (!name) {
      toast.error('Please update your profile first')
      return
    }
    setIsRegistering(true)
    try {
      await tournamentRegistration(tournamentId)
      toast.success('Successfully registered for the tournament!')
    } catch {
      toast.error('Failed to register')
    } finally {
      setIsRegistering(false)
    }
  }

  if (!tournament) {
    return (
      <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            {failed ? (
              <p className="text-gray-400">Tournament not Found</p>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                <p className="text-gray-400">Loading tournament...</p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }


  const statusConfig = getStatusConfig(tournament.status)
  const StatusIcon = statusConfig.icon
  const spotsLeft = tournament.maxPlayers
    ? tournament.maxPlayers - participants.length
    : null
  const isRegistrationOpen = tournament.status === 'REGISTRATION_OPEN'
  const progress = tournament.maxPlayers
    ? (participants.length / tournament.maxPlayers) * 100
    : 0

  return (
    <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation">
      <Navbar />

      <div className="flex-1 flex flex-col">
        {/* Hero Section with Banner */}
        <div className="relative w-full h-[450px] md:h-[500px] overflow-hidden">
          {/* Background Image */}
          {tournament.bannerImageUrl ? (
            <img
              src={tournament.bannerImageUrl}
              alt="Tournament Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#262626] via-[#1f1f1f] to-[#161616]" />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#161616]/80 via-transparent to-transparent" />

          {/* Content Container */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-7xl mx-auto w-full">
            {/* Status Badge & Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border backdrop-blur-md`}
              >
                <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
                <span
                  className={`text-sm font-bold uppercase tracking-wide ${statusConfig.textColor}`}
                >
                  {statusConfig.label}
                </span>
                {tournament.status === 'IN_PROGRESS' && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </motion.div>

              {tournament.customTags?.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 backdrop-blur-md"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Tournament Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-4 drop-shadow-2xl"
            >
              {tournament.tournamentName}
            </motion.h1>

            {/* Quick Info Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-300"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">
                  Hosted by{' '}
                  <span className="text-white font-medium">
                    {tournament.organiserName}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">
                  {formatDate(tournament.startingTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">
                  {participants.length}
                  {tournament.maxPlayers && ` / ${tournament.maxPlayers}`}{' '}
                  Players
                </span>
              </div>
            </motion.div>

            {/* Sponsor Badge */}
            {tournament.sponsorLogoUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute top-6 right-6 md:top-12 md:right-12"
              >
                <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">
                    Sponsored by
                  </span>
                  <img
                    src={tournament.sponsorLogoUrl}
                    alt="Sponsor"
                    className="h-8 object-contain brightness-110"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Registration CTA Card - Only show when registration open */}
              {isRegistrationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20 rounded-2xl p-6"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                  <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-500 font-bold text-sm uppercase tracking-wide">
                          Registration Open
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Join the Competition!
                      </h3>
                      <p className="text-gray-400">
                        {spotsLeft !== null ? (
                          <>
                            Only{' '}
                            <span className="text-yellow-500 font-bold">
                              {spotsLeft} spots
                            </span>{' '}
                            remaining. Don't miss your chance to compete!
                          </>
                        ) : (
                          'Register now to secure your spot in this tournament.'
                        )}
                      </p>

                      {/* Progress Bar */}
                      {tournament.maxPlayers && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">
                              Registration Progress
                            </span>
                            <span className="text-yellow-500 font-medium">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRegister(tournament.tournament_id)}
                      disabled={isRegistering}
                      className="group relative px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-lg rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 whitespace-nowrap"
                    >
                      {isRegistering ? (
                        <>
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Trophy className="w-5 h-5" />
                          Register Now
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* About Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-500" />
                  About This Tournament
                </h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {tournament.tournamentDescription ||
                    'No description provided.'}
                </p>
              </motion.div>

              {/* Tournament Details Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <InfoCard
                  icon={Gamepad2}
                  label="Format"
                  value={tournament.tournamentFormat?.replace(/_/g, ' ')}
                />
                <InfoCard
                  icon={Shield}
                  label="Match Type"
                  value={tournament.matchType?.replace(/_/g, ' ')}
                />
                <InfoCard
                  icon={Zap}
                  label="Game Mode"
                  value={tournament.gameMode?.replace(/_/g, ' ')}
                />
                <InfoCard
                  icon={Timer}
                  label="Time Control"
                  value={`${tournament.timeControlBaseMinutes}+${tournament.timeControlIncrementSeconds}`}
                />
              </motion.div>

              {/* Schedule Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8"
              >
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                  Schedule
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Starts</p>
                      <p className="text-white font-bold text-lg">
                        {formatDate(tournament.startingTime)}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formatTime(tournament.startingTime)}
                      </p>
                      {tournament.startingTime > Date.now() && (
                        <p className="text-emerald-400 text-sm mt-1 font-medium">
                          in {getTimeUntil(tournament.startingTime)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Ends</p>
                      <p className="text-white font-bold text-lg">
                        {formatDate(tournament.endTime)}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formatTime(tournament.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Participants Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-yellow-500" />
                    Participants
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-[#333] text-gray-300 text-sm font-medium">
                    {participants.length}
                    {tournament.maxPlayers && ` / ${tournament.maxPlayers}`}
                  </span>
                </div>

                {participants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {participants.map((p, index) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex items-center gap-4 p-4 bg-[#262626] rounded-xl border border-[#333] hover:border-yellow-500/30 transition-all"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-[#444] group-hover:border-yellow-500/50 transition-colors">
                            <span className="font-bold text-yellow-500 text-lg">
                              {(p.player_name || 'P')[0]?.toUpperCase()}
                            </span>
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-black">
                                {index + 1}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate group-hover:text-yellow-400 transition-colors">
                            {p.player_name || shortAddress(p.id)}
                          </p>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-gray-500">
                              <Star className="w-3 h-3" />
                              {p.player_elo}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Gamepad2 className="w-3 h-3" />
                              {p.player_matches} games
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 bg-[#262626] rounded-xl border border-dashed border-[#444]">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">
                      No participants yet
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Be the first to register!
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Live Bracket - Only visible if InProgress */}
              {tournament.status === 'IN_PROGRESS' && rounds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8"
                >
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-500" />
                    Live Bracket
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2" />
                  </h2>
                  {/* Bracket visualization would go here */}
                  <div className="text-gray-400 text-center py-8">
                    Bracket visualization coming soon...
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Prize Pool Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden bg-gradient-to-br from-[#262626] to-[#1f1f1f] border border-[#333] rounded-2xl p-6"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                      Prize Pool
                    </span>
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
                    ${tournament.prizePool?.toLocaleString() || '0'}
                  </div>
                  <span className="inline-block px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-500 text-xs font-bold">
                    {tournament.prizeType}
                  </span>

                  {tournament.prizePoolDescription && (
                    <div className="mt-4 pt-4 border-t border-[#333]">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                        Distribution
                      </p>
                      <div className="space-y-2">
                        {tournament.prizePoolDescription
                          .split('\n')
                          .map((line, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Medal
                                className={`w-4 h-4 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-600'}`}
                              />
                              <span className="text-gray-300">{line}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <StatRow
                    label="Min Players"
                    value={tournament.minPlayers?.toString() || 'N/A'}
                  />
                  <StatRow
                    label="Max Players"
                    value={tournament.maxPlayers?.toString() || 'Unlimited'}
                  />
                  <StatRow
                    label="Visibility"
                    value={tournament.visibility?.toLowerCase() || 'Public'}
                    capitalize
                  />
                  <StatRow
                    label="Created"
                    value={formatDate(tournament.createdAt)}
                  />
                </div>
              </motion.div>

              {/* Organizer Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Organizer
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border-2 border-yellow-500/30">
                    <span className="font-bold text-yellow-500 text-xl">
                      {tournament.organiserName?.[0]?.toUpperCase() || 'O'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      {tournament.organiserName}
                    </p>
                    <p className="text-gray-500 text-sm">Tournament Host</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | undefined | null
}) {
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-xl p-4 hover:border-[#444] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-yellow-500" />
        <span className="text-gray-500 text-xs uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-white font-bold">{value || 'N/A'}</p>
    </div>
  )
}

function StatRow({
  label,
  value,
  capitalize = false,
}: {
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 text-sm">{label}</span>
      <span
        className={`text-white font-medium ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
