import React, { useEffect, useRef, useState } from 'react'
import { Piece, Square, SquareToPieceMap } from './types'
import { generate_possible_moves } from 'wasm'

export default function Tile({
  image,
  piece,
  square,
  setSelectedSquare,
  setPossMoves,
  board,
  whiteCastle,
  blackCastle,
  en_passant,
  boardRef,
  localMove,
  isBlack,
}: {
  isBlack: boolean
  localMove: any
  boardRef: React.RefObject<HTMLDivElement>
  image: string | undefined
  piece: Piece
  square: Square
  setSelectedSquare: React.Dispatch<React.SetStateAction<Square | null>>
  setPossMoves: React.Dispatch<React.SetStateAction<Square[]>>
  board: SquareToPieceMap | any
  whiteCastle: boolean
  blackCastle: boolean
  en_passant: string | null
}) {
  const pieceRef = useRef<HTMLImageElement | null>(null)
  const tileRef = useRef<HTMLImageElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0, z: 10 })
  const offset = useRef({ x: 0, y: 0 })
  const [fromSquare, setFromSquare] = useState<Square | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    setFromSquare(square)

    // Store offset relative to current position
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }

    setSelectedSquare(square)

    const mv = generate_possible_moves(
      piece,
      square,
      board,
      whiteCastle,
      blackCastle,
      en_passant as Piece
    )
    setPossMoves(mv as Square[])
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return

    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
      z: 100,
    })
  }

  const handleMouseUp = (e: any) => {
    setDragging(false)
    const tile = tileRef.current
    const tileSize = tile?.getBoundingClientRect().width
    if (!tileSize) return
    setPosition((prev) => ({
      x: Math.round(prev.x / tileSize) * tileSize,
      y: Math.round(prev.y / tileSize) * tileSize,
      z: 10,
    }))

    const boardR = boardRef.current
    if (!boardR) return

    const boardRect = boardR.getBoundingClientRect()

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

    const targetPiece = board[targetSquare]

    setPossMoves([])
  }

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  return (
    <div ref={tileRef} className="w-full h-full tile" data-square={square}>
      {piece && (
        <img
          ref={pieceRef}
          id={piece}
          src={image}
          alt={piece}
          style={{
            width: '70%',
            height: '68%',
            position: 'absolute',
            zIndex: position.z,
            left: `${position.x + 12}px`,
            top: `${position.y + 12}px`,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          draggable={false}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  )
}
