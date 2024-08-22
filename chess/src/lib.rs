#![allow(non_snake_case)]

use async_graphql::{Request, Response, SimpleObject};
use chessboard::ChessBoard;
use lazy_static::lazy_static;
use linera_sdk::base::{ContractAbi, Owner, ServiceAbi, TimeDelta, Timestamp};
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

impl ContractAbi for ChessAbi {
    type Operation = Operation;
    type Response = ();
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
}

#[derive(Debug)]
pub enum ChessError {
    PieceNotFound,
    InvalidPiece,
    InvalidMove,
    InvalidCapture,
    InvalidPromotion,
    InvalidCastle,
    CastleRights,
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
        Self {
            time_left: [arg.start_time, arg.start_time],
            increment: arg.increment,
            current_turn_start: block_time,
            block_delay: arg.block_delay,
        }
    }

    /// Records a player making a move in the current block.
    pub fn make_move(&mut self, block_time: Timestamp, player: Color) {
        let duration = block_time.delta_since(self.current_turn_start);
        let i = player.index();
        assert!(self.time_left[i] >= duration);
        self.time_left[i] = self.time_left[i]
            .saturating_sub(duration)
            .saturating_add(self.increment);
        self.current_turn_start = block_time;
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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum CastleType {
    KingSide,
    QueenSide,
}

#[derive(Clone, Default, Debug, Serialize, Deserialize)]
pub enum MoveType {
    #[default]
    Move,
    Capture(Piece),
    Castle(CastleType),
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
}

impl Game {
    /// A function to create a new game
    pub fn new() -> Self {
        Game {
            board: ChessBoard::new(),
            active: Color::White,
            moves: vec![],
            captured_pieces: vec![],
        }
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

    /// A function to make move (MoveType)
    pub fn make_move(&mut self, from: Square, to: Square, piece: Piece, m: MoveType) -> Result<()> {
        let color = piece.color().opposite();
        match m {
            MoveType::Move => match self.move_piece(from, to, piece) {
                Ok(_) => {
                    if self.board.in_check(color) {
                        self.board.update_castling_rights(color)
                    }
                    Ok(())
                }
                Err(_) => Err(ChessError::InvalidMove),
            },
            MoveType::Capture(Piece) => match self.capture_piece(from, to, piece, Piece) {
                Ok(_) => {
                    if self.board.in_check(color) {
                        self.board.update_castling_rights(color)
                    }
                    Ok(())
                }
                Err(_) => Err(ChessError::InvalidCapture),
            },
            MoveType::Castle(CastleType::KingSide) => self.castle(&piece, CastleType::KingSide),
            MoveType::Castle(CastleType::QueenSide) => self.castle(&piece, CastleType::QueenSide),
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

    /// A function to capture piece
    pub fn capture_piece(
        &mut self,
        from: Square,
        to: Square,
        piece: Piece,
        captured_piece: Piece,
    ) -> Result<()> {
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
}
