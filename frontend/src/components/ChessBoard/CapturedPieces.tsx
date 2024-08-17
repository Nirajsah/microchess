// import React from 'react'

// const CapturedPieces = ({ capturedPieces }: { capturedPieces: string[] }) => {
//   // Group the pieces by type and count occurrences
//   const pieceCount = capturedPieces.reduce(
//     (acc: { [key: string]: number }, piece: string) => {
//       acc[piece] = (acc[piece] || 0) + 1
//       return acc
//     },
//     {}
//   )

//   return (
//     <div className="flex mt-5 flex-wrap gap-2 p-4 bg-gray-200 rounded-md">
//       {Object.entries(pieceCount).map(([piece, count]) => (
//         <div
//           key={piece}
//           className="relative w-10 h-10 flex items-center justify-center rounded"
//         >
//           <img
//             style={{
//               backgroundImage: `url(../../assets/new_assets/${piece}.png)`,
//             }}
//             src="../../assets/new_assets/white_king.png"
//             alt={piece}
//             className="w-8 h-8"
//           />
//           {count > 1 && (
//             <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
//               {count}
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   )
// }

// export default CapturedPieces

import React from 'react'

const pieceSymbols: any = {
  wp: '♙',
  WhiteKnight: '♘',
  WhiteBishop: '♗',
  WhiteRook: '♖',
  WhiteQueen: '♕',
  WhiteKing: '♔',
  BlackPawn: '♟',
  BlackKnight: '♞',
  BlackBishop: '♝',
  BlackRook: '♜',
  BlackQueen: '♛',
  bk: '♚',
}
// "capturedPieces": [
//       "WHITE_PAWN",
//       "BLACK_PAWN",
//       "BLACK_PAWN"
//
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
    <div className="flex mt-4 rounded flex-wrap p-2 gap-1 bg-[#cdc6c6ab]">
      {pieces &&
        pieces.map((piece: any, index: any) => (
          <div key={index} className="text-5xl rounded">
            {PieceMap[piece] || '?'}
          </div>
        ))}
    </div>
  )
}

export default CapturedPieces
