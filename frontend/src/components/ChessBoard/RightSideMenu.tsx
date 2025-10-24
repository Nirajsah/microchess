import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import CapturedPieces from './CapturedPieces'
import Timer from './Timer'
import { Color, PieceColor } from './types'
import { UserPlus, Shuffle, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { assignChain, startGame } from './utils'
import { useMicroChess } from '@/context/MicroChessProvider'

export interface MatchData {
  player: PieceColor | '-'
  color?: Color
  moves: { white: string; black: string }[]
  capturedPieces: string[]
  checkStatus: string
  opponentId: string | null
  whiteTime: number
  blackTime: number
  assign: {
    chainId: string
    timestamp: number
  } | null
}

export const RightSideMenu: React.FC<MatchData> = (matchData: MatchData) => {
  return (
    <div className="h-full w-full">
      {matchData.color === 'White' || matchData.color === 'Black' ? (
        <MatchDataUI {...matchData} />
      ) : (
        <MatchSelect assign={matchData.assign} />
      )}
    </div>
  )
}

const MatchDataUI = (data: MatchData) => {
  const {
    player,
    color,
    moves,
    capturedPieces,
    checkStatus,
    whiteTime,
    blackTime,
  } = data
  return (
    <div className="w-full items-center justify-between flex flex-col gap-4 h-[720px]">
      <div className="py-4 text-3xl px-2 font-bold w-full border border-[#ffffff24] bg-[#0a0a0a]">
        {/* {player} Plays */}
        Status:
      </div>

      <div className="w-full relative gap-2 flex flex-col">
        <div className="p-2 border border-[#ffffff24] bg-[#0a0a0a] opacity-85 w-[130px] text-center text-2xl tracking-[4px] text-white">
          <Timer
            initialTime={color === 'b' ? blackTime : whiteTime}
            isActive={player === 'b'}
          />
        </div>
        <div className="w-full relative border border-[#ffffff24] bg-[#0a0a0a]">
          <div className="w-full">
            <table className="w-full">
              <thead className="">
                <tr>
                  <th className="w-[33.3%] text-left p-2">Move</th>
                  <th className="w-[33.3%] text-center p-2">White</th>
                  <th className="w-[33.3%] text-right p-2">Black</th>
                </tr>
              </thead>
            </table>
            <div className="h-[250px] overflow-y-scroll scrollbar-hide flex flex-col-reverse">
              <table className="w-full">
                <tbody>
                  {moves.map((move, index) => (
                    <tr className="flex px-2 w-full" key={index}>
                      <td className="w-[33.3%]">{index + 1}</td>
                      <td className="w-[33.3%] text-center">
                        {move.white || ''}
                      </td>
                      <td className="w-[33.3%] text-end">{move.black || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="p-2 border border-[#ffffff24] bg-[#0a0a0a] opacity-85 w-[130px] text-center text-2xl tracking-[4px] text-white">
          <Timer
            initialTime={color === 'w' ? whiteTime : blackTime}
            isActive={player === 'w'}
          />
        </div>
      </div>
      {checkStatus && player === 'w' && (
        <div className="flex items-center p-2 rounded-md bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">White King In Check</span>
        </div>
      )}
      {checkStatus && player === 'b' && (
        <div className="flex items-center p-2 rounded-md bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">Black King In Check</span>
        </div>
      )}
      <div className="w-full">
        <h3 className="text-sm font-medium text-muted-foreground">
          Captured Pieces
        </h3>
        <div className="border border-[#ffffff24] bg-[#0a0a0a] w-full">
          <div className="flex flex-wrap gap-2 p-2 bg-secondary/10 rounded-md">
            <CapturedPieces pieces={capturedPieces} />
          </div>
        </div>
      </div>
    </div>
  )
}

const MatchSelect = (assign: any) => {
  const { chainId, timestamp } = assign.assign || {}

  const generateHash = () =>
    Math.random().toString(36).substring(2, 14).toUpperCase() // e.g., "K3J9WL48HTZQ"
  const [step, setStep] = useState<
    'idle' | 'loading' | 'hash' | 'friendlyhash'
  >('idle')
  const [hash, setHash] = useState('')
  const [showHash, setShowHash] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleStepChange = (
    step: 'idle' | 'loading' | 'hash' | 'friendlyhash'
  ) => {
    setStep(step)
  }

  const handleFriendlyClick = () => {
    setStep('loading')

    setTimeout(() => {
      setHash(generateHash())
      setStep('hash')
    }, 1500)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <div className="h-full w-full px-6 py-8 border border-[#ffffff24] bg-[#0a0a0a] rounded-2xl shadow-xl">
      {chainId && chainId && (
        <AssignButton
          chainId={String(chainId)}
          timestamp={timestamp}
          name="Assign"
          icon={<Shuffle className="w-6 h-6" />}
        />
      )}
      {step === 'idle' && (
        <>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            Start a New Game
          </h2>
          <p className="text-zinc-400 text-center mb-6">
            Choose how you want to play
          </p>

          <div className="grid gap-8">
            {/* Random Matchmaking */}
            <div>
              <MatchButton
                handleFriendlyMatch={handleFriendlyClick}
                name="Random Match"
                icon={<Shuffle className="w-6 h-6" />}
              />
              <p className="mt-2 text-sm text-blue-300 px-2">
                Matchmaking uses your rank (ELO) to pair you with a similarly
                skilled opponent. It's automatic, fair, and fast — ideal for
                quick competitive games.
              </p>
            </div>

            {/* Friendly Match */}
            <div>
              <MatchButton
                handleFriendlyMatch={handleFriendlyClick}
                name="Friendly Match"
                icon={<Users className="w-6 h-6" />}
              />
              <p className="mt-2 text-sm text-green-300 px-2">
                Play casually with someone you know by sending them a Game Hash.
                Great for practice or fun matches without affecting your rank.
              </p>

              <button
                onClick={() => handleStepChange('friendlyhash')}
                className="mt-2 text-sm text-purple-300 px-2 underline"
              >
                Have a Friendly Game Hash?
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-white">Creating private room...</p>
        </div>
      )}

      {step === 'friendlyhash' && (
        <JoinMatch handleStepChange={handleStepChange} />
      )}

      {step === 'hash' && (
        <div className="flex flex-col items-center text-center gap-4">
          <button
            onClick={() => handleStepChange('idle')}
            className="self-start text-sm flex items-center gap-2 hover:scale-110 transition-all"
          >
            <ArrowLeft className="ml-2 w-4 h-4" />
            Go Back
          </button>
          <h2 className="text-xl font-semibold text-white">Room Ready!</h2>
          <p className="text-zinc-400">Share this code with your friend:</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono px-4 py-2 bg-zinc-800 rounded-lg text-white tracking-wide">
              {showHash ? hash : '••••••••••'}
            </span>
            <button
              onClick={() => setShowHash(!showHash)}
              className="text-zinc-400 hover:text-white"
              title="Toggle visibility"
            >
              {showHash ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleCopy}
              className="text-zinc-400 hover:text-white"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && <p className="text-green-400 text-sm">Copied!</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/chess?gamehash=${hash}`
                )
                setCopied(true)
                setTimeout(() => setCopied(false), 1200)
              }}
              className="text-zinc-400 text-sm hover:text-white flex items-center gap-2 transition"
              title="Copy link"
            >
              <UserPlus className="w-4 h-4" />
              Invite Friend via Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type MatchMakingButtonType = {
  handleFriendlyMatch: () => void
  name: string
  icon: any
}

interface AssignButtonProps {
  name: string
  icon: JSX.Element
  chainId: string
  timestamp: number
}

const AssignButton: React.FC<AssignButtonProps> = ({
  name,
  icon,
  chainId,
  timestamp,
}) => {
  const [pressed, setPressed] = useState(false)

  function handleClick() {
    setPressed(true)
    assignChain(chainId, timestamp)
    setTimeout(() => setPressed(false), 120) // revert after 120ms
  }

  return (
    <div className="relative w-full h-[80px]">
      <div className="w-full h-full bg-[#ffffff24] shadow-inner"></div>
      <button
        onClick={handleClick}
        style={{
          top: pressed ? '0px' : '-4px',
          left: pressed ? '0px' : '-4px',
        }}
        className="absolute bg-[#0a0a0a] border border-[#ffffff24] w-full h-full transition-all flex justify-center items-center gap-3 px-6 py-4"
      >
        {icon}
        <div className="text-left">
          <div className="font-semibold text-lg">{name}</div>
        </div>
      </button>
    </div>
  )
}

const MatchButton = (props: MatchMakingButtonType) => {
  const [pressed, setPressed] = useState(false)
  const { userKey } = useMicroChess()

  function handleClick() {
    setPressed(true)
    startGame(userKey)
    setTimeout(() => setPressed(false), 120) // revert after 120ms
  }

  return (
    <div className="relative w-full h-[80px]">
      <div className="w-full h-full bg-[#ffffff24] shadow-inner"></div>
      <button
        onClick={handleClick}
        style={{
          top: pressed ? '0px' : '-4px',
          left: pressed ? '0px' : '-4px',
        }}
        className="absolute bg-[#0a0a0a] border border-[#ffffff24] w-full h-full transition-all flex justify-center items-center gap-3 px-6 py-4"
      >
        {props.icon}
        <div className="text-left">
          <div className="font-semibold text-lg">{props.name}</div>
        </div>
      </button>
    </div>
  )
}

//
const JoinMatch = ({ handleStepChange }: { handleStepChange: any }) => {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState('')

  useEffect(() => {
    const incoming = searchParams.get('gamehash')
    if (incoming) setCode(incoming.toUpperCase())
  }, [searchParams])

  const handleJoin = () => {
    if (!code) return alert('Please enter a code.')
    // logic to join the game
    alert(`Joining game with code: ${code}`)
  }

  return (
    <div>
      <button
        onClick={() => handleStepChange('idle')}
        className="self-start text-sm flex items-center gap-2 hover:scale-110 transition-all"
      >
        <ArrowLeft className="ml-2 w-4 h-4" />
        Go Back
      </button>
      <h2 className="text-xl font-bold m-4 text-center">
        Join a Friend’s Game
      </h2>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter match code"
        className="w-full px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#ffffff24] text-white mb-4 outline-none"
      />
      <button
        onClick={handleJoin}
        className="flex bg-[#0a0a0a] border border-[#ffffff24] items-center justify-center w-full px-4 py-2 hover:bg-[#111111] rounded-lg transition"
      >
        Join Game <ArrowRight className="ml-2 w-4 h-4" />
      </button>
    </div>
  )
}
