import React from 'react'
import {
  Users,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Hash,
  Play,
  ArrowLeft,
  Shuffle,
} from 'lucide-react'
import {
  decodeWagerToken,
  deleteInfo,
  friendId,
  gameWithToken,
  generateWagerToken,
  getGameChainInfo,
  joinWager,
  startGame,
  storage,
} from '@/api'
import { useWalletStore } from '@/store/wallet'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

const MatchSelect = () => {
  type MatchState =
    | { status: 'idle' }
    | { status: 'random.loading' }
    | { status: 'random.ready'; chainId: string }
    | { status: 'friendly.loading' }
    | { status: 'friendly.share'; gameHash: string }
    | { status: 'friendly.join' }
    | { status: 'friendly.joining' }
    | { status: 'wager.input' }
    | { status: 'wager.loading' }
    | { status: 'wager.share'; token: string; amount: string }
    | { status: 'wager.join' }
    | { status: 'wager.joining' }

  type Event =
    | { type: 'START_RANDOM' }
    | { type: 'RANDOM_ASSIGNED'; chainId: string }
    | { type: 'START_FRIENDLY' }
    | { type: 'FRIENDLY_READY'; gameHash: string }
    | { type: 'JOIN_FRIENDLY' }
    | { type: 'START_JOINING_FRIENDLY' }
    | { type: 'START_WAGER' }
    | { type: 'WAGER_LOADING' }
    | { type: 'WAGER_CREATED'; token: string; amount: string }
    | { type: 'JOIN_WAGER' }
    | { type: 'START_JOINING_WAGER' }
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

      case 'START_JOINING_FRIENDLY':
        return { status: 'friendly.joining' }

      case 'START_WAGER':
        return { status: 'wager.input' }

      case 'WAGER_LOADING':
        return { status: 'wager.loading' }

      case 'WAGER_CREATED':
        return {
          status: 'wager.share',
          token: event.token,
          amount: event.amount,
        }

      case 'JOIN_WAGER':
        return { status: 'wager.join' }

      case 'START_JOINING_WAGER':
        return { status: 'wager.joining' }

      case 'RESET':
        return { status: 'idle' }

      default:
        return state
    }
  }

  const notification = useWalletStore((s) => s.notification)
  const ready = useWalletStore((s) => s.ready)
  // const refetch = useWalletStore((s) => s.refetch)

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

  // Track whether we've received a notification after starting the game
  const [awaitingNotification, setAwaitingNotification] = React.useState(false)
  const notificationCountRef = React.useRef(0)

  const back = () => {
    dispatch({ type: 'RESET' })
    setAwaitingNotification(false)
  }

  const startRandom = async () => {
    if (ready) {
      dispatch({ type: 'START_RANDOM' })
      // Store current notification - we'll wait for a new one
      notificationCountRef.current = notification
      setAwaitingNotification(true)
      await startGame()
    }
  }

  // Simple fetch with retry until we get a valid game_chain
  const fetchGameChainInfo = async (retryCount = 0, maxRetries = 10) => {
    try {
      const chain = await getGameChainInfo()
      const data = JSON.parse(chain).data.gameChain

      if (data) {
        dispatch({ type: 'RANDOM_ASSIGNED', chainId: data })
      } else if (retryCount < maxRetries) {
        setTimeout(() => fetchGameChainInfo(retryCount + 1, maxRetries), 1000)
      }
    } catch (e) {
      if (retryCount < maxRetries) {
        setTimeout(() => fetchGameChainInfo(retryCount + 1, maxRetries), 1000)
      }
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
          notificationCountRef.current = notification
          setAwaitingNotification(true)
          dispatch({ type: 'FRIENDLY_READY', gameHash: data })
        }
      })
      .catch(() => {
        dispatch({ type: 'RESET' })
      })
  }



  const handleJoinFriendly = async (hash: string) => {
    if (ready) {
      dispatch({ type: 'START_JOINING_FRIENDLY' })
      try {
        await gameWithToken(hash)
        notificationCountRef.current = notification
        setAwaitingNotification(true)
      } catch (e) {
        console.error(e)
        // Optionally handle error state here
        dispatch({ type: 'RESET' })
      }
    }
  }

  const handleCancel = () => {
    dispatch({ type: 'RESET' })
    setAwaitingNotification(false)
  }

  const handleCreateWager = async (amount: string) => {
    dispatch({ type: 'WAGER_LOADING' })
    try {
      // Generate wager token (this also schedules the CreateWager operation)
      const res = await generateWagerToken(amount)
      const data = JSON.parse(res)
      const token = data.data.generateWagerToken

      if (!token) {
        console.error('Failed to generate wager token')
        toast.error('Failed to generate wager token, make sure to update your name')
        dispatch({ type: 'RESET' })
        return
      }

      // Go to share screen with the token
      dispatch({ type: 'WAGER_CREATED', token, amount })

      // Start waiting for opponent to join
      notificationCountRef.current = notification
      setAwaitingNotification(true)
    } catch (e) {
      console.error(e)
      dispatch({ type: 'RESET' })
    }
  }

  const handleJoinWager = async (hash: string) => {
    dispatch({ type: 'START_JOINING_WAGER' })
    try {
      await joinWager(hash)
      notificationCountRef.current = notification
      setAwaitingNotification(true)
    } catch (e) {
      console.error(e)
      toast.error('Failed to join wager, make sure to update your name')
      dispatch({ type: 'RESET' })
    }
  }

  // When notification arrives and we're in loading state, start fetching
  React.useEffect(() => {
    if (
      (state.status === 'random.loading' ||
        state.status === 'friendly.share' ||
        state.status === 'friendly.joining' ||
        state.status === 'wager.share' ||
        state.status === 'wager.joining') &&
      awaitingNotification &&
      notification &&
      notification !== notificationCountRef.current
    ) {
      notificationCountRef.current = notification
      fetchGameChainInfo()
    }
  }, [notification, state.status, awaitingNotification])

  // For friendly matches
  React.useEffect(() => {
    if (state.status === 'friendly.loading') {
      getPersonalId()
    }
  }, [state.status])

  // Fetch game_chain when notification arrives for friendly flows


  return (
    <div className="h-full w-full mx-auto">
      {state.status === 'idle' && (
        <MatchTypeSelection
          requestRandom={startRandom}
          requestFriendly={() => dispatch({ type: 'START_FRIENDLY' })}
          requestWager={() => dispatch({ type: 'START_WAGER' })}
          joinWager={() => dispatch({ type: 'JOIN_WAGER' })}
          JoinWithHash={() => dispatch({ type: 'JOIN_FRIENDLY' })}
        />
      )}

      {state.status === 'random.loading' && (
        <RandomLoading cancel={handleCancel} retry={startRandom} />
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
      {state.status === 'friendly.join' && (
        <FriendlyJoin back={back} onJoin={handleJoinFriendly} />
      )}
      {state.status === 'friendly.joining' && (
        <FriendlyLoading cancel={handleCancel} text="Joining Game..." />
      )}

      {/* Wager States */}
      {state.status === 'wager.input' && (
        <WagerInput back={back} onCreateWager={handleCreateWager} />
      )}
      {state.status === 'wager.loading' && (
        <WagerLoading cancel={handleCancel} />
      )}
      {state.status === 'wager.share' && (
        <WagerShare token={state.token} amount={state.amount} back={back} />
      )}
      {state.status === 'wager.join' && (
        <WagerJoin back={back} onJoin={handleJoinWager} />
      )}
      {state.status === 'wager.joining' && (
        <WagerLoading cancel={handleCancel} text="Joining Wager Match..." />
      )}
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
  requestWager,
  joinWager,
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

      {/* Wager Match */}
      <button
        onClick={requestWager}
        className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 p-6 text-left transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <div className="text-2xl">💰</div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Wager Match</h3>
            <p className="text-zinc-400 text-sm">
              Bet tokens against opponents
            </p>
          </div>
        </div>
      </button>

      {/* Join with Hash */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 text-zinc-500">Or join existing</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={JoinWithHash}
          className="w-full group relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 p-4 text-center transition-all duration-300 hover:scale-[1.01]"
        >
          <div className="flex flex-col items-center gap-2">
            <Hash className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium text-sm">Friendly</span>
          </div>
        </button>

        <button
          onClick={joinWager}
          className="w-full group relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/50 p-4 text-center transition-all duration-300 hover:scale-[1.01]"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl">💰</div>
            <span className="text-white font-medium text-sm">Wager</span>
          </div>
        </button>
      </div>
    </div>
  )
}

function RandomLoading({ cancel, retry }: any) {
  const [timeLeft, setTimeLeft] = React.useState(60)
  const [timedOut, setTimedOut] = React.useState(false)

  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setTimedOut(true)
    }
  }, [timeLeft])

  const handleRetry = () => {
    setTimeLeft(60)
    setTimedOut(false)
    retry()
  }

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300 py-12">
      {!timedOut ? (
        <>
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
              Searching for players at your skill level ({timeLeft}s)
            </p>
          </div>
          <button onClick={cancel} className="text-orange-400 hover:scale-105">
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Request Timed Out
            </h3>
            <p className="text-zinc-400 max-w-xs mx-auto">
              No opponent found within 60 seconds. Please try again.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={cancel}
              className="text-white hover:text-zinc-300 px-4 py-2"
            >
              Back
            </button>
            <button
              onClick={handleRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function RandomAssignScreen({ chainId, back }: any) {
  const assignChain = useWalletStore((s) => s.assignChainAsync)
  const handleStart = async () => {
    try {
      await assignChain(chainId)
      back() // just to reset the state
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

function FriendlyLoading({ cancel, text }: any) {
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
          {text || 'Creating Private Room...'}
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
              handleCopy(
                `${window.location.origin}/chess?gamehash=${encodeURIComponent(
                  gameHash
                )}`
              )
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

function FriendlyJoin({ back, onJoin }: any) {
  const [gameHash, setGameHash] = React.useState('')
  const [searchParams] = useSearchParams()

  React.useEffect(() => {
    // Handle cases where + was replaced by space in URL
    const rawHash = searchParams.get('gamehash') || ''
    const hash = rawHash.replace(/ /g, '+')
    setGameHash(hash)
  }, [])

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
            onClick={() => {
              const sanitized = gameHash.trim().replace(/ /g, '+')
              onJoin(sanitized)
            }}
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

function WagerInput({ onCreateWager, back }: any) {
  const [amount, setAmount] = React.useState('10')

  const presetAmounts = ['5', '10', '25', '50', '100']

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <div className="text-3xl">💰</div>
          </div>
          <h3 className="text-2xl font-bold text-white">Create Wager Match</h3>
          <p className="text-zinc-400">
            Set your wager amount and challenge an opponent
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium block">
              Wager Amount (tokens)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full bg-zinc-900/80 border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-4 text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-2xl text-center"
            />
          </div>

          {/* Quick Amount Presets */}
          <div className="flex gap-2 justify-center flex-wrap">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${amount === preset
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={() => onCreateWager(amount)}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create Wager Match</span>
          </button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
          <p className="text-amber-300 text-sm text-center">
            💡 Winner takes both players' wagers
          </p>
        </div>
      </div>

      <BackToMenu back={back} />
    </div>
  )
}

function WagerJoin({ onJoin, back }: any) {
  const [token, setToken] = React.useState('')
  const [tokenDetails, setTokenDetails] = React.useState<{
    amount: string
    isValid: boolean
    isExpired: boolean
  } | null>(null)

  // Decode token when user pastes it
  React.useEffect(() => {
    if (!token.trim()) {
      setTokenDetails(null)
      return
    }

    const decoded = decodeWagerToken(token.trim())
    if (decoded) {
      const now = Date.now() * 1000 // Convert to micros
      const isExpired = now > decoded.expires_at.micros
      setTokenDetails({
        amount: decoded.amount,
        isValid: true,
        isExpired,
      })
    } else {
      setTokenDetails({ amount: '', isValid: false, isExpired: false })
    }
  }, [token])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <div className="text-3xl">💰</div>
          </div>
          <h3 className="text-2xl font-bold text-white">Join Wager Match</h3>
          <p className="text-zinc-400">
            Paste the wager token shared by your opponent
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium block">
              Wager Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste wager token here..."
              className="w-full bg-zinc-900/80 border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-4 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* Token Details Display */}
          {tokenDetails && tokenDetails.isValid && (
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Wager Amount</span>
                <span className="text-amber-400 font-bold text-lg">{tokenDetails.amount} tokens</span>
              </div>
              {tokenDetails.isExpired && (
                <p className="text-red-400 text-sm mt-2">⚠️ This wager token has expired</p>
              )}
            </div>
          )}

          {tokenDetails && !tokenDetails.isValid && token.trim() && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-sm text-center">Invalid wager token</p>
            </div>
          )}

          <button
            onClick={() => onJoin(token.trim())}
            disabled={!tokenDetails?.isValid || tokenDetails?.isExpired}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            <span>Join Wager Match</span>
          </button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
          <p className="text-amber-300 text-sm text-center">
            ⚠️ Make sure you have sufficient balance for the wager
          </p>
        </div>
      </div>

      <BackToMenu back={back} />
    </div>
  )
}

function WagerLoading({ cancel, text }: { cancel: () => void; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300 py-12">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {text || 'Creating Wager Lobby...'}
        </h3>
        <p className="text-zinc-400">
          Setting up your wager match
        </p>
      </div>

      <button onClick={cancel} className="text-orange-400 hover:scale-105 hover:text-orange-300 transition-all">
        Cancel
      </button>
    </div>
  )
}

function WagerShare({ token, amount, back }: { token: string; amount: string; back: () => void }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackToMenu back={back} />

      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <div className="text-3xl">💰</div>
          </div>
          <h3 className="text-2xl font-bold text-white">Wager Created!</h3>
          <p className="text-zinc-400">
            Share this wager token with your opponent
          </p>
        </div>

        {/* Amount Display */}
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Wager Amount</span>
            <span className="text-amber-400 font-bold text-lg">{amount} tokens</span>
          </div>
        </div>

        {/* Wager Token Display */}
        <div className="space-y-2">
          <label className="text-zinc-400 text-sm font-medium block">
            Wager Token
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-zinc-800/50 rounded-lg px-3 py-3 border border-zinc-700">
              <div className="text-white font-mono text-xs truncate" title={token}>
                {(token || '').length > 40 ? `${(token || '').slice(0, 20)}...${(token || '').slice(-20)}` : (token || '')}
              </div>
            </div>

            <button
              onClick={() => handleCopy(token || '')}
              className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 flex items-center justify-center transition-all hover:scale-105"
              title="Copy wager token"
            >
              {copied ? (
                <Check className="w-4 h-4 text-amber-400" />
              ) : (
                <Copy className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
          <p className="text-zinc-500 text-xs">Click copy to share the full token with your opponent</p>
        </div>

        <div className="text-center pt-2">
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Waiting for opponent to join...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
