export const PieceMap: any = {
  bP: '♙',
  bN: '♘',
  bB: '♗',
  bR: '♖',
  bQ: '♕',
  bK: '♔',
  wP: '♟',
  wN: '♞',
  wB: '♝',
  wR: '♜',
  wQ: '♛',
  wK: '♚',
}

// Define piece values and order
export const pieceOrder: { [key: string]: number } = {
  Q: 9,
  R: 5,
  B: 3,
  N: 3,
  P: 1,
}

export const PieceRow = ({ pieces }: { pieces: string[] }) => {
  const sortedPieces = [...pieces].sort((a, b) => {
    const typeA = a.substring(1)
    const typeB = b.substring(1)
    return pieceOrder[typeB] - pieceOrder[typeA]
  })

  // Group consecutive identical pieces
  const groupedPieces: { piece: string; count: number }[] = []
  sortedPieces.forEach((piece) => {
    const lastGroup = groupedPieces[groupedPieces.length - 1]
    if (lastGroup && lastGroup.piece === piece) {
      lastGroup.count++
    } else {
      groupedPieces.push({ piece, count: 1 })
    }
  })

  return (
    <div className="flex justify-end items-center gap-3 min-h-[32px]">
      <div className="flex flex-wrap gap-2 items-center">
        {groupedPieces.map((group, index) => (
          <div
            key={index}
            className="flex items-center relative group/piece cursor-help"
          >
            {Array.from({ length: Math.min(group.count, 3) }).map((_, i) => (
              <div
                key={i}
                className={`text-3xl transition-all duration-200 hover:scale-110 hover:z-10 ${
                  group.piece.startsWith('w')
                    ? 'text-zinc-400'
                    : 'text-zinc-200'
                }`}
                style={{
                  marginLeft: i === 0 ? '0' : '-0.6rem',
                  zIndex: i,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {PieceMap[group.piece] || '?'}
              </div>
            ))}
            {group.count > 3 && (
              <span className="text-xs font-bold ml-1 text-zinc-500">
                +{group.count - 3}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
