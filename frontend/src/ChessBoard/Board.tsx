import React, { useRef, useState } from 'react'
import { BoardType, Piece, Square, SquareToPieceMap } from './types'
import ChessTile from '../ChessBoard/ChessTile'
import CustomDragLayer from './CustomDragLayer'
import { FlagIcon, HandshakeIcon, TrophyIcon } from 'lucide-react'
import { ThemeName, themes } from '@/components/theme'
import { chessWasm } from '@/lib/chessWasmClient'
import { useUserStore } from '@/store/microchess'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

interface BoardProps {
  boardData: BoardType
  makeMove: (from: Square, to: Square, piece: Piece) => void
}

export default function Board(props: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const board = props.boardData.position

  const theme = useUserStore((s) => s.theme)

  const [draggingPiece, setDraggingPiece] = useState<Piece | null>(null)
  const [dragPosition, setDragPosition] = useState({
    xPercent: 0,
    yPercent: 0,
  })
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [possMoves, setPossMoves] = React.useState<Square[]>([])
  const [activeSquare, setActiveSquare] = React.useState<{
    from: Square
    to: Square
  }>({
    from: '' as Square,
    to: '' as Square,
  })

  const { lastMove, KingInCheck } = props.boardData

  React.useEffect(() => {
    if (lastMove?.from && lastMove?.to) {
      setActiveSquare({
        from: lastMove.from as Square,
        to: lastMove.to as Square,
      })
    }
  }, [lastMove])

  const isBlack = props.boardData.color === 'Black'

  function handleMouseDown(_e: React.MouseEvent, piece: Piece, square: Square) {
    if (!piece) return
    setDraggingPiece(piece)
    setSelectedSquare(square)

    window.addEventListener('mousemove', handleMouseMove)

    const mv = chessWasm.generateMoves(square)
    setPossMoves(mv as Square[])
  }

  function handleMouseMove(e: any) {
    if (!boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const clampedX = Math.max(rect.left, Math.min(e.clientX, rect.right))
    const clampedY = Math.max(rect.top, Math.min(e.clientY, rect.bottom))

    const x = ((clampedX - rect.left) / rect.width) * 100
    const y = ((clampedY - rect.top) / rect.height) * 100

    setDragPosition({ xPercent: x, yPercent: y })
  }

  function handleMouseUp(e: any) {
    const boardR = boardRef.current
    if (!boardR) return

    const resetDragState = () => {
      setDraggingPiece(null)
      setSelectedSquare(null)
      setPossMoves([])
    }

    // Find the closest child that has a `data-square` attribute
    const targetEl = (e.target as HTMLElement).closest(
      '[data-square]'
    ) as HTMLElement | null

    if (!targetEl || !boardR.contains(targetEl)) return
    if (!targetEl || !boardR.contains(targetEl)) {
      window.removeEventListener('mousemove', handleMouseMove)
      resetDragState()
      return
    }

    const targetSquare = targetEl.dataset.square
    if (!targetSquare) {
      window.removeEventListener('mousemove', handleMouseMove)
      resetDragState()
      return
    }

    if (!selectedSquare) {
      window.removeEventListener('mousemove', handleMouseMove)
      resetDragState()
      return
    }

    const piece = board[selectedSquare as Square]

    if (!possMoves.includes(targetSquare as Square)) {
      window.removeEventListener('mousemove', handleMouseMove)
      resetDragState()
      return
    }

    window.removeEventListener('mousemove', handleMouseMove)

    try {
      props.makeMove(
        selectedSquare as Square,
        targetSquare as Square,
        piece as Piece
      )
      setActiveSquare({
        from: selectedSquare as Square,
        to: targetSquare as Square,
      })
    } catch (err) {
      console.error('makeMove threw an error:', err)
      setActiveSquare({
        from: lastMove?.from as Square,
        to: lastMove?.to as Square,
      })
    } finally {
      resetDragState()
    }
  }

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

  const getSquareBackground = (
    square: Square,
    piece: Piece,
    number: number
  ) => {
    const checkColor = getSquareColor(square, board, KingInCheck)
    if (checkColor) {
      return checkColor // Return red for king in check
    }

    // Currently selected square
    if (selectedSquare === square) {
      return selectedTheme.selectedSquare
    }

    // Last move highlighting
    if (activeSquare.from === square) {
      return '#bbbc4e'
    }
    if (activeSquare.to === square) {
      return '#d5ce61'
    }

    // Possible move with piece (capture)
    if (possMoves.includes(square) && piece) {
      return 'bg-red-400'
    }

    // Default checkerboard pattern
    return number % 2 === 0 ? selectedTheme.dark : selectedTheme.light
  }

  return (
    <div
      ref={boardRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full aspect-square max-w-[700px] max-h-[700px] rounded-[14px] shadow-md overflow-hidden ${
        draggingPiece ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      {(props.boardData.game_state === 'Resign' ||
        props.boardData.game_state === 'GameOver') &&
        props.boardData.winner && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded p-6 text-xl font-bold shadow-lg">
              {props.boardData.winner} Won
            </div>
          </div>
        )}

      <GameOverDisplay
        gameState={props.boardData.game_state}
        winner={props.boardData.winner}
        resigned={props.boardData.game_state === 'Resign'}
      />

      {/* Custom Drag Layer for smooth piece following */}
      <CustomDragLayer
        dragPosition={dragPosition}
        draggingPiece={draggingPiece}
      />

      <div className="w-full h-full grid grid-cols-8 grid-rows-8">
        {ranks.map((rank, rankIndex) =>
          files.map((file, fileIndex) => {
            const square = isBlack
              ? files[7 - fileIndex] + (rankIndex + 1) // Adjust rank for black perspective
              : file + rank

            const piece = board[square as Square] as Piece
            const number = fileIndex + rankIndex

            const bg = getSquareBackground(square as Square, piece, number)

            return (
              <div key={square}>
                <ChessTile
                  background={bg}
                  piece={piece}
                  isDragging={square === selectedSquare}
                  boardRef={boardRef}
                  possMoves={possMoves}
                  square={square as Square}
                  handleMouseDown={(e) =>
                    handleMouseDown(e, piece, square as Square)
                  }
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// Helper for result messaging and icon (add your own icons as desired)
const getGameOverInfo = (
  state: string,
  winner: string | null,
  resigned: boolean
) => {
  if (resigned) {
    return {
      title: `${winner} WINS!`,
      detail: 'Victory by resignation',
      icon: FlagIcon,
      color:
        'bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/50 backdrop-blur-xl',
      glow: 'shadow-red-500/25 shadow-xl',
    }
  }
  if (state === 'GameOver' && winner) {
    return {
      title: `${winner.toUpperCase()} WINS!`,
      detail: 'Checkmate',
      icon: TrophyIcon,
      color:
        'bg-gradient-to-br from-amber-900/30 to-yellow-800/20 border-amber-400/60 backdrop-blur-2xl',
      glow: 'shadow-amber-400/30 shadow-2xl',
    }
  }
  if (state === 'GameOver' && !winner) {
    return {
      title: 'DRAW',
      detail: 'Perfect balance',
      icon: HandshakeIcon,
      color:
        'bg-gradient-to-br from-slate-900/40 to-slate-800/20 border-slate-500/40 backdrop-blur-xl',
      glow: 'shadow-slate-400/20 shadow-xl',
    }
  }
  return null
}

const GameOverDisplay = ({
  gameState,
  winner,
  resigned = false,
}: {
  gameState: string
  winner: string | null
  resigned?: boolean
}) => {
  const info = getGameOverInfo(gameState, winner, resigned)
  if (!info) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-slate-900/80 to-black/60 backdrop-blur-sm"></div>
      <div
        className={`relative w-full max-w-[500px] py-6 px-10 rounded-2xl border-2 shadow-2xl flex flex-col items-center text-center overflow-hidden max-h-[85vh] ${info.color} ${info.glow}`}
      >
        <div className="absolute inset-0 rounded-2xl bg-blue-500/10 opacity-75"></div>
        <div className="w-20 h-20 mb-3 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
          <info.icon width={30} height={30} color="white" />
        </div>
        <h2 className="text-xl truncate text-wrap max-w-[400px] md:text-2xl font-black tracking-tight mb-1 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent drop-shadow-2xl">
          {info.title}
        </h2>
        <p className="text-md font-medium text-slate-200/90 px-4 leading-relaxed">
          {info.detail}
        </p>
        <div className="pt-4 text-white text-sm font-bold">
          <span>Switch Chain</span>
        </div>
      </div>
    </div>
  )
}
