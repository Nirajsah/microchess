#![allow(non_snake_case)]

use async_graphql::{Enum, Request, Response, SimpleObject};
use chessboard::ChessBoard;
use lazy_static::lazy_static;
use linera_sdk::base::{
    Amount, ChainId, ContractAbi, MessageId, Owner, PublicKey, ServiceAbi, TimeDelta, Timestamp,
};
use piece::{Color, Piece};
use serde::{Deserialize, Serialize};
pub struct ChessAbi;
use linera_sdk::graphql::GraphQLMutationRoot;
pub mod moves;
use moves::*;
pub mod chessboard;
pub mod piece;
pub mod square;
use square::Square;
use thiserror::Error;
pub mod magic;
pub mod prng;

impl ContractAbi for ChessAbi {
    type Operation = Operation;
    type Response = ChessResponse;
}

impl ServiceAbi for ChessAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct InstantiationArgument {
    /// The `Owner` controlling player 1 and 2, respectively.
    pub players: [Owner; 2],
    /// The initial time each player has to think about their turns.
    pub start_time: TimeDelta,
    /// The duration that is added to the clock after each turn.
    pub increment: TimeDelta,
    /// The maximum time that is allowed to pass between a block proposal and validation.
    /// This should be long enough to confirm a block, but short enough for the block timestamp
    /// to accurately reflect the current time.
    pub block_delay: TimeDelta,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PlayerStats {
    pub player_id: Owner,
    pub games_played: u32,
    pub wins: u32,
    pub losses: u32,
    pub draws: u32,
    pub win_rate: f32,
}

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChessResponse {
    Ok,
    Err(ChessError),
}

#[derive(Debug, Deserialize, Serialize, Clone, GraphQLMutationRoot)]
#[serde(rename_all = "camelCase")]
pub enum Operation {
    NewGame {
        player: Owner,
    },
    MakeMove {
        from: String,
        to: String,
        piece: String,
    },
    CapturePiece {
        // square which captures
        from: String,
        // square which is being captured
        to: String,
        // piece which captures
        piece: String,
        // piece which is being captured
        captured_piece: String,
    },
    PawnPromotion {
        from: String,
        to: String,
        piece: String,
        promoted_piece: String,
    },
    Resign,
    /// Start the game on a temporary chain
    StartGame {
        /// The `Owner` controlling player 1 and 2, respectively.
        players: [PublicKey; 2],
        /// A small amount to cover the fees for the game, on the new chain
        amount: Amount,
        /// Game's total time (~15 mins)
        match_time: TimeDelta,
    },
}
//     /// The `Owner` controlling player 1 and 2, respectively.
//     pub players: [Owner; 2],
//     /// The initial time each player has to think about their turns.
//     pub start_time: TimeDelta,
//

/// The IDs of a temporary chain for a single game.
#[derive(Clone, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize, SimpleObject)]
pub struct GameChain {
    /// The ID of the `OpenChain` message that created the chain.
    pub message_id: MessageId,
    /// The ID of the temporary game chain itself.
    pub chain_id: ChainId,
}

#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize, Enum)]
pub enum GameState {
    #[default]
    InPlay,
    Checkmate,
    Stalemate,
    Resign,
}

#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize, SimpleObject)]
pub struct PlayerTime {
    pub white: TimeDelta,
    pub black: TimeDelta,
}

#[derive(Debug, PartialEq, Serialize, Deserialize, Eq, Clone, Error)]
pub enum ChessError {
    #[error("Piece not found")]
    PieceNotFound,
    #[error("Invalid piece")]
    InvalidPiece,
    #[error("Invalid move")]
    InvalidMove,
    #[error("Invalid capture")]
    InvalidCapture,
    #[error("Invalid promotion")]
    InvalidPromotion,
    #[error("Invalid castle")]
    InvalidCastle,
    #[error("Invalid en passant")]
    InvalidEnPassant,
    #[error("Invalid request")]
    InvalidRequest,
    #[error("Castle rights not available")]
    CastleRights,
    #[error("King in check")]
    KingInCheck,
    #[error("Checkmate")]
    Checkmate,
    #[error("Stalemate")]
    Stalemate,
}

pub type Result<T> = std::result::Result<T, ChessError>;

/// A type alias for a bitboard
pub type Bitboard = u64;

/// A struct to represent a Clock
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, SimpleObject)]
pub struct Clock {
    pub time_left: [TimeDelta; 2],
    pub increment: TimeDelta,
    pub current_turn_start: Timestamp,
    pub block_delay: TimeDelta,
}

