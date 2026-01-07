import Navbar from '../ChessBoard/Navbar'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Trophy, ArrowRight, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/utils'
import { microsToDatetimeLocal } from './utils'

export type Tournament = {
  tournament_id: string
  tournament_name: string
  tournament_description: string
  tournament_format: string
  max_players: number
  starting_time: number
  end_time: number
  prize_pool_description: string
  visibility: string
  banner_image_url: string
  sponsor_logo_url: string
  prize_type: string
  prize_pool: number
  created_at: number
  status: string
  participant_count: { count: number }[]
}

export default function TournamentList() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  useEffect(() => {
    async function getTournaments() {
      const { data: tournaments } = await supabase.from('tournaments_v2')
        .select(`
          tournament_id,
          tournament_name,
          tournament_description,
          tournament_format,
          max_players,
          starting_time,
          end_time,
          prize_pool_description,
          visibility,
          banner_image_url,
          sponsor_logo_url,
          prize_type,
          prize_pool,
          created_at,
          status,
          participant_count:tournament_participants_v2(count)
        `)

      if (!tournaments) return
      setTournaments(tournaments)
    }
    getTournaments()

    const channel_tournaments = supabase
      .channel('tournaments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments_v2',
        },
        () => {
          getTournaments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel_tournaments)
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation">
      <Navbar />

      <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto w-full">
        <div className="w-full max-w-7xl animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-600 mb-2">
                Tournaments
              </h1>
              <p className="text-gray-400">
                Compete in high-stakes chess tournaments and win prizes.
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/tournaments/my')}
                className="bg-[#262626] hover:bg-[#333] text-white font-semibold text-lg py-6 px-8 rounded-full border border-[#333] transition-all hover:scale-105"
              >
                <Trophy className="w-5 h-5 mr-2" /> My Tournaments
              </Button>
              <Button
                onClick={() => navigate('/tournaments/create')}
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-lg py-6 px-8 rounded-full shadow-lg shadow-yellow-900/20 transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" /> Host a Tournament
              </Button>
            </div>
          </div>

          {/* Filters (Mock) */}
          {/* <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {['All', 'Live', 'Upcoming', 'Completed'].map((filter, i) => (
              <button
                key={filter}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  i === 0
                    ? 'bg-white text-black'
                    : 'bg-[#262626] text-gray-400 hover:bg-[#333]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div> */}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t, i) => (
              <TournamentCard
                key={t.tournament_id}
                tournament={t}
                index={i}
                onClick={() => navigate(`/tournaments/${t.tournament_id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TournamentCard({
  tournament,
  index,
  onClick,
}: {
  tournament: Tournament
  index: number
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="group bg-[#262626] border border-[#333] rounded-[18px] overflow-hidden cursor-pointer hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-900/10 transition-all duration-300 relative flex flex-col h-full"
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span
          className={`
                    px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md border border-white/10
                    ${
                      tournament.status === 'IN_PROGRESS'
                        ? 'bg-red-500/80 text-white animate-pulse'
                        : ''
                    }
                    ${
                      tournament.status === 'REGISTRATION_OPEN'
                        ? 'bg-green-500/80 text-white'
                        : ''
                    }
                    ${
                      tournament.status === 'COMPLETED'
                        ? 'bg-gray-800/80 text-gray-400'
                        : ''
                    }
                `}
        >
          {tournament.status === 'IN_PROGRESS' && (
            <span className="mr-1">●</span>
          )}
          {tournament.status}
        </span>
      </div>

      {/* Image */}
      <div className="h-48 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#262626] via-transparent to-transparent z-[1]" />
        <img
          src={
            tournament.banner_image_url
              ? decodeURIComponent(tournament.banner_image_url)
              : 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80'
          }
          alt="Tournament banner"
          onError={(e) => {
            console.error('Image load failed:', e.currentTarget.src)
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80'
          }}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-4 flex-1">
        <div>
          <h3 className="text-xl font-bold text-gray-100 group-hover:text-yellow-400 transition-colors mb-2">
            {tournament.tournament_name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {tournament.tournament_description}
          </p>
        </div>

        <div className="flex justify-between gap-4 mt-auto">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>${tournament.prize_pool}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users className="w-4 h-4 text-blue-500" />
            <span>{tournament.participant_count[0].count}</span>/
            <span>{tournament.max_players}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#333] flex justify-between items-center text-xs font-medium uppercase tracking-wider text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {microsToDatetimeLocal(tournament.starting_time)}
          </span>
          <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-white">
            Details <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  )
}
