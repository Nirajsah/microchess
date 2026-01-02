import React from 'react'
import {
  Shuffle,
  Users,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Hash,
  Play,
  ArrowLeft,
} from 'lucide-react'
import {
  deleteInfo,
  friendId,
  gameWithToken,
  getGameChainInfo,
  startGame,
  storage,
} from '@/api'
import { useWalletStore } from '@/store/wallet'
import { useSearchParams } from 'react-router-dom'

const MatchSelect = () => {
  type MatchState =
    | { status: 'idle' }
    | { status: 'random.loading' }
    | { status: 'random.ready'; chainId: string }
    | { status: 'friendly.loading' }
    | { status: 'friendly.share'; gameHash: string }
    | { status: 'friendly.join' }

  type Event =
    | { type: 'START_RANDOM' }
    | { type: 'RANDOM_ASSIGNED'; chainId: string }
    | { type: 'START_FRIENDLY' }
    | { type: 'FRIENDLY_READY'; gameHash: string }
    | { type: 'JOIN_FRIENDLY' }
    | { type: 'RESET' }

  function reducer(state: MatchState, event: Event): MatchState {
    switch (event.type) {
      case 'START_RANDOM':
        return { status: 'random.loading' }

      case 'RANDOM_ASSIGNED':
        return {
          status: 'random.ready',
          chainId: event.chainId,
        }

      case 'START_FRIENDLY':
        return { status: 'friendly.loading' }

      case 'FRIENDLY_READY':
        return {
          status: 'friendly.share',
          gameHash: event.gameHash,
        }

      case 'JOIN_FRIENDLY':
        return { status: 'friendly.join' }

      case 'RESET':
        return { status: 'idle' }

      default:
        return state
    }
  }

  const notification = useWalletStore((s) => s.notification)
  const ready = useWalletStore((s) => s.ready)
  const refetch = useWalletStore((s) => s.refetch)

  let saved = storage.getGameState()
  if (saved === 'friendly.share' || saved === 'random.ready') {
    saved = 'idle'
  }
  const initial: MatchState = { status: saved ? (saved as any) : 'idle' }

  const [state, dispatch] = React.useReducer(reducer, initial)
  const [searchParams] = useSearchParams()

  React.useEffect(() => {
    storage.setGameState(state.status)
  }, [state])

  React.useEffect(() => {
    const hash = searchParams.get('gamehash') || ''
    if (hash.length > 0) {
      dispatch({ type: 'JOIN_FRIENDLY' })
    }
  }, [])

  const back = () => {
    dispatch({ type: 'RESET' })
  }

  const startRandom = async () => {
    if (ready) {
      dispatch({ type: 'START_RANDOM' })
      await startGame()
    }
  }

  // fetch gameChainInfo(chainId, timestamp)
  const fetchGameChainInfo = async () => {
    const chain = await getGameChainInfo()
    console.log('getting game chain', chain)
    const data = JSON.parse(chain).data.gameChain
    if (data) {
      dispatch({ type: 'RANDOM_ASSIGNED', chainId: data })
    }
  }

  // this is FriendId passed to friend to start a friendly match
  const getPersonalId = async () => {
    if (ready) {
      dispatch({ type: 'START_FRIENDLY' })
    }
    await friendId()
      .then((chain) => {
        const data = JSON.parse(chain).data.friendId
        if (data) {
          dispatch({ type: 'FRIENDLY_READY', gameHash: data })
        }
      })
      .catch((e) => {
        console.log(e)
        dispatch({ type: 'RESET' })
      })
  }

  const JoinWithHash = () => {
    dispatch({ type: 'JOIN_FRIENDLY' })
  }

  const handleCancel = () => {
    dispatch({ type: 'RESET' })
  }

  React.useEffect(() => {
    if (state.status === 'random.loading') {
      fetchGameChainInfo()
    }
    if (state.status === 'friendly.loading') {
      getPersonalId()
    }
  }, [state.status, notification, refetch])

  React.useEffect(() => {
    if (state.status === 'friendly.share' || state.status === 'friendly.join') {
      fetchGameChainInfo()
    }
    if (state.status === 'friendly.loading') {
      getPersonalId()
    }
  }, [notification, refetch, state.status])

  return (
    <div className="h-full w-full mx-auto">
      {state.status === 'idle' && (
        <MatchTypeSelection
          requestRandom={startRandom}
          requestFriendly={getPersonalId}
          JoinWithHash={JoinWithHash}
        />
      )}

      {state.status === 'random.loading' && (
        <RandomLoading cancel={handleCancel} />
      )}
      {state.status === 'random.ready' && (
        <RandomAssignScreen chainId={state.chainId} back={back} />
      )}
      {state.status === 'friendly.loading' && (
        <FriendlyLoading cancel={handleCancel} />
      )}
      {state.status === 'friendly.share' && (
        <FriendlyShare gameHash={state.gameHash} back={back} />
      )}
      {state.status === 'friendly.join' && <FriendlyJoin back={back} />}
    </div>
  )
}

export default MatchSelect

const BackToMenu = ({ back }: any) => {
  return (
    <button
      onClick={back}
      className="relative z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all cursor-pointer pointer-events-auto"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back to menu</span>
    </button>
  )
}

