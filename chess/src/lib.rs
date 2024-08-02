#![allow(non_snake_case)]
use async_graphql::{Request, Response, SimpleObject};
use linera_sdk::base::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};
pub struct ChessAbi;
use linera_sdk::graphql::GraphQLMutationRoot;

impl ContractAbi for ChessAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for ChessAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, Clone, GraphQLMutationRoot)]
#[serde(rename_all = "camelCase")]
pub enum Operation {
    NewGame,
    MakeMove { from: u64, to: u64 },
}

/// A type alias for a bitboard
pub type Bitboard = u64;

/// A struct to represent a color
pub enum Color {
    White,
    Black,
}

const NOT_A_FILE: Bitboard = 0xFEFEFEFEFEFEFEFE;
const NOT_H_FILE: Bitboard = 0x7F7F7F7F7F7F7F7F;

/// A struct to represent a chess piece
#[derive(Ord, PartialOrd, Eq, PartialEq, Debug, Clone, Copy, Serialize, Deserialize)]
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

#[rustfmt::skip]
#[derive(Ord, PartialOrd, Eq, PartialEq, Debug, Clone, Copy)]
/// A struct to represent a square on a chess board
pub enum Square {
        A1, B1, C1, D1, E1, F1, G1, H1,
        A2, B2, C2, D2, E2, F2, G2, H2,
        A3, B3, C3, D3, E3, F3, G3, H3,
        A4, B4, C4, D4, E4, F4, G4, H4,
        A5, B5, C5, D5, E5, F5, G5, H5,
        A6, B6, C6, D6, E6, F6, G6, H6,
        A7, B7, C7, D7, E7, F7, G7, H7,
        A8, B8, C8, D8, E8, F8, G8, H8,
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

#[derive(Clone, Default, Debug, Deserialize, Serialize)]
/// A struct to represent a chess game pre-computed moves for each piece
pub struct Game {
    pub wp_moves: Vec<Bitboard>,
    pub bp_moves: Vec<Bitboard>,
    pub knight_moves: Vec<Vec<Bitboard>>,
    pub king_moves: Vec<Vec<Bitboard>>,
}

impl Game {
    /// A function to create pre-computed moves for each piece
    pub fn new() -> Self {
        Game {
            wp_moves: Self::computed_pawn_moves(&Color::White),
            bp_moves: Self::computed_pawn_moves(&Color::Black),
            knight_moves: Self::computed_knight_moves(),
            king_moves: Self::computed_king_moves(),
        }
    }

    /// A function to compute pawn moves
    pub fn computed_pawn_moves(color: &Color) -> Vec<Bitboard> {
        let mut pawn_moves = Vec::new();
        for i in 0..64 {
            let boards = Self::check_pawn_moves(i, &color);
            pawn_moves.push(boards);
        }
        pawn_moves
    }

    /// A function to compute knight moves
    pub fn computed_knight_moves() -> Vec<Vec<Bitboard>> {
        let moves = vec![vec![]];
        moves
    }
    /// A function to compute king moves
    pub fn computed_king_moves() -> Vec<Vec<Bitboard>> {
        let moves = vec![vec![]];
        moves
    }

    /// possible pawn_moves
    pub fn check_pawn_moves(square: u8, color: &Color) -> Bitboard {
        let mut moves = 0u64;
        let mut board: Bitboard = 0u64;

        board |= 1u64 << square as u64; // Set the bit at the square

        match color {
            Color::White => {
                if square < (Square::A3 as u8) {
                    moves |= board << 16; // Initial double step move
                    moves |= board << 8; // White pawns move up the board
                }
                moves |= board << 8; // White pawns move up the board
            }
            Color::Black => {
                if square > (Square::H6 as u8) {
                    moves |= board >> 16; // Initial double step move
                    moves |= board >> 8; // Black pawns move down the board
                }
                moves |= board >> 8; // Black pawns move down the board
            }
        }
        moves
    }

    /// possible pawn_attacks
    pub fn attacks_pawn_moves(square: Square, color: Color) -> Bitboard {
        let mut attacks = 0u64;
        let mut board: Bitboard = 0u64;

        board |= 1u64 << square as u64; // Set the bit at the square

        match color {
            Color::White => {
                attacks |= (board << 9) & NOT_A_FILE; // White pawns attack up-right
                attacks |= (board << 7) & NOT_H_FILE; // White pawns attack up-left
            }
            Color::Black => {
                attacks |= (board >> 9) & NOT_H_FILE; // Black pawns attack down-left
                attacks |= (board >> 7) & NOT_A_FILE; // Black pawns attack down-right
            }
        }
        attacks
    }
}

impl ChessBoard {
    /// A function to create a new chess board
    pub fn new() -> Self {
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
    pub fn select_piece_move(&mut self, from: u64, to: u64, piece: Piece) {
        match piece {
            Piece::WhitePawn => {
                // Logic for white pawn
                self.white_pawn_moves();
            }
            Piece::BlackPawn => {
                // Logic for black pawn
            }
            Piece::WhiteKnight | Piece::BlackKnight => {
                // Logic for knights (same for both colors)
            }
            Piece::WhiteBishop | Piece::BlackBishop => {
                // Logic for bishops
            }
            Piece::WhiteRook | Piece::BlackRook => {
                // Logic for rooks
            }
            Piece::WhiteQueen | Piece::BlackQueen => {
                // Logic for queens
            }
            Piece::WhiteKing => {
                // Logic for white king
            }
            Piece::BlackKing => {
                // Logic for black king
            }
        }
    }

    /// A function to move a piece on the board
    pub fn white_pawn_moves(&mut self) {
        // (moves & (1u64 << 39)) != 0 // if this is true then the move is valid (self.make_move(20, 12, &mut bitboard));
    }

    /// A function to move a piece on the board
    pub fn make_move(&mut self, from_square: u64, to_square: u64, bitboard: &mut Bitboard) {
        let from_bit = 1u64 << from_square as u32;
        let to_bit = 1u64 << to_square as u32;

        // Clear the bit at the original position
        *bitboard &= !from_bit;

        // Set the bit at the new position
        *bitboard |= to_bit;
    }
}
