import React, { useRef, useState } from 'react'
import { BoardType, Piece, Square } from './types'
import ChessTile from './ChessTile'
import CustomDragLayer from './CustomDragLayer'
import { useMicroChess } from '@/context/MicroChessProvider'
import { ThemeName, themes } from './theme'
import { makeMove } from './utils'
import { useChessWasm } from '@/hooks/useWasm'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

interface BoardProps {
  boardData: BoardType
}

export default function ChessBoard(props: BoardProps) {
  const { chessSettings } = useMicroChess()
  const boardRef = useRef<HTMLDivElement>(null)
  const board = props.boardData.position

  const [draggingPiece, setDraggingPiece] = useState<Piece | null>(null)
  const [dragPosition, setDragPosition] = useState({ xPercent: 0, yPercent: 0 })
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [possMoves, setPossMoves] = React.useState<Square[]>([])

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

    // Find the closest child that has a `data-square` attribute
    const targetEl = (e.target as HTMLElement).closest(
      '[data-square]'
    ) as HTMLElement | null

    if (!targetEl || !boardR.contains(targetEl)) return
    const targetSquare = targetEl.dataset.square
    const piece = board[selectedSquare as Square]

    // need to check if possMoves has the target square as possible moves.
    if (!possMoves.includes(targetSquare as Square)) return

    makeMove(selectedSquare as Square, targetSquare as Square, piece as Piece)

    setDraggingPiece(null)
    setSelectedSquare(null)
    setPossMoves([])
    window.removeEventListener('mousemove', handleMouseMove)
  }

  const selectedTheme = themes[chessSettings.theme as ThemeName]

  return (
    <div
      ref={boardRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full aspect-square max-w-[720px] max-h-[720px] rounded-md shadow-md overflow-hidden ${
        draggingPiece ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
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

            const bg =
              selectedSquare === square
                ? selectedTheme.selectedSquare
                : possMoves.includes(square as Square) && piece
                ? 'bg-red-400'
                : number % 2 === 0
                ? selectedTheme.dark
                : selectedTheme.light

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
