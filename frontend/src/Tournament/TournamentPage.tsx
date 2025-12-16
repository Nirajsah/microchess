import { useEffect, useState } from 'react'
import Navbar from '../ChessBoard/Navbar'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/utils'
import { useParams } from 'react-router-dom'
import { useUserStore } from '@/store/microchess'
import { toast } from 'sonner'
import { tournamentRegistration } from '@/api'

type Participant = {
  id: string
  tournamentId: string
  playerName: string
  playerElo: number
  playerAth: number
  playerMatches: number
}

type Tournament = {
  tournamentId: string
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
  roundCount: number | null
  allowLateJoin: boolean
  startingTime: number
  endTime: number
  roundTimeLimitMinutes: number
  checkInTime: number
  prizePoolDescription: string | null
  visibility: string
  inviteOnly: boolean
  accessCode: string | null
  bannerImageUrl: string | null
  sponsorLogoUrl: string | null
  prizeType: string[]
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

export default function TournamentPage() {
  const { id: tournamentId } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [rounds, _setRounds] = useState<any[]>([])

  const name = useUserStore((s) => s.userProfile.state?.name)

  useEffect(() => {
    async function getTournament() {
      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
        *,
        tournamentparticipants (
          id,
          tournamentId,
          playerName,
          playerElo,
          playerAth,
          playerMatches
        )
      `
        )
        .eq('tournamentId', tournamentId)
        .single()

      if (error) {
        console.error('Error fetching tournament:', error)
        return
      }

      setTournament(data)
      setParticipants(data.tournamentparticipants ?? [])
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
      toast.error('Update your profile')
      return
    }
    try {
      await tournamentRegistration(tournamentId)
      toast.success('Registered')
    } catch {
      toast.error('Failed to register')
      return
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation">
      <Navbar />
      <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
        <div className="w-full max-w-7xl">
          {/* Banner Image & Header Info */}
          <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12 shadow-2xl border border-[#333] group">
            {tournament?.bannerImageUrl ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/40 to-transparent z-10" />
                <img
                  src={tournament.bannerImageUrl}
                  alt="Tournament Banner"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#262626] to-[#1a1a1a] flex items-center justify-center">
                <span className="text-gray-600 font-bold text-2xl">
                  No Banner Available
                </span>
              </div>
            )}

            {/* Status Badge Over Banner (Top Right) */}
            <div className="absolute top-6 right-6 z-20">
              <span
                className={`
                    px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide backdrop-blur-md border border-white/10 shadow-lg
                    ${
                      tournament?.status === 'IN_PROGRESS'
                        ? 'bg-red-500/80 text-white animate-pulse'
                        : ''
                    }
                    ${
                      tournament?.status === 'REGISTRATION_OPEN'
                        ? 'bg-green-500/80 text-white'
                        : ''
                    }
                    ${
                      tournament?.status === 'COMPLETED'
                        ? 'bg-gray-800/80 text-gray-400'
                        : ''
                    }
                `}
              >
                {tournament?.status === 'IN_PROGRESS' && (
                  <span className="mr-2">●</span>
                )}
                {tournament?.status}
              </span>
            </div>

            {/* Title & Info Overlay (Bottom Left) */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-2xl">
                  {tournament?.tournamentName || 'Tournament'}
                </h1>

                {tournament?.sponsorLogoUrl && (
                  <div className="mb-2 md:mb-4 h-10 px-4 py-1.5 bg-black/40 rounded-lg border border-white/10 backdrop-blur-md flex items-center hover:bg-black/60 transition-colors cursor-pointer">
                    <span className="text-[10px] uppercase text-gray-300 mr-2 font-bold tracking-wider">
                      Sponsored by
                    </span>
                    <img
                      src={tournament.sponsorLogoUrl}
                      alt="Sponsor"
                      className="h-full object-contain max-w-[100px] brightness-125"
                    />
                  </div>
                )}
              </div>

              <p className="text-lg md:text-xl text-gray-200 max-w-4xl leading-relaxed drop-shadow-md font-medium">
                {tournament?.tournamentDescription || ''}
              </p>

              {tournament?.status === 'REGISTRATION_OPEN' && (
                <button
                  onClick={() => handleRegister(tournament.tournamentId)}
                  className="w-fit absolute self-end mt-4 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-lg rounded-xl shadow-lg hover:shadow-yellow-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                >
                  Register for Tournament
                </button>
              )}
            </div>
          </div>

          {/* Details Section - Always Visible */}
          <div className="grid grid-cols-1 gap-8 mb-12">
            <div className="bg-[#262626] p-8 rounded-2xl border border-[#333]">
              <h3 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
                Tournament Details
              </h3>
              <div className="space-y-6 text-gray-300">
                <p className="leading-relaxed text-lg">
                  {tournament?.tournamentDescription}
                </p>

                <div className="h-[1px] w-full bg-[#333]"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                  <DetailItem
                    label="Organiser"
                    value={tournament?.organiserName || 'Unknown'}
                  />
                  <DetailItem
                    label="Match Type"
                    value={tournament?.matchType}
                  />
                  <DetailItem
                    label="Format"
                    value={tournament?.tournamentFormat}
                  />
                  <DetailItem
                    label="Time Control"
                    value={`${tournament?.timeControlBaseMinutes}+${tournament?.timeControlIncrementSeconds}`}
                  />

                  <DetailItem
                    label="Start Date"
                    value={
                      tournament?.startingTime
                        ? new Date(tournament.startingTime).toLocaleDateString()
                        : 'TBA'
                    }
                  />
                  <DetailItem
                    label="End Date"
                    value={
                      tournament?.endTime
                        ? new Date(tournament.endTime).toLocaleDateString()
                        : 'TBA'
                    }
                  />
                  <DetailItem
                    label="Prize Pool"
                    value={tournament?.prizePoolDescription || 'N/A'}
                    highlight
                  />
                  <DetailItem
                    label="Registered"
                    value={`${participants.length} / ${
                      tournament?.maxPlayers || '∞'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Content: Rounds (InProgress) or Participants (Other) */}
          {/* Content Section: Rounds (if InProgress) AND Participants (Always) */}
          <div className="flex flex-col gap-12">
            {/* Live Bracket - Only visible if InProgress */}
            {tournament?.status === 'InProgress' && (
              <div className="flex flex-col gap-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-100 flex items-center gap-2">
                  Live Bracket
                </h3>
                <div className="flex flex-col lg:flex-row gap-8 justify-between items-start overflow-x-auto pb-8">
                  {rounds.length > 0 ? (
                    rounds.map((round, roundIndex) => (
                      <div
                        key={round.id}
                        className="flex flex-col gap-6 min-w-[300px] w-full lg:w-1/3"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-8 w-1 bg-gradient-to-b from-yellow-400 to-orange-600 rounded-full"></div>
                          <h2 className="text-xl font-semibold uppercase tracking-wider text-gray-200">
                            {round.name}
                          </h2>
                        </div>

                        <div className="flex flex-col gap-6 relative">
                          {/* Connecting Lines (Visual only, simplified) */}
                          {roundIndex < rounds.length - 1 && (
                            <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-800 hidden lg:block"></div>
                          )}

                          {round.matches &&
                            round.matches.map(
                              (match: any, matchIndex: number) => (
                                <MatchCard
                                  key={match.id}
                                  match={match}
                                  index={matchIndex}
                                />
                              )
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic">
                      No rounds scheduled yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Participants Section - Always Visible */}
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <h3 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
                Participants
                <span className="text-sm font-normal text-gray-500 bg-[#262626] px-2 py-1 rounded-full border border-[#333]">
                  {participants.length}
                </span>
              </h3>

              {participants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {participants.map((p: Participant) => (
                    <div
                      key={p.id}
                      className="group bg-[#262626] p-4 rounded-xl border border-[#333] hover:border-yellow-500/30 transition-all hover:bg-[#2c2c2c] flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center overflow-hidden border border-[#444] group-hover:border-yellow-500/50 transition-colors">
                        <span className="font-bold text-gray-400 text-lg">
                          {(p.playerName || 'P')[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="font-semibold text-gray-200 truncate group-hover:text-yellow-400 transition-colors">
                          {p.playerName
                            ? p.playerName.toUpperCase()
                            : shortAddress(p.id)}
                        </div>
                        {p.playerElo != null && (
                          <div className="text-xs text-gray-500">
                            <span>Rating: {p.playerElo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 bg-[#262626] rounded-xl border border-[#333] border-dashed">
                  No participants registered yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, index }: { match: any; index: number }) {
  const isCompleted = match.status === 'completed'
  const isLocked = match.status === 'locked'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        relative flex flex-col bg-[#262626] rounded-xl border border-[#333] overflow-hidden shadow-lg
        ${isCompleted ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}
        ${isLocked ? 'opacity-40' : ''}
        hover:border-yellow-500/50 transition-all duration-300 group
      `}
    >
      {/* Match Header */}
      <div className="px-4 py-2 bg-[#1f1f1f] flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider">
        <span>Match #{match.id}</span>
        <span
          className={`
          px-2 py-0.5 rounded-full text-[10px] font-bold
          ${
            match.status === 'live'
              ? 'bg-red-500/20 text-red-500 animate-pulse'
              : ''
          }
          ${match.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' : ''}
          ${
            match.status === 'completed' ? 'bg-green-500/20 text-green-400' : ''
          }
          ${match.status === 'locked' ? 'bg-gray-700 text-gray-500' : ''}
        `}
        >
          {match.status}
        </span>
      </div>

      {/* Players */}
      <div className="p-4 flex flex-col gap-3">
        <PlayerRow
          player={match.player1}
          isWinner={
            match.winner === (match.player1?.name || match.player1?.username)
          }
          score={match.score?.split(' - ')[0] || '-'}
        />
        <div className="h-[1px] w-full bg-[#333]"></div>
        <PlayerRow
          player={match.player2}
          isWinner={
            match.winner === (match.player2?.name || match.player2?.username)
          }
          score={match.score?.split(' - ')[1] || '-'}
        />
      </div>

      {/* Hover Effect Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </motion.div>
  )
}

function PlayerRow({
  player,
  isWinner,
  score,
}: {
  player: any
  isWinner: boolean
  score: string
}) {
  const isTBD = !player || player.name === 'TBD' || player.username === 'TBD'

  return (
    <div
      className={`flex items-center justify-between ${
        isWinner ? 'text-yellow-400' : 'text-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        {player?.avatar || player?.avatar_url ? (
          <img
            src={player.avatar || player.avatar_url}
            alt={player.name || player.username}
            className="w-8 h-8 rounded-full object-cover border border-[#444]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs text-gray-500">
            ?
          </div>
        )}
        <div className="flex flex-col">
          <span
            className={`font-medium ${isWinner ? 'font-bold' : ''} ${
              isTBD ? 'text-gray-600 italic' : ''
            }`}
          >
            {player?.name || player?.username || (isTBD ? 'TBD' : 'Unknown')}
          </span>
          {!isTBD && (
            <span className="text-[10px] text-gray-500">
              Rank #{player.rank}
            </span>
          )}
        </div>
      </div>
      <span
        className={`text-lg font-mono ${
          isWinner ? 'text-yellow-400 font-bold' : 'text-gray-500'
        }`}
      >
        {score}
      </span>
    </div>
  )
}
function DetailItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string | undefined | null
  highlight?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">
        {label}
      </span>
      <span
        className={`font-medium text-lg ${
          highlight ? 'text-yellow-400 font-bold' : 'text-gray-200'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
