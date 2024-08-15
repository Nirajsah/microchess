import React from 'react'
import Ranks from './Ranks'
import Files from './Files'
import { useLazyQuery, useSubscription } from '@apollo/client'
import {
  GET_BOARD,
  GET_MOVES,
  GET_PLAYER,
  GET_PLAYER_TURN,
  NOTIFICATIONS,
} from '../GraphQL/queries'
import Board from './Board'

let COLUMNS = 'abcdefgh'.split('')
type Fen = string
export type Piece =
  | 'wP'
  | 'wN'
  | 'wB'
  | 'wR'
  | 'wQ'
  | 'wK'
  | 'bP'
  | 'bN'
  | 'bB'
  | 'bR'
  | 'bQ'
  | 'bK'

export type Square =
  | 'a1'
  | 'b1'
  | 'c1'
  | 'd1'
  | 'e1'
  | 'f1'
  | 'g1'
  | 'h1'
  | 'a2'
  | 'b2'
  | 'c2'
  | 'd2'
  | 'e2'
  | 'f2'
  | 'g2'
  | 'h2'
  | 'a3'
  | 'b3'
  | 'c3'
  | 'd3'
  | 'e3'
  | 'f3'
  | 'g3'
  | 'h3'
  | 'a4'
  | 'b4'
  | 'c4'
  | 'd4'
  | 'e4'
  | 'f4'
  | 'g4'
  | 'h4'
  | 'a5'
  | 'b5'
  | 'c5'
  | 'd5'
  | 'e5'
  | 'f5'
  | 'g5'
  | 'h5'
  | 'a6'
  | 'b6'
  | 'c6'
  | 'd6'
  | 'e6'
  | 'f6'
  | 'g6'
  | 'h6'
  | 'a7'
  | 'b7'
  | 'c7'
  | 'd7'
  | 'e7'
  | 'f7'
  | 'g7'
  | 'h7'
  | 'a8'
  | 'b8'
  | 'c8'
  | 'd8'
  | 'e8'
  | 'f8'
  | 'g8'
  | 'h8'

export type SquareToPieceMap = {
  [key in Square]?: Piece
}
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
function fenToPieceCode(piece: any) {
  // black piece
  if (piece.toLowerCase() === piece) {
    return 'b' + piece.toUpperCase()
  }

  // white piece
  return 'w' + piece.toUpperCase()
}

function fenToObj(fen: string) {
  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '')

  var rows = fen.split('/')
  var position: any = {}

  var currentRow = 8
  for (var i = 0; i < 8; i++) {
    var row = rows[i].split('')
    var colIdx = 0

    // loop through each character in the FEN section
    for (var j = 0; j < row.length; j++) {
      // number / empty squares
      if (row[j].search(/[1-8]/) !== -1) {
        var numEmptySquares = parseInt(row[j], 10)
        colIdx = colIdx + numEmptySquares
      } else {
        // piece
        var square = COLUMNS[colIdx] + currentRow
        position[square] = fenToPieceCode(row[j])
        colIdx = colIdx + 1
      }
    }

    currentRow = currentRow - 1
  }

  return position
}

