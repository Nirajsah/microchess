const PieceMap: any = {
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
const pieceOrder: { [key: string]: number } = {
  Q: 9,
  R: 5,
  B: 3,
  N: 3,
  P: 1,
}

const CapturedPieces = ({ pieces }: { pieces: string[] }) => {
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
    <div>
      <div className="flex rounded flex-wrap p-2 gap-1 items-center">
        {groupedPieces.map((group, index) => (
          <div key={index} className="flex items-center gap-0 relative">
            {Array.from({ length: Math.min(group.count, 3) }).map((_, i) => (
              <div
                key={i}
                className="text-5xl transition-all duration-200"
                style={{
                  marginLeft: i === 0 ? '0' : '-1.5rem',
                  position: 'relative',
                  zIndex: i,
                }}
              >
                {PieceMap[group.piece] || '?'}
              </div>
            ))}
            {/* Show count if more than 3 */}
            {group.count > 3 && (
              <span className="text-sm font-bold ml-1">×{group.count}</span>
            )}
            {/* Show count badge for any multiple */}
            {group.count > 1 && group.count <= 3 && (
              <span className="text-xs font-semibold absolute -top-1 -right-1 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {group.count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CapturedPieces