impl Clock {
    /// Initializes the clock.
    pub fn new(block_time: Timestamp, arg: &InstantiationArgument) -> Self {
        let total_time = TimeDelta::from_secs(900); // 15 mins
        Self {
            time_left: [total_time, total_time],
            increment: arg.increment,
            current_turn_start: block_time,
            block_delay: arg.block_delay,
        }
    }

    /// Records a player making a move in the current block.
    pub fn make_move(&mut self, block_time: Timestamp, player: Color) {
        let duration = block_time.delta_since(self.current_turn_start);
        let i = player.index();
        self.time_left[i] = self.time_left[i].saturating_sub(duration);
        self.current_turn_start = block_time;
    }

    /// Returns the time left for a given player.
    pub fn time_left_for_player(&self) -> PlayerTime {
        PlayerTime {
            white: self.time_left[Color::White.index()],
            black: self.time_left[Color::Black.index()],
        }
    }

    /// Returns whether the given player has timed out.
    pub fn timed_out(&self, block_time: Timestamp, player: Color) -> bool {
        self.time_left[player.index()] < block_time.delta_since(self.current_turn_start)
    }
}

#[derive(Clone, Default, Debug, Serialize, Deserialize, SimpleObject)]
pub struct Move {
    white: Option<String>,
    black: Option<String>,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum CastleType {
    KingSide,
    QueenSide,
}

#[derive(Clone, Copy, Default, Debug, Serialize, Deserialize)]
pub enum MoveType {
    #[default]
    Move,
    Capture(Piece),
    Castle(CastleType),
    EnPassant,
    Promotion(Piece),
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct MoveData {
    pub from: Square,
    pub to: Square,
    pub piece: Piece,
    pub move_type: MoveType, // Changed to `move_type` to avoid confusion with the `m` field
}

impl MoveData {
    pub fn new(from: Square, to: Square, piece: Piece, board: &ChessBoard) -> Self {
        let move_type = if let Some(captured_piece) = board.get_piece_at(to) {
            MoveType::Capture(captured_piece)
        } else {
            MoveType::Move
        };

        MoveData {
            from,
            to,
            piece,
            move_type,
        }
    }
}

/// The state of a Chess game.
#[derive(Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct Game {
    /// The current state of the board.
    pub board: ChessBoard,
    /// The player whose turn it is. If the game has ended, this player loses.
    pub active: Color,
    /// Moves Table
    pub moves: Vec<Move>,
    /// Captured Pieces Table
    pub captured_pieces: Vec<Piece>,
    /// Game State
    pub state: GameState,
}

impl Game {
    /// A function to create a new game
    pub fn new() -> Self {
        Game {
            board: ChessBoard::new(),
            active: Color::White,
            moves: vec![],
            captured_pieces: vec![],
            state: GameState::InPlay,
        }
    }

    pub fn with_fen(fen: &str) -> Self {
        Game {
            board: ChessBoard::with_fen(fen),
            active: Color::White,
            moves: vec![],
            captured_pieces: vec![],
            state: GameState::InPlay,
        }
    }

    pub fn insert_captured_pieces(&mut self, piece: &Piece) {
        self.captured_pieces.push(*piece);
    }

