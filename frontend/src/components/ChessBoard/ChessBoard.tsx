import React, { useRef, useState } from 'react'
import { BoardType, Piece, Square, SquareToPieceMap } from './types'
import ChessTile from './ChessTile'
import CustomDragLayer from './CustomDragLayer'
import { useMicroChess } from '@/context/MicroChessProvider'
import { ThemeName, themes } from './theme'
import { useChessWasm } from '@/hooks/useWasm'
import { FlagIcon, HandshakeIcon, TrophyIcon } from 'lucide-react'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

interface BoardProps {
  boardData: BoardType
  makeMove: (from: Square, to: Square, piece: Piece) => void
}

export default function ChessBoard(props: BoardProps) {
  const { chessSettings } = useMicroChess()
  const boardRef = useRef<HTMLDivElement>(null)
  const board = props.boardData.position

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

  const { generateMoves } = useChessWasm()

  const isBlack = props.boardData.color === 'Black'

  function handleMouseDown(_e: React.MouseEvent, piece: Piece, square: Square) {
    if (!piece) return
    setDraggingPiece(piece)
    setSelectedSquare(square)

    window.addEventListener('mousemove', handleMouseMove)

    const mv = generateMoves(square)
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

  const selectedTheme = themes[chessSettings.theme as ThemeName]

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
      className={`relative w-full aspect-square max-w-[720px] max-h-[720px] rounded-md shadow-md overflow-hidden ${
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
      title: `${winner} wins!`,
      detail: 'Resigned',
      icon: <FlagIcon width={32} height={32} color="red" />,
      color: 'bg-red-100 border-red-400 text-red-800',
    }
  }
  if (state === 'GameOver' && winner) {
    return {
      title: `${winner} wins!`,
      detail: 'Checkmate.',
      icon: <TrophyIcon width={32} height={32} color="gold" />,
      color: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    }
  }
  if (state === 'GameOver' && !winner) {
    return {
      title: 'Draw',
      detail: 'Stalemate or repetition.',
      icon: <HandshakeIcon width={32} height={32} color="slategray" />,
      color: 'bg-gray-100 border-gray-400 text-gray-800',
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
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-50">
      <div
        className={`rounded-xl border-2 p-8 shadow-2xl flex flex-col items-center ${info.color}`}
      >
        <div className="mb-1">{info.icon}</div>
        <div className="text-lg font-extrabold tracking-wide mb-2">
          {info.title}
        </div>
        <div className="text-xl">{info.detail}</div>
        <button
          className="mt-2 px-5 py-2 rounded bg-blue-600 text-white text-base font-medium hover:bg-blue-700 shadow"
          // onClick={() => window.location.reload()}
        >
          Play Again, is not supported yet, switch to your main chain
        </button>
      </div>
    </div>
  )
}
