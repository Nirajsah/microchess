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
}: {
  boardRef: React.RefObject<HTMLDivElement>
  image: string | undefined
  piece: Piece
  square: Square
  setSelectedSquare: React.Dispatch<React.SetStateAction<Square | null>>
  setPossMoves: React.Dispatch<React.SetStateAction<Square[]>>
  board: SquareToPieceMap
  whiteCastle: boolean
  blackCastle: boolean
  en_passant: string | null
}) {
  const pieceRef = useRef<HTMLImageElement | null>(null)
  const tileRef = useRef<HTMLImageElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const offset = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)

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
    })
  }

  const handleMouseUp = () => {
    setDragging(false)
    const tileSize = tileRef.current?.getBoundingClientRect().width
    if (!tileSize) return
    setPosition((prev) => ({
      x: Math.round(prev.x / tileSize) * tileSize,
      y: Math.round(prev.y / tileSize) * tileSize,
    }))
    setPossMoves([])
    setSelectedSquare(null)
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
    <div ref={tileRef} className="w-full h-full relative">
      {piece && (
        <img
          ref={pieceRef}
          src={image}
          alt={piece}
          style={{
            width: '65px',
            height: '65px',
            position: 'absolute',
            zIndex: 100,
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