    /// A function to create a move string
    pub fn create_move_string(&mut self, color: Color, chess_move: String) {
        match color {
            Color::White => {
                if self.moves.is_empty() || self.moves.last().unwrap().black.is_some() {
                    self.moves.push(Move {
                        white: Some(chess_move),
                        black: None,
                    });
                } else {
                    self.moves.last_mut().unwrap().white = Some(chess_move);
                }
            }
            Color::Black => {
                if let Some(last_move) = self.moves.last_mut() {
                    if last_move.black.is_none() {
                        last_move.black = Some(chess_move);
                    } else {
                        self.moves.push(Move {
                            white: None,
                            black: Some(chess_move),
                        });
                    }
                } else {
                    self.moves.push(Move {
                        white: None,
                        black: Some(chess_move),
                    });
                }
            }
        }
    }

    /// A function to get active player
    pub fn active_player(&self) -> Color {
        self.active
    }

    /// A function to switch player turn
    pub fn switch_player_turn(&mut self) {
        self.active = self.active.opposite()
    }

    /// A function to make move
    pub fn make_move(&mut self, from: Square, to: Square, piece: Piece, m: MoveType) -> Result<()> {
        let color = piece.color().opposite();
        match m {
            MoveType::Move => match self.move_piece(from, to, piece) {
                Ok(_) => {
                    log::info!("Move in OK block: {:?}", m);
                    if self.board.in_check(color) {
                        self.board.update_castling_rights(color);
                    }
                    Ok(())
                }
                Err(e) => return Err(e),
            },
            MoveType::Capture(Piece) => match self.capture_piece(from, to, piece, Piece) {
                Ok(_) => {
                    self.insert_captured_pieces(&Piece);
                    Ok(())
                }
                Err(e) => return Err(e),
            },
            MoveType::Castle(CastleType::KingSide) => self.castle(&piece, CastleType::KingSide),
            MoveType::Castle(CastleType::QueenSide) => self.castle(&piece, CastleType::QueenSide),
            MoveType::EnPassant => match self.board.en_passant_capture(from, to, &piece) {
                Ok(_) => {
                    if self.board.in_check(color) {
                        self.board.update_castling_rights(color);
                    }
                    self.insert_captured_pieces(&piece.opp_piece()); // In case of en passant, only pawns can be captured
                    Ok(())
                }

                Err(e) => return Err(e),
            },
            MoveType::Promotion(Piece) => {
                if let Some(captured_piece) = self.board.get_piece_at(to) {
                    log::info!("Promotion: {:?}", captured_piece);
                    self.capture_piece(from, to, piece, captured_piece)
                        .and_then(|_| self.board.add_piece(to, piece, Piece))
                } else {
                    log::info!("Promotion: {:?}", Piece);
                    self.move_piece(from, to, piece)
                        .and_then(|_| self.board.add_piece(to, piece, Piece))
                }
            }
        }
    }

    /// A function to castle
    pub fn castle(&mut self, piece: &Piece, castle_type: CastleType) -> Result<()> {
        match piece {
            Piece::WhiteKing => {
                if !self.board.castling_rights[0] {
                    return Err(ChessError::CastleRights);
                }
                match castle_type {
                    CastleType::KingSide => self.board.wK_castle_king_side(),
                    CastleType::QueenSide => self.board.wK_castle_queen_side(),
                }
            }
            Piece::BlackKing => {
                if !self.board.castling_rights[1] {
                    return Err(ChessError::CastleRights);
                }
                match castle_type {
                    CastleType::KingSide => self.board.bK_castle_king_side(),
                    CastleType::QueenSide => self.board.bK_castle_queen_side(),
                }
            }
            _ => Err(ChessError::InvalidPiece),
        }
    }

