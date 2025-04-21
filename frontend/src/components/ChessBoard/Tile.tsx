/** TODO: Replace with <ChessTile /> after complete porting */
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
  const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()

    const board = boardRef.current
    const pieceR = pieceRef.current
    if (!board || !pieceR) return

    setDragging(true)
    setFromSquare(square)

    const boardRect = board.getBoundingClientRect()
    const pieceRect = pieceR.getBoundingClientRect()

    const relativeX = pieceRect.left - boardRect.left
    const relativeY = pieceRect.top - boardRect.top

    console.log('Piece X relative to board:', relativeX)
    console.log('Piece Y relative to board:', relativeY)

    // Calculate offset from the center of the piece
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }

    // Save the original position for reset if needed
    setOriginalPosition({
      x: 0,
      y: 0,
    })

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

    const board = boardRef.current
    const pieceR = pieceRef.current
    if (!board || !pieceR) return

    const boardRect = board.getBoundingClientRect()
    const pieceRect = pieceR.getBoundingClientRect()

    const relativeX = e.clientX - boardRect.left
    const relativeY = e.clientY - boardRect.top

    console.log('Mouse X:', relativeX, 'Mouse Y:', relativeY)

    // Calculate new position based on mouse position relative to board
    let newX = e.clientX - offset.current.x
    let newY = e.clientY - offset.current.y

    console.log('New X:', newX, 'New Y:', newY)
    // Clamp to board boundaries
    // Calculate the adjusted boundaries accounting for piece size

    setPosition({
      x: relativeX,
      y: relativeY,
      z: 100,
    })
  }

  const handleMouseUp = (e: MouseEvent) => {
    if (!dragging) return

    const boardl = boardRef.current
    if (!boardl) return

    const boardRect = boardl.getBoundingClientRect()
    const tileSize = boardRect.width / 8 // Assuming 8x8 chess board

    // Calculate which square was under the mouse on release
    const boardX = e.clientX - boardRect.left
    const boardY = e.clientY - boardRect.top

    // Make sure the release happened within the board boundaries
    if (
      boardX < 0 ||
      boardX > boardRect.width ||
      boardY < 0 ||
      boardY > boardRect.height
    ) {
      // If released outside the board, reset to original position
      setPosition({
        x: originalPosition.x,
        y: originalPosition.y,
        z: 0,
      })
      setDragging(false)
      setPossMoves([])
      return
    }

    // Calculate file (0-7) and rank (0-7)
    const fileIndex = Math.floor(boardX / tileSize)
    const rankIndex = Math.floor(boardY / tileSize)

    let targetSquare: Square
    if (isBlack) {
      // For black perspective
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

    // Reset drag state
    setDragging(false)

    // // If it's a valid move, let your move handler take care of actual piece movement
    // if (fromSquare && possMoves.includes(targetSquare)) {
    //   localMove(fromSquare, targetSquare, targetPiece)
    // } else {
    //   // Reset to original position if not a valid move
    //   setPosition(originalPosition)
    // }

    setSelectedSquare(null)
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
    <div
      ref={tileRef}
      className="w-full relative h-full tile flex items-center justify-center"
      data-square={square}
    >
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
            zIndex: dragging ? 100 : position.z,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: dragging ? 'none' : 'transform 0.1s ease-out',
          }}
          draggable={false}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  )
}
