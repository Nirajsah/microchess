import React from 'react'
import { Piece, Square, SquareToPieceMap } from './types'
import generatePossibleMoves from './GeneratePossibleMoves'

export default function Tile({
  image,
  piece,
  square,
  setSelectedSquare,
  setPossMoves,
  board,
}: {
  image: string | undefined
  piece: Piece | undefined
  square: Square
  setSelectedSquare: React.Dispatch<React.SetStateAction<Square | null>>
  setPossMoves: React.Dispatch<React.SetStateAction<Square[]>>
  board: SquareToPieceMap
}) {
  const [isGrabbing, setIsGrabbing] = React.useState(false)
  const dragNdrop = parseInt(sessionStorage.getItem('dragNdrop') ?? '0', 10)
  const isDraggable = Boolean(dragNdrop)

  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const tileRef = React.useRef<HTMLDivElement>(null)

  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `${piece}`)
    setSelectedSquare(square)
    setTimeout(() => {
      ;(e.target as HTMLElement).style.display = 'none'
    }, 0.0)
    if (tileRef.current) {
      const rect = tileRef.current.getBoundingClientRect()
      setPosition({ x: rect.left, y: rect.top })
    }
    const moves = generatePossibleMoves(piece as Piece, square, board)
    setPossMoves(moves)
  }

  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (tileRef.current) {
      tileRef.current.style.opacity = '1'
    }
    setTimeout(() => {
      ;(e.target as HTMLElement).style.display = 'block'
    }, 10)
  }
  // React.useEffect(() => {
  //   if (tileRef.current) {
  //     const tile = tileRef.current
  //     tile.style.transition = 'transform 0.5s ease'
  //     tile.style.transform = `translate(0, 0)`
  //   }
  // }, [square])

  return (
    <div
      ref={tileRef}
      className={`flex items-center justify-center hover:scale-110 chess-piece ${piece}`}
      // className="chess-piece w-14 h-14 hover:scale-110"
      style={{
        maxWidth: '50%',
        maxHeight: '50%',
        // backgroundImage: `url(${image})`,
        // backgroundSize: 'contain', // make sure the image covers the entire div
        // backgroundPosition: 'center', // center the image
        // backgroundRepeat: 'no-repeat', // prevent the image from repeating
        cursor: isGrabbing ? 'grabbing' : 'grab', // change the cursor to a grabbing hand
      }}
      onMouseDown={() => setIsGrabbing(true)}
      onMouseUp={() => setIsGrabbing(false)}
      onMouseLeave={() => setIsGrabbing(false)}
      draggable={isDraggable}
      onDragStart={(e) => {
        onDragStart(e)
      }}
      onDragEnd={(e) => {
        onDragEnd(e)
      }}
    >
      <img
        src={image}
        alt={image}
        className="object-contain"
        draggable={isDraggable}
      />
    </div>
  )
}
