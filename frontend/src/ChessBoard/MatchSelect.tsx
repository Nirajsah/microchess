import React, { useState } from 'react'
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
  reqFriendlyGame,
  startGame,
  storage,
} from '@/api'
import { useWalletStore } from '@/store/wallet'

const MatchSelect = () => {
  type Step =
    | 'select'
    | 'random-loading'
    | 'random-assign'
    | 'friendly-loading'
    | 'friendly-share'
    | 'friendly-join'

  const fetchChainMetaData = async () => {
    try {
      const res = await getGameChainInfo()
      console.log(res, 'game chain info')
      const data = JSON.parse(res.result).data.gameChain
      console.log(data)
      if (!data) {
        storage.removeGameState()
        return
      }
      setChainMetaData({
        chainId: data.chainId,
        timestamp: data.timestamp,
      })
      setStep('random-assign')
      storage.setGameState('random-assign')
    } catch (error) {
      storage.removeGameState()
      console.error('Failed to start game:', error)
      setStep('select')
    }
  }

  const fetchGameHash = async () => {
    try {
      const res = await friendId()
      const data = JSON.parse(res.result).data.friendId
      setGameHash(data)
      setStep('friendly-share')
      storage.setGameState('friendly-share')
    } catch (error) {
      storage.removeGameState()
      setStep('select')
    }
  }

  const notification = useWalletStore((s) => s.notification)
  const assignChainAsync = useWalletStore((s) => s.assignChainAsync)

  const [chainMetaData, setChainMetaData] = React.useState<{
    chainId: string
    timestamp: number
  } | null>(null)
  const [step, setStep] = useState<Step>(() => {
    const savedStep = storage.getGameState()
    return (savedStep as Step) || 'select'
  })

  const [copied, setCopied] = useState(false)
  const [gameHash, setGameHash] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const hash = params.get('gamehash')
    return (hash as string) || ''
  })

  const [inputHash, setInputHash] = useState('')

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  React.useEffect(() => {
    if (step === 'random-loading' || step === 'friendly-loading') {
      storage.setGameState(step)
    } else if (step === 'select') {
      storage.removeGameState()
    }
  }, [step])

  React.useEffect(() => {
    const pendingStep = storage.getGameState() as Step

    if (pendingStep === 'random-loading' || pendingStep === 'random-assign') {
      fetchChainMetaData()
    } else if (pendingStep === 'friendly-loading') {
      fetchGameHash()
    } else if (pendingStep === 'friendly-share') {
      fetchChainMetaData()
    }
  }, [])

  const handleRandomMatch = async () => {
    try {
      setStep('random-loading')
      storage.setGameState('random-loading')
      await startGame()
    } catch (error) {
      storage.removeGameState()
      console.error('Failed to start game:', error)
      setStep('select')
    }
  }

  const handleFriendlyMatch = async () => {
    if (step !== 'select') return

    try {
      setStep('friendly-loading')
      storage.setGameState('friendly-loading')
      await reqFriendlyGame()
    } catch (error) {
      storage.removeGameState()
      console.error('Failed to start friendly game:', error)
      setStep('select')
    }
  }

  const handleJoinMatch = async () => {
    if (step !== 'friendly-join' || !inputHash.trim()) return

    try {
      setStep('random-loading')
      await gameWithToken(inputHash.trim())
      storage.setGameState('random-loading')
    } catch (error) {
      storage.removeGameState()
      console.error('Failed to join game:', error)
      setStep('select')
    }
  }

  React.useEffect(() => {
    if (step === 'random-loading') {
      fetchChainMetaData()
    }
    if (step === 'friendly-loading') {
      fetchGameHash()
    }
    if (step === 'friendly-share') {
      fetchChainMetaData()
    }
  }, [notification])

  const handleStart = () => {
    if (!chainMetaData) return
    try {
      assignChainAsync(chainMetaData)
      storage.removeGameState()
    } catch (e) {
      console.log(e)
    }
  }

  const handleDeleteMetadata = () => {
    if (!chainMetaData) return
    try {
      deleteInfo()
      storage.removeGameState()
    } catch (e) {
      console.log(e)
    }
  }

  const BackToMenu = ({
    setStep,
  }: {
    setStep: React.Dispatch<React.SetStateAction<any>>
  }) => {
    return (
      <button
        onClick={() => {
          setStep('select')
        }}
        className="relative z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all cursor-pointer pointer-events-auto"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to menu</span>
      </button>
    )
  }

  const handleCancel = () => {
    setStep('select')
    storage.removeGameState()
  }
  return (
    <div className="h-full w-full mx-auto">
      {/* Selection Screen */}
      {step === 'select' && (
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
              onClick={handleRandomMatch}
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
                      Get matched with players. Compete to improve your ELO
                      rating and climb the leaderboard.
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
              onClick={handleFriendlyMatch}
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
            onClick={() => setStep('friendly-join')}
            className="w-full group relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 p-6 text-center transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="flex items-center justify-center gap-3">
              <Hash className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">
                Join with Game Hash
              </span>
            </div>
            <p className="text-zinc-500 text-sm mt-2">
              Already have an invitation code? Enter it here
            </p>
          </button>
        </div>
      )}

      {/* Random Match Loading */}
      {step === 'random-loading' && (
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
          <button
            onClick={handleCancel}
            className="text-orange-400 hover:scale-105"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Random Match - Assign Required */}
      {step === 'random-assign' && chainMetaData && (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-[400px]">
          <BackToMenu setStep={setStep} />

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
                  {chainMetaData?.chainId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Timestamp:</span>
                <span className="text-white font-mono">
                  {chainMetaData?.timestamp}
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
      )}

      {/* Friendly Match Loading */}
      {step === 'friendly-loading' && (
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
            <p className="text-zinc-400">Setting up your friendly match</p>
          </div>

          <button
            onClick={handleCancel}
            className="text-orange-400 hover:scale-105"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Friendly Match - Share Hash */}
      {step === 'friendly-share' && gameHash && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <BackToMenu setStep={setStep} />

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
                    `${window.location.origin}/chess?gamehash=${gameHash}`
                  )
                }
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                <span>{copied ? 'Link Copied!' : 'Copy Invitation Link'}</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-zinc-500 text-sm">
                Waiting for your friend to join...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Join with Hash */}
      {step === 'friendly-join' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <BackToMenu setStep={setStep} />

          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-4 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                Join Friendly Match
              </h3>
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
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                  placeholder="Enter game hash..."
                  className="w-full bg-zinc-900/80 border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-4 text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              <button
                onClick={handleJoinMatch}
                disabled={!inputHash.trim()}
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
      )}
    </div>
  )
}

export default MatchSelect
