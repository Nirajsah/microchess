const PieceMap: any = {
  WHITE_PAWN: '♙',
  WHITE_KNIGHT: '♘',
  WHITE_BISHOP: '♗',
  WHITE_ROOK: '♖',
  WHITE_QUEEN: '♕',
  WHITE_KING: '♔',
  BLACK_PAWN: '♟',
  BLACK_KNIGHT: '♞',
  BLACK_BISHOP: '♝',
  BLACK_ROOK: '♜',
  BLACK_QUEEN: '♛',
  BLACK_KING: '♚',
}

const CapturedPieces = ({ pieces }: { pieces: string[] }) => {
  return (
    <div>
      <div className="flex mt-4 rounded flex-wrap p-2 gap-1">
        {pieces &&
          pieces.map((piece: string, index: number) => (
            <div key={index} className="text-5xl rounded">
              {PieceMap[piece] || '?'}
            </div>
          ))}
      </div>
    </div>
  )
}

export default CapturedPieces
