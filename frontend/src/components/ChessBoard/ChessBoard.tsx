import React, { useRef, useState } from 'react'
import { BoardType, Piece, Square } from './types'
import ChessTile from './ChessTile'
import CustomDragLayer from './CustomDragLayer'
import { generate_possible_moves } from 'wasm'
import { useMicroChess } from '../../context/MicroChessProvider'
import { ThemeName, themes } from './theme'

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

  const isBlack = false

  function handleMouseDown(_e: React.MouseEvent, piece: Piece, square: Square) {
    if (!piece) return
    setDraggingPiece(piece)
    setSelectedSquare(square)

    window.addEventListener('mousemove', handleMouseMove)

    const mv = generate_possible_moves(
      piece,
      square,
      board,
      true,
      true,
      'd5' as Piece
    )
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

    const boardRect = boardR.getBoundingClientRect()
    const tileSize = 100

    // Calculate which square was clicked
    const boardX = e.clientX - boardRect.left
    const boardY = e.clientY - boardRect.top

    // Calculate file (0-7) and rank (0-7)
    const fileIndex = Math.floor(boardX / tileSize)
    const rankIndex = Math.floor(boardY / tileSize)

    let targetSquare
    if (isBlack) {
      //For black perspective
      const file = String.fromCharCode(97 + (7 - fileIndex))
      const rank = rankIndex + 1
      targetSquare = `${file}${rank}` as Square
    } else {
      // For white perspective
      const file = String.fromCharCode(97 + fileIndex)
      const rank = 8 - rankIndex
      targetSquare = `${file}${rank}` as Square
    }

    const piece = board[selectedSquare as Square]
    const targetPiece = board[targetSquare]

    targetPiece !== null || undefined
      ? makeMove(selectedSquare as Square, targetSquare, piece as Piece, null)
      : makeMove(
          selectedSquare as Square,
          targetSquare as Square,
          piece as Piece,
          targetPiece
        )

    setDraggingPiece(null)
    setSelectedSquare(null)
    setPossMoves([])
    window.removeEventListener('mousemove', handleMouseMove)
  }

  function makeMove(
    from: Square,
    to: Square,
    piece: Piece,
    capturePiece: Piece | null
  ) {
    if (possMoves.includes(to)) {
      console.log(from, to, piece, capturePiece)
    }
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
      {/* ✅ Custom Drag Layer for smooth piece following */}
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
              <div>
                <ChessTile
                  key={square}
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