const CBoard = () => {
  const chainId = window.sessionStorage.getItem('chainId') ?? ''
  const owner = window.sessionStorage.getItem('owner') ?? ''
  const [player, setPlayer] = React.useState('')
  const [boardState, setBoardState] = React.useState<Fen>(fen)
  const [color, setColor] = React.useState('')
  const [boardQuery] = useLazyQuery(GET_BOARD, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      console.log(data)
      setBoardState(data.board)
    },
    fetchPolicy: 'network-only',
  })

  const [playerTurn, { called }] = useLazyQuery(GET_PLAYER_TURN, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      console.log(data)
      setPlayer(data.playerTurn)
    },
    fetchPolicy: 'network-only',
  })
  const [moveQuery] = useLazyQuery(GET_MOVES, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      setMoves(data.getMoves)
    },
    fetchPolicy: 'network-only',
  })

  useSubscription(NOTIFICATIONS, {
    variables: {
      chainId: chainId,
    },
    onData: () => {
      console.log('Notification received')
      playerTurn()
      boardQuery()
      moveQuery()
    },
  })

  // const [moveMutation] = useMutation(MOVE_PIECE)
  // const [captureMutation] = useMutation(CAPTURE_PIECE)
  const [playerColorQuery] = useLazyQuery(GET_PLAYER, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
      player: owner,
    },
    onCompleted: (data) => {
      console.log('player: ', data)
      setColor(data.player)
    },
    fetchPolicy: 'network-only',
  })

  if (!called) {
    playerTurn()
    boardQuery()
    playerColorQuery()
  }

  // const handleSquareClick = (square: string, piece: string) => {
  //   // Convert board coordinates to array indices
  //   console.log('square after click', square, 'piece', piece)
  //   console.log(
  //     'selectedSquare',
  //     selectedSquare,
  //     'selectedPiece',
  //     selectedPiece
  //   )

  //   if (selectedPiece && selectedSquare && piece) {
  //     console.log('move piece', selectedSquare, square, selectedPiece, piece)
  //     capturePiece(selectedSquare, square, selectedPiece, piece)
  //   }

  //   if (selectedPiece && selectedSquare) {
  //     console.log('move piece', selectedSquare, square, selectedPiece)
  //     movePiece(selectedSquare, square, selectedPiece)
  //     setSelectedPiece(null) // Deselect the piece after moving
  //     setSelectedSquare(null) // Reset the selected square
  //   } else if (piece) {
  //     setSelectedPiece(piece)
  //     setSelectedSquare(square)
  //   }
  // }

  // const capturePiece = async (
  //   from: string,
  //   to: string,
  //   piece: string,
  //   capturedPiece: string
  // ) => {
  //   console.log('captured called')
  //   await captureMutation({
  //     variables: {
  //       piece,
  //       from: from,
  //       to: to,
  //       endpoint: 'chess',
  //       capturedPiece: capturedPiece,
  //     },
  //     onError: (error) => {
  //       console.error('Message:', error.message)
  //     },
  //   })
  // }

  // const movePiece = async (from: string, to: string, selectedPiece: string) => {
  //   await moveMutation({
  //     variables: {
  //       piece: selectedPiece,
  //       from: from,
  //       to: to,
  //       endpoint: 'chess',
  //     },
  //     onError: (error) => {
  //       console.error('Message:', error.message)
  //     },
  //   })
  // }
  if (!called) {
    void playerColorQuery()
    moveQuery()
  }

  // const bitboardToArray = (
  //   bitboards: Record<ChessPiece, number | bigint>
  // ): ChessPiece[] => {
  //   const board: ChessPiece[] = Array(64).fill(null)

  //   for (let [pieceType, bitboard] of Object.entries(bitboards)) {
  //     // Skip the __typename field
  //     if (pieceType === '__typename') continue

  //     // Convert number to BigInt if necessary
  //     if (typeof bitboard === 'number') {
  //       bitboard = BigInt(bitboard)
  //     }

  //     let bigIntBitboard = BigInt(bitboard)

  //     for (let i = 0; i < 64; i++) {
  //       if ((bigIntBitboard & (BigInt(1) << BigInt(i))) !== BigInt(0)) {
  //         board[i] = pieceType as ChessPiece
  //       }
  //     }
  //   }

  //   return board
  // }

  const board: SquareToPieceMap = React.useMemo(
    () => fenToObj(boardState),
    [boardState]
  )

  const [moves, setMoves] = React.useState<
    Array<{ white: string; black: string }>
  >([])

  const renderSquare = () => {
    // Determine if the current player is black
    const isBlack = color.toLowerCase() === 'black'

    return (
      // <div className="">
      //   {ranks.map((rank, rankIndex) => (
      //     <div key={rank} className="flex">
      //       {files.map((file, fileIndex) => {
      //         const index = isBlack
      //           ? (7 - rankIndex) * 8 + fileIndex
      //           : fileIndex + rankIndex * 8

      //         const piece = boardArray[index]
      //         // Calculate the square position
      //         const square = isBlack
      //           ? files[7 - fileIndex] + (rankIndex + 1)
      //           : file + rank
      //         // Calculate the background color for alternating squares
      //         const number = fileIndex + rankIndex
      //         const backgroundColor =
      //           selectedSquare === square
      //             ? '#9ae1dc'
      //             : number % 2 === 0
      //             ? '#ff685321'
      //             : '#ff2a00bf'

      //         return (
      //           <div
      //             key={file}
      //             style={{
      //               backgroundColor,
      //               width: '90px',
      //               height: '90px',
      //             }}
      //             onClick={(e) => {
      //               e.preventDefault()
      //               if (color === player) {
      //                 handleSquareClick(square, piece)
      //               }

      //               console.log(
      //                 'index',

      //                 (7 - rankIndex) * 8 + (7 - fileIndex),
      //                 'square',
      //                 square
      //               )
      //             }}
      //             className="flex justify-center items-center"
      //           >
      //             {piece && <Tile image={pieceImages[piece]} />}
      //           </div>
      //         )
      //       })}
      //     </div>
      //   ))}
      // </div>
      <Board board={board} isBlack={isBlack} />
    )
  }

  return (
    <div className="flex">
      <div className="min-w-[250px]">
        <div className="text-2xl tracking-wide font-semibold p-6">Stella</div>
      </div>
      <div className="flex flex-col p-1 relative">
        <div className="flex flex-col">
          <Ranks color={color} />
        </div>
        <div className="mb-2">Opponent{owner}</div>
        <div className="w-full max-w-[720px]">{renderSquare()}</div>
        <div className="flex">
          <Files color={color} />
        </div>
        <div>Player{owner}</div>
      </div>
      {/* Right Side Menu */}
      <div className="w-full my-3 rounded-lg mx-5 p-2 flex flex-col bg-slate-300">
        <div className="p-5 drop-shadow-2xl bg-[#ff2a00bf] rounded-xl w-full max-w-[300px]">
          Player turn {player}
        </div>

        <span>Moves</span>
        <div className="bg-slate-200 w-full rounded-lg">
          <div className="w-full">
            <table className="w-full">
              <thead className="">
                <tr>
                  <th className="w-[33.3%] text-left p-2">Move</th>
                  <th className="w-[33.3%] text-center p-2">White</th>
                  <th className="w-[33.3%] text-right p-2">Black</th>
                </tr>
              </thead>
            </table>
            <div className="h-[250px] overflow-y-scroll scrollbar-hide">
              <table className="w-full">
                <tbody>
                  {moves.map((move, index) => (
                    <tr
                      className={`flex px-2 w-full ${
                        index % 2 === 0 ? 'bg-slate-200' : 'bg-white'
                      }`}
                      key={index}
                    >
                      <td className="w-[33.3%]">{index + 1}</td>
                      <td className="w-[33.3%] text-center">
                        {move.white || ''}
                      </td>
                      <td className="w-[33.3%] text-end">{move.black || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <button className="p-5 mt-10 drop-shadow-2xl hover:scale-105 transition-all bg-cyan-600 rounded-xl max-w-[300px]">
          Play
        </button>
      </div>
    </div>
  )
}

export default CBoard
