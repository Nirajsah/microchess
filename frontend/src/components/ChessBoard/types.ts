// types.ts
export type PromoteData = {
  from: Square
  to: Square
  piece: Piece
  show: boolean
}

// #[derive(Deserialize, Serialize, SimpleObject)]
// struct GameData {
//     fen: String,            // FEN
//     color: String,          // players color
//     opponent: AccountOwner, // opponent player id
//     game_state: String,     // State of the Game, Play, StaleMate or CheckMate
//     winner: Option<AccountOwner>,
// }

export type BoardType = {
  position: SquareToPieceMap
  KingInCheck: string
  en_passant: string | null
  player_turn?: PieceColor
  color: string
  opponent: string
  game_state: string
  winner: string | null
}

export type PieceColor = 'w' | 'b'

export type PieceType = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K'

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'

export type ChessBoard = SquareToPieceMap

export type Move = {
  from: Square
  to: Square
  piece: Piece
  capturedPiece?: Piece
}

export type GameState = {
  board: ChessBoard
  currentTurn: PieceColor
  moveHistory: Move[]
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
}

export type Fen = string
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

export type Color = 'w' | 'b' | 'White' | 'Black'

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
