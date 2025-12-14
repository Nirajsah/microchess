
import Navbar from '../ChessBoard/Navbar'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Trophy, ArrowRight, Clock } from 'lucide-react'

// Mock Data
const tournaments = [
    {
        id: 't1',
        name: 'Weekly Blitz Arena',
        description: 'Fast-paced action for adrenaline junkies. 3+2 time control.',
        format: 'Arena',
        status: 'Registering',
        players: '12/40',
        prize: '$500',
        startTime: 'In 2 hours',
        image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80'
    },
    {
        id: 't2',
        name: 'Grandmaster Clash 2025',
        description: 'The ultimate battle for chess supremacy.',
        format: 'Swiss',
        status: 'Live',
        players: '32/32',
        prize: '$10,000',
        startTime: 'Started',
        image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&q=80'
    },
    {
        id: 't3',
        name: 'Beginner Friendly Rapid',
        description: 'A friendly environment for new players to learn and compete.',
        format: 'Swiss',
        status: 'Completed',
        players: '24/24',
        prize: 'NFT Badge',
        startTime: 'Yesterday',
        image: 'https://images.unsplash.com/photo-1580541832626-d297a73771de?w=800&q=80'
    }
]

export default function TournamentList() {
    const navigate = useNavigate()

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
                            <p className="text-gray-400">Compete in high-stakes chess tournaments and win prizes.</p>
                        </div>
                        <Button
                            onClick={() => navigate('/create')}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-lg py-6 px-8 rounded-full shadow-lg shadow-yellow-900/20 transition-all hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Host a Tournament
                        </Button>
                    </div>

                    {/* Filters (Mock) */}
                    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                        {['All', 'Live', 'Upcoming', 'Completed'].map((filter, i) => (
                            <button
                                key={filter}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${i === 0 ? 'bg-white text-black' : 'bg-[#262626] text-gray-400 hover:bg-[#333]'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.map((t, i) => (
                            <TournamentCard key={t.id} tournament={t} index={i} onClick={() => navigate('/tournament')} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function TournamentCard({ tournament, index, onClick }: { tournament: any, index: number, onClick: () => void }) {
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
                <span className={`
                    px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md border border-white/10
                    ${tournament.status === 'Live' ? 'bg-red-500/80 text-white animate-pulse' : ''}
                    ${tournament.status === 'Registering' ? 'bg-green-500/80 text-white' : ''}
                    ${tournament.status === 'Completed' ? 'bg-gray-800/80 text-gray-400' : ''}
                `}>
                    {tournament.status === 'Live' && <span className="mr-1">●</span>}
                    {tournament.status}
                </span>
            </div>

            {/* Image */}
            <div className="h-48 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#262626] via-transparent to-transparent z-[1]" />
                <img
                    src={tournament.image}
                    alt={tournament.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-4 flex-1">
                <div>
                    <h3 className="text-xl font-bold text-gray-100 group-hover:text-yellow-400 transition-colors mb-2">
                        {tournament.name}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                        {tournament.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>{tournament.prize}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>{tournament.players}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#333] flex justify-between items-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {tournament.startTime}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-white">
                        Details <ArrowRight className="w-3 h-3" />
                    </span>
                </div>
            </div>
        </motion.div>
    )
}