function MatchTypeSelection({
  requestRandom,
  requestFriendly,
  JoinWithHash,
}: any) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2 mb-5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl mr-6 font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
            Start New Game
          </h1>
        </div>
        <p className="text-zinc-400 text-lg">Choose your battle mode</p>
      </div>

      {/* Match Type Cards */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* Random Match Card */}
        <button
          onClick={requestRandom}
          // onClick={handleRandomMatch}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/50 p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative space-y-4 justify-between flex flex-col h-full">
            <div>
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shuffle className="w-6 h-6 text-blue-400" />
              </div>

              <div className="align-start mt-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  Ranked Match
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Get matched with players. Compete to improve your ELO rating
                  and climb the leaderboard.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium pt-2">
              <span>Start Playing</span>
              <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        {/* Friendly Match Card */}
        <button
          onClick={requestFriendly}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-400/50 p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative space-y-4 flex justify-between flex-col h-full">
            <div>
              <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-green-400" />
              </div>

              <div className="align-start mt-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  Friendly Match
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Invite a friend. Perfect for casual play without affecting
                  your rank.
                </p>
              </div>
            </div>

            <div className="flex gap-2 text-green-400 text-sm font-medium pt-2">
              <span>Create Room</span>
              <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      {/* Join with Hash */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 text-zinc-500"></span>
        </div>
      </div>

      <button
        onClick={JoinWithHash}
        className="w-full group relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 p-6 text-center transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="flex items-center justify-center gap-3">
          <Hash className="w-5 h-5 text-purple-400" />
          <span className="text-white font-medium">Join with Game Hash</span>
        </div>
        <p className="text-zinc-500 text-sm mt-2">
          Already have an invitation code? Enter it here
        </p>
      </button>
    </div>
  )
}

function RandomLoading({ cancel }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300 py-12">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Finding Opponent...
        </h3>
        <p className="text-zinc-400">
          Searching for players at your skill level
        </p>
      </div>
      <button onClick={cancel} className="text-orange-400 hover:scale-105">
        Cancel
      </button>
    </div>
  )
}

function RandomAssignScreen({ chainId, timestamp, back }: any) {
  const assignChain = useWalletStore((s) => s.assignChainAsync)
  const handleStart = async () => {
    try {
      const res = await assignChain(chainId)
      back() // just to reset the state
      // if (res.success) {
      //   window.location.reload()
      // }
    } catch (e) {
      console.log(e)
    }
  }

  const handleDeleteMetadata = () => {
    try {
      deleteInfo()
      back() // just to reset the state
    } catch (e) {
      console.log(e)
    }
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-[400px]">
      <BackToMenu back={back} />

      <div className="rounded-2xl bg-blue-500/10 border-blue-500/20 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">Match Found!</h3>
          <p className="text-zinc-400">Confirm to start the game</p>
        </div>

        <div className="bg-zinc-900/50 rounded-xl p-6 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-white font-mono truncate">
              <span className="text-zinc-400 text-sm">ChainId: </span>
              {chainId}
            </span>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full cursor-pointer bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/50"
        >
          Confirm & Start Game
        </button>

        <button
          onClick={handleDeleteMetadata}
          className="w-full cursor-pointer text-white font-semibold underline hover:scale-105 antialiased"
        >
          Delete this Chain Info
        </button>
      </div>
    </div>
  )
}

function FriendlyLoading({ cancel }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300 py-12">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Creating Private Room...
        </h3>
        <p className="text-zinc-400">
          If you're seeing this, Update Your Name..
        </p>
      </div>

      <button onClick={cancel} className="text-orange-400 hover:scale-105">
        Cancel
      </button>
    </div>
  )
}

function FriendlyShare({ gameHash, back }: any) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackToMenu back={back} />

      <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-4 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">Room Created!</h3>
          <p className="text-zinc-400">
            Share this code with your friend to start playing
          </p>
        </div>

        {/* Game Hash Display */}
        <div className="space-y-4">
          <label className="text-zinc-400 text-sm font-medium block">
            Game Hash
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-zinc-800/50 rounded-lg px-4 max-w-[300px] py-3 border border-zinc-700">
              <div className="text-white w-full overflow-hidden whitespace-nowrap font-mono text-lg tracking-wider truncate">
                {gameHash}
              </div>
            </div>

            <button
              onClick={() => handleCopy(gameHash)}
              className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 flex items-center justify-center transition-all hover:scale-110"
              title="Copy hash"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-green-400" />
              )}
            </button>
          </div>

          {/* Copy Link Button */}
          <button
            onClick={() =>
              handleCopy(`${window.location.origin}/chess?gamehash=${gameHash}`)
            }
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            {/* <span>{copied ? 'Link Copied!' : 'Copy Invitation Link'}</span> */}
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-zinc-500 text-sm">
            Waiting for your friend to join...
          </p>
        </div>
      </div>
    </div>
  )
}

function FriendlyJoin({ back }: any) {
  const [gameHash, setGameHash] = React.useState('')
  const [searchParams] = useSearchParams()

  React.useEffect(() => {
    const hash = searchParams.get('gamehash') || ''
    setGameHash(hash)
  }, [])

  // starts a friendly match using the friends hash
  const invokeFriendlyMatch = async (hash: string) => {
    await gameWithToken(hash)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackToMenu back={back} />

      <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Hash className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">Join Friendly Match</h3>
          <p className="text-zinc-400">
            Enter the game hash you received from your friend
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium block">
              Game Hash
            </label>
            <input
              type="text"
              value={gameHash}
              onChange={(e) => setGameHash(e.target.value)}
              placeholder="Enter game hash..."
              className="w-full bg-zinc-900/80 border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-4 text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <button
            onClick={() => invokeFriendlyMatch(gameHash.trim())}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            <span>Join Game</span>
          </button>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-2">
          <p className="text-purple-300 text-sm text-center">
            💡 Ask your friend for the game hash or invitation link
          </p>
        </div>
      </div>
    </div>
  )
}
