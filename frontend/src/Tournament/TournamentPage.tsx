import Navbar from '../ChessBoard/Navbar'
import { motion } from 'framer-motion'

// Mock Data
const rounds = [
    {
        id: 1,
        name: 'Quarter Finals',
        matches: [
            {
                id: 'm1',
                player1: { name: 'Magnus Carlsen', rank: 1, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/3b0ddf4e-e5df-11e9-94d0-8a06b5f9e89c.5d987468.250x250o.675f24.jpg' },
                player2: { name: 'Hikaru Nakamura', rank: 2, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/76f3f012-e5df-11e9-94d0-8a06b5f9e89c.8d172600.250x250o.c80b60.jpg' },
                winner: 'Magnus Carlsen',
                status: 'completed',
                score: '1 - 0'
            },
            {
                id: 'm2',
                player1: { name: 'Fabiano Caruana', rank: 3, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/47161198-e5df-11e9-94d0-8a06b5f9e89c.333065d4.250x250o.1607d0.jpg' },
                player2: { name: 'Ian Nepomniachtchi', rank: 4, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/4426558c-e5df-11e9-94d0-8a06b5f9e89c.57684072.250x250o.1607d0.jpg' },
                winner: 'Fabiano Caruana',
                status: 'completed',
                score: '1 - 0'
            },
            {
                id: 'm3',
                player1: { name: 'Ding Liren', rank: 5, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/3f822858-e5df-11e9-94d0-8a06b5f9e89c.43385627.250x250o.1607d0.jpg' },
                player2: { name: 'Alireza Firouzja', rank: 6, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/50269008-e5df-11e9-94d0-8a06b5f9e89c.04018870.250x250o.1607d0.jpg' },
                winner: null,
                status: 'scheduled',
                score: 'vs'
            },
            {
                id: 'm4',
                player1: { name: 'Wesley So', rank: 7, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/41261328-e5df-11e9-94d0-8a06b5f9e89c.89530466.250x250o.1607d0.jpg' },
                player2: { name: 'Anish Giri', rank: 8, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/48262238-e5df-11e9-94d0-8a06b5f9e89c.53032845.250x250o.1607d0.jpg' },
                winner: null,
                status: 'scheduled',
                score: 'vs'
            }
        ]
    },
    {
        id: 2,
        name: 'Semi Finals',
        matches: [
            {
                id: 'm5',
                player1: { name: 'Magnus Carlsen', rank: 1, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/3b0ddf4e-e5df-11e9-94d0-8a06b5f9e89c.5d987468.250x250o.675f24.jpg' },
                player2: { name: 'Fabiano Caruana', rank: 3, avatar: 'https://images.chesscomfiles.com/uploads/v1/master_player/47161198-e5df-11e9-94d0-8a06b5f9e89c.333065d4.250x250o.1607d0.jpg' },
                winner: null,
                status: 'scheduled',
                score: 'vs'
            },
            {
                id: 'm6',
                player1: { name: 'TBD', rank: 0, avatar: '' },
                player2: { name: 'TBD', rank: 0, avatar: '' },
                winner: null,
                status: 'locked',
                score: 'vs'
            }
        ]
    },
    {
        id: 3,
        name: 'Finals',
        matches: [
            {
                id: 'm7',
                player1: { name: 'TBD', rank: 0, avatar: '' },
                player2: { name: 'TBD', rank: 0, avatar: '' },
                winner: null,
                status: 'locked',
                score: 'vs'
            }
        ]
    }
]

export default function TournamentPage() {
    return (
        <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation">
            <Navbar />

            <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
                <div className="w-full max-w-7xl">
                    <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                        Grandmaster Clash 2025
                    </h1>
                    <p className="text-gray-400 mb-12">The ultimate battle for chess supremacy.</p>

                    <div className="flex flex-col lg:flex-row gap-8 justify-between items-start overflow-x-auto pb-8">
                        {rounds.map((round, roundIndex) => (
                            <div key={round.id} className="flex flex-col gap-6 min-w-[300px] w-full lg:w-1/3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-1 bg-gradient-to-b from-yellow-400 to-orange-600 rounded-full"></div>
                                    <h2 className="text-xl font-semibold uppercase tracking-wider text-gray-200">{round.name}</h2>
                                </div>

                                <div className="flex flex-col gap-6 relative">
                                    {/* Connecting Lines (Visual only, simplified) */}
                                    {roundIndex < rounds.length - 1 && (
                                        <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-800 hidden lg:block"></div>
                                    )}

                                    {round.matches.map((match, matchIndex) => (
                                        <MatchCard key={match.id} match={match} index={matchIndex} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function MatchCard({ match, index }: { match: any, index: number }) {
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
                <span className={`
          px-2 py-0.5 rounded-full text-[10px] font-bold
          ${match.status === 'live' ? 'bg-red-500/20 text-red-500 animate-pulse' : ''}
          ${match.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' : ''}
          ${match.status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}
          ${match.status === 'locked' ? 'bg-gray-700 text-gray-500' : ''}
        `}>
                    {match.status}
                </span>
            </div>

            {/* Players */}
            <div className="p-4 flex flex-col gap-3">
                <PlayerRow player={match.player1} isWinner={match.winner === match.player1.name} score={match.score.split(' - ')[0] || '-'} />
                <div className="h-[1px] w-full bg-[#333]"></div>
                <PlayerRow player={match.player2} isWinner={match.winner === match.player2.name} score={match.score.split(' - ')[1] || '-'} />
            </div>

            {/* Hover Effect Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </motion.div>
    )
}

function PlayerRow({ player, isWinner, score }: { player: any, isWinner: boolean, score: string }) {
    const isTBD = player.name === 'TBD'

    return (
        <div className={`flex items-center justify-between ${isWinner ? 'text-yellow-400' : 'text-gray-300'}`}>
            <div className="flex items-center gap-3">
                {player.avatar ? (
                    <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover border border-[#444]" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs text-gray-500">?</div>
                )}
                <div className="flex flex-col">
                    <span className={`font-medium ${isWinner ? 'font-bold' : ''} ${isTBD ? 'text-gray-600 italic' : ''}`}>
                        {player.name}
                    </span>
                    {!isTBD && <span className="text-[10px] text-gray-500">Rank #{player.rank}</span>}
                </div>
            </div>
            <span className={`text-lg font-mono ${isWinner ? 'text-yellow-400 font-bold' : 'text-gray-500'}`}>
                {score}
            </span>
        </div>
    )
}