    /// A function to move piece
    pub fn move_piece(&mut self, from: Square, to: Square, piece: Piece) -> Result<()> {
        match piece {
            Piece::WhitePawn => self.board.wP_moves(from, to, &piece),
            Piece::BlackPawn => self.board.bP_moves(from, to, &piece),
            Piece::WhiteKnight | Piece::BlackKnight => self.board.knight_moves(from, to, &piece),
            Piece::WhiteKing | Piece::BlackKing => self.board.king_moves(from, to, &piece),
            Piece::WhiteBishop | Piece::BlackBishop => self.board.bishop_moves(from, to, &piece),
            Piece::WhiteRook | Piece::BlackRook => self.board.rook_moves(from, to, &piece),
            Piece::WhiteQueen | Piece::BlackQueen => self.board.queen_moves(from, to, &piece),
        }
    }

    /// a function to capture piece
    pub fn capture_piece(
        &mut self,
        from: Square,
        to: Square,
        piece: Piece,
        captured_piece: Piece,
    ) -> Result<()> {
        if piece.color() == captured_piece.color() {
            return Err(ChessError::InvalidCapture);
        }

        if self.board.get_piece_at(to).is_none() {
            return Err(ChessError::InvalidCapture);
        }
        match piece {
            Piece::WhitePawn => self.board.wP_captures(from, to, &piece, &captured_piece),
            Piece::BlackPawn => self.board.bP_captures(from, to, &piece, &captured_piece),
            Piece::WhiteKnight | Piece::BlackKnight => {
                self.board
                    .knight_captures(from, to, &piece, &captured_piece)
            }
            Piece::WhiteKing | Piece::BlackKing => {
                self.board.king_captures(from, to, &piece, &captured_piece)
            }
            Piece::WhiteRook | Piece::BlackRook => {
                self.board.rook_captures(from, to, &piece, &captured_piece)
            }
            Piece::WhiteBishop | Piece::BlackBishop => {
                self.board
                    .bishop_captures(from, to, &piece, &captured_piece)
            }
            Piece::WhiteQueen | Piece::BlackQueen => {
                self.board.queen_captures(from, to, &piece, &captured_piece)
            }
        }
    }

    /// Check if the current player is in checkmate
    pub fn is_checkmate(&mut self) -> bool {
        let color = self.active;

        if !self.board.in_check(color) {
            return false;
        }

        let mut pieces = match color {
            Color::White => self.board.white_pieces(),
            Color::Black => self.board.black_pieces(),
        };

        // Try all possible moves for all pieces of the current player
        while pieces != 0 {
            let from: usize = pieces.trailing_zeros() as usize;
            let square = Square::usize_to_square(from);
            if let Some(piece) = self.board.get_piece_at(square) {
                if let Some(possible_moves) = self.get_possible_moves(square, piece) {
                    for mv in possible_moves {
                        // Create a copy of the board to test moves
                        let mut temp_board = self.clone();
                        match temp_board.make_move(mv.from, mv.to, mv.piece, mv.move_type) {
                            Ok(_) => {
                                if !temp_board.board.in_check(color) {
                                    return false;
                                }
                            }
                            Err(e) => {
                                log::trace!("Error: {:?}", e);
                            }
                        }
                    }
                }
            }

            pieces &= pieces - 1;
        }
        true
    }

    /// Get all possible moves for a piece
    fn get_possible_moves(&self, from: Square, piece: Piece) -> Option<Vec<MoveData>> {
        let color = piece.color();
        let moves = match piece {
            Piece::WhitePawn | Piece::BlackPawn => self.board.get_pawn_moves(from, color),
            Piece::WhiteKnight | Piece::BlackKnight => self.board.get_knight_moves(from, color),
            Piece::WhiteKing | Piece::BlackKing => self.board.get_king_moves(from, color),
            Piece::WhiteBishop | Piece::BlackBishop => self.board.get_bishop_moves(from, color),
            Piece::WhiteRook | Piece::BlackRook => self.board.get_rook_moves(from, color),
            Piece::WhiteQueen | Piece::BlackQueen => self.board.get_queen_moves(from, color),
        };

        let move_data: Option<Vec<MoveData>> = moves.map(|moves_vec| {
            moves_vec
                .into_iter()
                .map(|to| MoveData::new(from, to, piece, &self.board))
                .collect()
        });

        move_data
    }
}
