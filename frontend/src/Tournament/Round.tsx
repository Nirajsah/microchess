import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

/* ---------------- MOCK DATA (SWISS STYLE) ---------------- */

const rounds = [
  {
    id: 1,
    name: 'Round 1',
    matches: [
      {
        id: 'r1m1',
        player1: { name: 'Magnus Carlsen', rank: 1 },
        player2: { name: 'Hikaru Nakamura', rank: 2 },
        status: 'completed',
        score: '1 - 0',
        winner: 'Magnus Carlsen',
      },
      {
        id: 'r1m2',
        player1: { name: 'Fabiano Caruana', rank: 3 },
        player2: { name: 'Ian Nepomniachtchi', rank: 4 },
        status: 'completed',
        score: '0 - 1',
        winner: 'Ian Nepomniachtchi',
      },
      {
        id: 'r1m3',
        player1: { name: 'Ding Liren', rank: 5 },
        player2: { name: 'Alireza Firouzja', rank: 6 },
        status: 'scheduled',
        score: 'vs',
        winner: null,
      },
    ],
  },
  {
    id: 2,
    name: 'Round 2',
    matches: [
      {
        id: 'r2m1',
        player1: { name: 'Magnus Carlsen', rank: 1 },
        player2: { name: 'Ian Nepomniachtchi', rank: 4 },
        status: 'scheduled',
        score: 'vs',
        winner: null,
      },
      {
        id: 'r2m2',
        player1: { name: 'Hikaru Nakamura', rank: 2 },
        player2: { name: 'Fabiano Caruana', rank: 3 },
        status: 'scheduled',
        score: 'vs',
        winner: null,
      },
    ],
  },
]

/* ---------------- MAIN COMPONENT ---------------- */

export default function Round({ tournamentId }: { tournamentId: string }) {
  // fetch matches here from supabase
  // if 0 matches return no matches yet
  return (
    <div className="min-h-screen w-full bg-[#161616] text-white px-4 py-8">
      <div className="max-w-4xl flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Swiss Tournament Rounds
        </h1>

        {rounds.map((round) => (
          <SwissRound key={round.id} round={round} />
        ))}
      </div>
    </div>
  )
}

/* ---------------- ROUND ACCORDION ---------------- */

function SwissRound({ round }: { round: any }) {
  const [open, setOpen] = useState(false)

  const completed = round.matches.filter((m: any) => m.status === 'completed')
  const scheduled = round.matches.filter((m: any) => m.status === 'scheduled')

  return (
    <div className="border border-[#333] rounded-xl bg-[#1f1f1f] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#262626] transition"
      >
        <div>
          <div className="text-sm uppercase tracking-wide text-gray-400">
            {round.name}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {completed.length} completed · {scheduled.length} scheduled
          </div>
        </div>

        <ChevronDown
          className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-[#333]"
          >
            <div className="p-4 flex flex-col gap-4">
              {round.matches.map((match: any, index: number) => (
                <MatchCard key={match.id} match={match} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------- MATCH CARD ---------------- */

function MatchCard({ match, index }: { match: any; index: number }) {
  const isCompleted = match.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-lg border border-[#333] bg-[#262626] p-4 flex flex-col gap-3 ${
        isCompleted ? 'opacity-70' : ''
      }`}
    >
      <div className="flex justify-between items-center text-xs uppercase text-gray-500">
        <span>Match</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            match.status === 'completed'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {match.status}
        </span>
      </div>

      <PlayerRow
        player={match.player1}
        isWinner={match.winner === match.player1.name}
        score={match.score.split(' - ')[0] || '–'}
      />

      <div className="h-px bg-[#333]" />

      <PlayerRow
        player={match.player2}
        isWinner={match.winner === match.player2.name}
        score={match.score.split(' - ')[1] || '–'}
      />
    </motion.div>
  )
}

/* ---------------- PLAYER ROW ---------------- */

function PlayerRow({
  player,
  isWinner,
  score,
}: {
  player: any
  isWinner: boolean
  score: string
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        isWinner ? 'text-yellow-400 font-bold' : 'text-gray-300'
      }`}
    >
      <div className="flex flex-col">
        <span>{player.name}</span>
        <span className="text-xs text-gray-500">Rank #{player.rank}</span>
      </div>

      <span className="font-mono text-lg">{score}</span>
    </div>
  )
}
