#![allow(non_snake_case)]
use std::str::FromStr;

use async_graphql::{Enum, Request, Response, SimpleObject};
use lazy_static::lazy_static;
use linera_sdk::base::{ContractAbi, Owner, ServiceAbi, TimeDelta, Timestamp};
use serde::{Deserialize, Serialize};
pub struct ChessAbi;
use linera_sdk::graphql::GraphQLMutationRoot;
pub mod moves;
use moves::*;
pub mod square;
use square::*;

impl ContractAbi for ChessAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for ChessAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstantiationArgument {
    /// The `Owner` controlling player 1 and 2, respectively.
    pub players: [Owner; 2],
}

lazy_static! {
    pub static ref WHITE_MOVES: Vec<Bitboard> = computed_pawn_moves(&Color::White);
    pub static ref BLACK_MOVES: Vec<Bitboard> = computed_pawn_moves(&Color::Black);
    pub static ref KNIGHT_MOVES: Vec<Bitboard> = computed_knight_attacks();
    pub static ref KING_MOVES: Vec<Bitboard> = computed_king_moves();
}
#[derive(Debug, Deserialize, Serialize, Clone, GraphQLMutationRoot)]
#[serde(rename_all = "camelCase")]
pub enum Operation {
    NewGame,
    MakeMove {
        from: String,
        to: String,
        piece: String,
    },
}

/// A type alias for a bitboard
pub type Bitboard = u64;

/// A struct to represent a color
#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize, Enum)]
pub enum Color {
    #[default]
    White,
    Black,
}

impl Color {
    /// A function to get the opposite color
    pub fn opposite(&self) -> Self {
        match self {
            Color::White => Color::Black,
            Color::Black => Color::White,
        }
    }

    /// A function to get the index of the color
    pub fn index(&self) -> usize {
        match self {
            Color::White => 0,
            Color::Black => 1,
        }
    }
}

/// A clock to track both players' time.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Clock {
    time_left: [TimeDelta; 2],
    increment: TimeDelta,
    current_turn_start: Timestamp,
    pub block_delay: TimeDelta,
}

/// A struct to represent a chess piece
#[derive(Ord, PartialOrd, Eq, PartialEq, Debug, Clone, Copy, Serialize, Deserialize, Enum)]
#[serde(rename_all = "camelCase")]
pub enum Piece {
    WhitePawn,
    WhiteKnight,
    WhiteBishop,
    WhiteRook,
    WhiteQueen,
    WhiteKing,
    BlackPawn,
    BlackKnight,
    BlackBishop,
    BlackRook,
    BlackQueen,
    BlackKing,
}

/// The state of a Chess game.
#[derive(Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct Game {
    /// The current state of the board.
    pub board: ChessBoard,
    /// The player whose turn it is. If the game has ended, this player loses.
    pub active: Color,
}

impl Game {
    /// A function to create a new game
    pub fn new() -> Self {
        Game {
            board: ChessBoard::new_game(),
            active: Color::White,
        }
    }

    /// A function to get active player
    pub fn active_player(&self) -> Color {
        self.active
    }

    pub fn switch_player_turn(&mut self) {
        self.active = self.active.opposite()
    }
}

#[derive(Clone, Default, Debug, Deserialize, Serialize, SimpleObject)]
/// A struct to represent a chess board
pub struct ChessBoard {
    pub wP: Bitboard,
    pub wN: Bitboard,
    pub wB: Bitboard,
    pub wR: Bitboard,
    pub wQ: Bitboard,
    pub wK: Bitboard,
    pub bP: Bitboard,
    pub bN: Bitboard,
    pub bB: Bitboard,
    pub bR: Bitboard,
    pub bQ: Bitboard,
    pub bK: Bitboard,
}

