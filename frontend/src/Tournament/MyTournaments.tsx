import { myTournaments } from '@/api/queries'
import { useEffect, useState } from 'react'
import Navbar from '../ChessBoard/Navbar'
import { motion } from 'framer-motion'
import { Users, Trophy, Settings, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '@/store/wallet'

type MyTournaments = {
  tournamentId: string
  tournamentName: string
  tournamentDescription: string
  tournamentFormat: string
  maxPlayers: number
  prizePool: string
  bannerImageUrl: string
  status: string
  __renderkey: any
}

export default function MyTournaments() {
  const navigate = useNavigate()
  const refetch = useWalletStore((s) => s.refetch)
  const [renderVersion, setRenderVersion] = useState(0)

  const [tournaments, setTournamentsList] = useState<MyTournaments[]>([])
  useEffect(() => {
    const fetchMyTournaments = async () => {
      try {
        const response = await myTournaments()
        const data = JSON.parse(response).data.myTournaments
        setTournamentsList(
          data.map((t: MyTournaments) => ({
            ...t,
            __renderKey: crypto.randomUUID(), // the tournamentId might be same, the UI doesn't rerender in that case
          }))
        )
        setRenderVersion((prev) => prev + 1)
      } catch (error) {
        console.error('Error fetching my tournaments:', error)
      }
    }
    fetchMyTournaments()
  }, [refetch])

  return (
    <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation selection:bg-yellow-500/30">
      <Navbar />

      <div className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#333] pb-8">
            <div>
              <div
                className="flex items-center gap-2 text-gray-500 text-sm mb-2 hover:text-gray-300 transition-colors cursor-pointer"
                onClick={() => navigate('/tournaments')}
              >
                <ChevronLeft className="w-4 h-4" /> Back to All Tournaments
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                My Tournaments
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Manage your created events, edit details, and track
                participants.
              </p>
            </div>
          </header>

          {tournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#262626] rounded-[18px] border border-[#333] border-dashed">
              <Trophy className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">
                No Tournaments Found
              </h3>
              <p className="text-gray-500 mb-6">
                You haven't hosted any tournaments yet.
              </p>
            </div>
          ) : (
            <div
              key={renderVersion}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {tournaments.map((t: MyTournaments, index) => (
                <div
                  key={(t.__renderkey, index)}
                  onClick={() => navigate(`/tournaments/my/${t.tournamentId}`)}
                  className="group bg-[#262626] border border-[#333] rounded-[18px] overflow-hidden cursor-pointer hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-900/10 transition-all duration-300 relative flex flex-col h-full"
                >
                  <div className="h-48 w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#262626] via-transparent to-transparent z-[1]" />
                    <img
                      src={
                        t.bannerImageUrl ||
                        'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80'
                      }
                      alt={t.tournamentName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide backdrop-blur-md border border-white/10 ${t.status === 'Published'
                          ? 'bg-green-500/80 text-white'
                          : 'bg-gray-700/80 text-gray-300'
                          }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-3 flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {t.tournamentName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {t.maxPlayers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />$ {t.prizePool}
                      </span>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between text-yellow-500 font-medium text-sm">
                      <span>Manage Tournament</span>
                      <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
