import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/utils'
import { useWalletStore } from '@/store/wallet'
import { useNavigate } from 'react-router-dom'

/* ---------------- MOCK DATA (SWISS STYLE) ---------------- */



/* ---------------- MAIN COMPONENT ---------------- */

type Round = {
  id: string
  round: number
}

export default function Round({ tournamentId }: { tournamentId: string }) {
  const [rounds, setRounds] = useState<Round[]>([])

  useEffect(() => {
    async function getRounds() {
      const { data: rounds } = await supabase.from('tournament_round_v2')
        .select('id, round')
        .eq('tournament_id', tournamentId)

      if (!rounds) return
      setRounds(rounds)
    }
    getRounds()

    const channel_rounds = supabase
      .channel('rounds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_round_v2',
        },
        () => {
          getRounds()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel_rounds)
    }
  }, [tournamentId])

  return (
    <div className="w-full bg-[#161616] text-white py-8">
      {rounds.length === 0 ? (
        <h1 className="text-md font-thin text-center text-gray-500 tracking-tight">
          Not Started
        </h1>
      ) : (
        <div className="w-full flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Swiss Tournament Rounds
          </h1>

          {rounds.map((round: Round) => (
            <SwissRound key={round.id} round={round} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- ROUND ACCORDION ---------------- */


type Participant = {
  id: string
  player_name: string
  player_elo: number
  player_matches: number
  player_ath: number
}

type Match = {
  id: string
  match_id: number
  player_a: string
  player_b: string
  status: string
  winner: string | null
  game_chain: string
  player_a_participant: Participant | null
  player_b_participant: Participant | null
}

function SwissRound({ round }: { round: Round }) {
  const [open, setOpen] = useState(false)

  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    async function getMatchesForRound() {
      const { data, error } = await supabase
        .from('tournament_matches_v2')
        .select(`
          id,
          match_id,
          player_a,
          player_b,
          status,
          winner,
          game_chain,

          player_a_participant: tournament_participants_v2!match_player_a_fkey (
            id,
            player_name,
            player_elo,
            player_matches,
            player_ath
          ),

        player_b_participant: tournament_participants_v2!match_player_b_fkey (
          id,
          player_name,
          player_elo,
          player_matches,
          player_ath
        )
        `)
        .eq('round_id', round.id)
        .order('match_id', { ascending: true })

      if (error) {
        console.error(error)
        return
      }
      const normalized: Match[] = (data as unknown as Match[] | null)?.map((m) => ({
        ...m,
        player_a_participant: m.player_a_participant ?? null,
        player_b_participant: m.player_b_participant ?? null,
      })) ?? []

      setMatches(normalized)
    }

    getMatchesForRound()

    const channel_rounds = supabase
      .channel('rounds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches_v2',
        },
        () => {
          getMatchesForRound()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel_rounds)
    }
  }, [])

  const completed = matches.filter((m: any) => m.status === 'COMPLETED')
  const scheduled = matches.filter((m: any) => m.status === 'SCHEDULED')

  return (
    <div className="border border-[#333] rounded-xl bg-[#1f1f1f] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#262626] transition"
      >
        <div>
          <div className="text-sm uppercase tracking-wide text-gray-400">
            Round {round.round}
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
              {matches.map((match: any, index: number) => (
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

function MatchCard({ match, index }: { match: Match; index: number }) {
  const isCompleted = match.status === 'completed'
  const participant_a = match.player_a_participant as Participant;
  const participant_b = match.player_b_participant as Participant;
  const publicKey = useWalletStore((s) => s.pubKey)
  const assignAsync = useWalletStore((s) => s.assignChainAsync)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const navigate = useNavigate()

  async function handleAssign(chain: string) {
    await assignAsync(chain).then(() => navigate(`/chess`))
  }

  function handleConfirm() {
    setShowConfirmModal(false)
    handleAssign(match.game_chain)
  }

  return (
    <>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Start Match</h3>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed">
                  You are about to join this match. This will assign the game chain to your wallet and navigate you to the chess game.
                </p>

                <div className="bg-[#262626] rounded-lg p-3 border border-[#333]">
                  <div className="text-xs text-gray-500 uppercase mb-1">Game Chain</div>
                  <div className="text-xs text-gray-300 font-mono truncate">
                    {match.game_chain}
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[#333] text-gray-400 hover:bg-[#262626] transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition font-bold text-sm"
                  >
                    Confirm & Play
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`rounded-lg border border-[#333] bg-[#262626] p-4 flex flex-col gap-3 ${isCompleted ? 'opacity-70' : ''
          }`}
      >
        <div className="flex justify-between items-center text-xs uppercase text-gray-500">
          <span>Match</span>

          <div className="flex items-center gap-2">
            {(match.player_a === publicKey || match.player_b === publicKey) && (
              <button onClick={() => setShowConfirmModal(true)} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition">
                Assign
              </button>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${match.status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
                }`}
            >
              {match.status}
            </span>
          </div>
        </div>

        <PlayerRow
          participant={participant_a}
          isWinner={match.winner === participant_a?.player_name}
          score={'–'}
        />

        <div className="h-px bg-[#333]" />

        <PlayerRow
          participant={participant_b}
          isWinner={match.winner === participant_b?.player_name}
          score={'–'}
        />
      </motion.div>
    </>
  )
}

/* ---------------- PLAYER ROW ---------------- */

function PlayerRow({
  participant,
  isWinner,
  score,
}: {
  participant: Participant | undefined
  isWinner: boolean
  score: string
}) {
  return (
    <div
      className={`flex items-center justify-between ${isWinner ? 'text-yellow-400 font-bold' : 'text-gray-300'
        }`}
    >
      <div className="flex flex-col gap-0.5">
        <span>{participant?.player_name?.toUpperCase()}</span>
        <span className="text-sm text-gray-500">{participant?.id}</span>
        <span className="text-xs text-gray-500">Rank #{participant?.player_ath}</span>
      </div>

      {/* <span className="font-mono text-lg">{score}</span> */}
    </div>
  )
}