impl ChessBoard {
    /// A function to create a new chess board
    pub fn new_game() -> Self {
        ChessBoard {
            wP: 0x000000000000FF00,
            wN: 0x0000000000000042,
            wB: 0x0000000000000024,
            wR: 0x0000000000000081,
            wQ: 0x0000000000000008,
            wK: 0x0000000000000010,
            bP: 0x00FF000000000000,
            bN: 0x4200000000000000,
            bB: 0x2400000000000000,
            bR: 0x8100000000000000,
            bQ: 0x0800000000000000,
            bK: 0x1000000000000000,
        }
    }

    #[allow(unused_variables)]
    /// A function to select a piece move
    pub fn select_piece_move(&mut self, from: &str, to: &str, piece: Piece) -> bool {
        let from_square = Square::from_str(from).unwrap();
        let to_square = Square::from_str(to).unwrap();
        match piece {
            Piece::WhitePawn => {
                // Logic for white pawn
                self.white_pawn_moves(from_square, to_square)
            }
            Piece::BlackPawn => {
                // Logic for black pawn
                self.black_pawn_moves(from_square, to_square)
            }

            Piece::WhiteKnight | Piece::BlackKnight => {
                // Logic for knights
                self.knight_moves(from_square, to_square, piece)
            }

            Piece::WhiteBishop | Piece::BlackBishop => {
                // Logic for bishops
                false
            }
            Piece::WhiteRook | Piece::BlackRook => {
                // Logic for rooks
                //
                false
            }
            Piece::WhiteQueen | Piece::BlackQueen => {
                // Logic for queens
                //
                false
            }
            Piece::WhiteKing | Piece::BlackKing => {
                // Logic for white king
                self.king_moves(from_square, to_square, piece)
            }
        }
    }

    /// A function to move a white pawn piece on the board
    pub fn white_pawn_moves(&mut self, from: Square, to: Square) -> bool {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if WHITE_MOVES[from as usize] & (1u64 << to as u32) != 0 {
            // Clear the bit at the original position
            self.wP &= !from_bit;

            // Set the bit at the new position
            self.wP |= to_bit;

            true
        } else {
            false
        }
    }

    /// A function to move black pawn piece on the board
    pub fn black_pawn_moves(&mut self, from: Square, to: Square) -> bool {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if BLACK_MOVES[from as usize] & (1u64 << to as u32) != 0 {
            // Clear the bit at the original position
            self.bP &= !from_bit;

            // Set the bit at the new position
            self.bP |= to_bit;

            true
        } else {
            false
        }
    }

    /// A function to move a knight piece on the board
    pub fn knight_moves(&mut self, from: Square, to: Square, piece: Piece) -> bool {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        match piece {
            Piece::WhiteKnight => {
                if KNIGHT_MOVES[from as usize] & (1u64 << to as u32) != 0 {
                    // Clear the bit at the original position
                    self.wN &= !from_bit;

                    // Set the bit at the new position
                    self.wN |= to_bit;

                    true
                } else {
                    false
                }
            }
            Piece::BlackKnight => {
                if KNIGHT_MOVES[from as usize] & (1u64 << to as u32) != 0 {
                    // Clear the bit at the original position
                    self.bN &= !from_bit;

                    // Set the bit at the new position
                    self.bN |= to_bit;

                    true
                } else {
                    false
                }
            }
            _ => false,
        }
    }

    /// A function to move a king piece on the board
    pub fn king_moves(&mut self, from: Square, to: Square, piece: Piece) -> bool {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        match piece {
            Piece::WhiteKing => {
                if KING_MOVES[from as usize] & (1u64 << to as u32) != 0 {
                    // Clear the bit at the original position
                    self.wK &= !from_bit;

                    // Set the bit at the new position
                    self.wK |= to_bit;

                    true
                } else {
                    false
                }
            }
            Piece::BlackKing => {
                if KING_MOVES[from as usize] & (1u64 << to as u32) != 0 {
                    // Clear the bit at the original position
                    self.bK &= !from_bit;

                    // Set the bit at the new position
                    self.bK |= to_bit;

                    true
                } else {
                    false
                }
            }
            _ => false,
        }
    }
}
