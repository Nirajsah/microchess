import { Color, Piece, Square, SquareToPieceMap } from './types'
import { pieceImages } from '../ChessBoard/ChessTile'
import { ThemeName, themes } from '@/components/theme'
import { useUserStore } from '@/store/microchess'
import { useReplayStore } from '@/store/replay'
import Ranks from './Ranks'
import Files from './Files'
import Navbar from './Navbar'
import { PieceRow } from './CapturedPieces'
import { GameControls } from './GameControls'
import MatchDataUI from './MatchData'
import React, { useEffect } from 'react'
import { parseSan, parseSan2 } from '@/lib/matchReplay'
import { useParams } from 'react-router-dom'
import { getSanFromBlob } from '@/api'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

function Board(props: { board: SquareToPieceMap; KingInCheck: string | null }) {
  const theme = useUserStore((s) => s.theme)
  const { board, KingInCheck } = props

  const selectedTheme = themes[theme as ThemeName] ?? themes['forest']

  const getSquareColor = (
    square: Square,
    board: SquareToPieceMap,
    KingInCheck: string | null
  ) => {
    if (!KingInCheck) return null

    const piece = board[square]

    // Check if this square contains the king that's in check
    if (piece === `${KingInCheck[0]}K`) {
      // 'wK' for white king, 'bK' for black king
      return '#ab261a' // Bright red for check
    }

    return null // No highlight
  }

  const getSquareBackground = (square: Square, number: number) => {
    const checkColor = getSquareColor(square, board, KingInCheck)
    if (checkColor) {
      return checkColor // Return red for king in check
    }
    // Default checkerboard pattern
    return number % 2 === 0 ? selectedTheme.dark : selectedTheme.light
  }

  return (
    <div className="relative w-full aspect-square max-w-[700px] max-h-[700px] rounded-[14px] shadow-md overflow-hidden">
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 relative">
        {ranks.map((rank, rankIndex) =>
          files.map((file, fileIndex) => {
            const square = (file + rank) as Square
            const piece = board[square]
            const number = fileIndex + rankIndex
            const bg = getSquareBackground(square, number)

            return (
              <div key={square} className="relative">
                <div
                  style={{
                    backgroundColor: bg,
                  }}
                  data-square={square}
                  className="w-full h-full flex justify-center items-center"
                >
                  {piece && (
                    <img
                      src={pieceImages[piece]}
                      alt={piece}
                      draggable={false}
                      className="w-[70%] h-[70%] object-contain select-none"
                    />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export interface MatchData {
  checkStatus: string
  capturedPieces?: string[] | null
  replay: boolean
  moves?: string[]
  onNext?: () => void
  onBack?: () => void
  onPlay?: () => void
  onStart?: () => void
  onEnd?: () => void
  onStop?: () => void
  isPlaying?: boolean
}

const RightSideMenu: React.FC<MatchData> = (matchData: MatchData) => {
  const { capturedPieces } = matchData

  const blackPieces = capturedPieces?.filter((p) => p.startsWith('b')) || []
  const whitePieces = capturedPieces?.filter((p) => p.startsWith('w')) || []

  return (
    <div className="w-full h-[500px] flex justify-center items-center">
      <div className="w-full h-full flex flex-col">
        {capturedPieces && <PieceRow pieces={blackPieces} />}

        {matchData.replay && (
          <GameControls
            onNext={matchData.onNext}
            onBack={matchData.onBack}
            onPlay={matchData.onPlay}
            onStop={matchData.onStop}
            onStart={matchData.onStart}
            onEnd={matchData.onEnd}
            isPlaying={matchData.isPlaying}
          />
        )}

        <div className="w-full flex-1 overflow-hidden">
          <MatchDataUI {...matchData} />
        </div>

        {capturedPieces && <PieceRow pieces={whitePieces} />}
      </div>
    </div>
  )
}

export default function ReplayBoard() {
  const { id } = useParams()
  const state = useReplayStore((s) => s.board)
  const setHistory = useReplayStore((s) => s.setHistory)
  const updateBoard = useReplayStore((s) => s.updateBoard)
  const resetBoard = useReplayStore((s) => s.resetBoard)
  const [moves, setMoves] = React.useState<string[]>([])
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [sans, setSan] = React.useState<string[]>([])

  console.log(id)
  useEffect(() => {
    const fetchSanFromBlob = async () => {
      try {
        const response = await getSanFromBlob(id!)
        const data = JSON.parse(response.result).data.readMoves
        setSan(data)
      } catch (error) {
        console.error('Error fetching my tournaments:', error)
      }
    }
    fetchSanFromBlob()
  }, [id])

  const san = [
    'e4', // pawn move
    'e5', // pawn move
    'Nf3', // knight move
    'Nc6', // knight move
    'Bb5', // bishop move
    'a6', // pawn move
    'Ba4', // bishop move
    'Nf6', // knight move
    'O-O', // white castles king-side
    'Be7', // bishop move
    'Re1', // rook move
    'b5', // pawn move
    'Bb3', // bishop retreat
    'd6', // pawn move
    'c3', // pawn move
    'O-O', // black castles king-side
    'h3', // pawn move
    'Na5', // knight move
    'Bc2', // bishop move
    'c5', // pawn move
    'd4', // pawn move
    'Qc7', // queen move
    'Nbd2', // knight move with disambiguation
    'cxd4', // pawn capture
    'cxd4', // pawn capture
    'Be6', // bishop move
    'd5', // pawn push
    'Bd7', // bishop move
    'b3', // pawn move
    'Rac8', // rook move (file disambiguation)
    'Bb2', // bishop move
    'Nb7', // knight move
    'a4', // pawn move
    'bxa4', // pawn capture
    'Rxa4', // rook capture
    'Qxc2', // queen capture
    'Qxc2', // white queen captures back
    'Rxc2', // rook capture
    'Ba1', // bishop retreat
  ]

  const [count, setCount] = React.useState<number>(-1)

  const handleNext = () => {
    if (count < san.length - 1) {
      const nextCount = count + 1
      updateBoard(nextCount)
      setCount(nextCount)
      setMoves((prev) => [...prev, san[nextCount]])
    } else {
      setIsPlaying(false)
    }
  }

  const handleBack = () => {
    if (count >= 0) {
      const prevCount = count - 1
      if (prevCount >= 0) {
        updateBoard(prevCount)
      } else {
        resetBoard()
      }
      setCount(prevCount)
      setMoves((prev) => prev.slice(0, -1))
    }
  }

  const handlePlay = () => setIsPlaying(true)
  const handleStop = () => setIsPlaying(false)

  const handleStart = () => {
    setIsPlaying(false)
    setCount(-1)
    setMoves([])
    resetBoard()
  }

  const handleEnd = () => {
    setIsPlaying(false)
    const lastIndex = san.length - 1
    updateBoard(lastIndex)
    setCount(lastIndex)
    setMoves(san)
  }

  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        handleNext()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, count])

  React.useEffect(() => {
    let isCancelled = false
    let turn = 'w'
    let currentPos = state.position

    const runReplay = () => {
      const historyBoards: any[] = []

      for (let i = 0; i < san.length; i++) {
        if (isCancelled) return
        const move = san[i]
        const parsed = parseSan2(move, currentPos, turn as Color)
        currentPos = parsed.position
        turn = parsed.player_turn

        historyBoards.push({
          position: currentPos,
          KingInCheck: parsed.kingInCheck,
          player_turn: parsed.player_turn,
          color: state.color,
        })
      }
      setHistory(historyBoards)
    }

    runReplay()

    return () => {
      isCancelled = true
    }
  }, [])

  const { position: board, KingInCheck } = state

  const renderSquare = () => {
    return (
      <div className="w-full chess-board">
        <div className="h-[12.5%] z-50 absolute text-black">
          <Ranks color={'White' as Color} />
        </div>
        <Board board={board} KingInCheck={KingInCheck} />
        <div className="flex text-black">
          <Files color={'White' as Color} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#161616]">
      {/* <LeftMenu /> */}
      <Navbar />
      <div className="flex flex-1 justify-center items-center gap-4 flex-col lg:flex-row">
        <div className="w-full max-w-[720px] bg-[#262626] p-2.5 rounded-[18px]">
          <div className="w-full relative max-w-[720px] rounded-md">
            {renderSquare()}
          </div>
        </div>
        <div className="flex flex-col h-full justify-center w-full max-w-[400px] mt-40 md:mt-20 lg:mt-0">
          <div className="w-full h-full flex-1 rounded-[18px]">
            <RightSideMenu
              checkStatus={KingInCheck}
              replay={true}
              moves={moves}
              onNext={handleNext}
              onBack={handleBack}
              onPlay={handlePlay}
              onStop={handleStop}
              onStart={handleStart}
              onEnd={handleEnd}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
