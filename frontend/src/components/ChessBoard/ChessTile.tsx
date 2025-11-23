import React from 'react'
import {
  whitePawn,
  whiteRook,
  whiteKnight,
  whiteBishop,
  whiteQueen,
  whiteKing,
  blackPawn,
  blackRook,
  blackKnight,
  blackBishop,
  blackQueen,
  blackKing,
} from '@/assets'

import { Piece, Square } from './types'

interface ChessTileProps {
  background: string
  piece: Piece
  boardRef: React.RefObject<HTMLDivElement>
  isDragging: boolean
  square: Square
  possMoves: Square[]
  handleMouseDown: (e: React.MouseEvent) => void
}

const pieceImages: any = {
  wP: whitePawn,
  wR: whiteRook,
  wN: whiteKnight,
  wB: whiteBishop,
  wQ: whiteQueen,
  wK: whiteKing,
  bP: blackPawn,
  bR: blackRook,
  bN: blackKnight,
  bB: blackBishop,
  bQ: blackQueen,
  bK: blackKing,
}

export default function ChessTile(props: ChessTileProps) {
  const { piece, background, square, possMoves } = props

  return (
    <div
      onMouseDown={props.handleMouseDown}
      style={{
        backgroundColor: background,
      }}
      data-square={square}
      className="w-full h-full flex justify-center items-center"
    >
      {piece && !props.isDragging && (
        <img
          style={{
            cursor: 'grab',
          }}
          src={pieceImages[piece]}
          alt={piece}
          className="w-[70%] h-[70%] object-contain select-none"
          onMouseDown={props.handleMouseDown}
          draggable={false}
        />
      )}
      {possMoves.includes(square as Square) && (
        <div
          style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.5)', // Background with 50% opacity
            border: '1px solid white', // Fully opaque white border
            borderRadius: '50%', // This makes it a circle
            zIndex: 1,
          }}
        ></div>
      )}
    </div>
  )
}
