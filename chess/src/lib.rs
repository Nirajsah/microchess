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
    pub static ref WHITE_ATTACKS: Vec<Bitboard> = computed_pawn_attacks(&Color::White);
    pub static ref BLACK_ATTACKS: Vec<Bitboard> = computed_pawn_attacks(&Color::Black);
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
    CapturePiece {
        from: String,
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
}

pub type Result<T> = std::result::Result<T, ChessError>;

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

#[derive(Clone, Default, Debug, Serialize, Deserialize, SimpleObject)]
pub struct Move {
    white: Option<String>,
    black: Option<String>,
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
}

impl Game {
    /// A function to create a new game
    pub fn new() -> Self {
        Game {
            board: ChessBoard::new_game(),
            active: Color::White,
            moves: vec![],
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

    pub captured_pieces: Vec<Piece>,

    #[serde(skip)]
    all_white_pieces: Bitboard,

    #[serde(skip)]
    all_black_pieces: Bitboard,

    #[serde(skip)]
    all_pieces: Bitboard,
}

impl ChessBoard {
    /// A function to create a new chess board
    pub fn new_game() -> Self {
        ChessBoard {
            wP: 65280,
            wN: 66,
            wB: 36,
            wR: 129,
            wQ: 8,
            wK: 16,
            bP: 71776119061217280,
            bN: 4755801206503243776,
            bB: 2594073385365405696,
            bR: 9295429630892703744,
            bQ: 576460752303423488,
            bK: 1152921504606846976,

            captured_pieces: vec![],
            all_white_pieces: 65535,
            all_black_pieces: 18446462598732840960,
            all_pieces: 18446462598732906495,
        }
    }

    /// A function to generate FEN string using bitboard
    pub fn to_fen(&self) -> String {
        let bitboards = [
            self.wP, self.wN, self.wB, self.wR, self.wQ, self.wK, self.bP, self.bN, self.bB,
            self.bR, self.bQ, self.bK,
        ];
        let pieces = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'];

        let mut fen = String::new();

        for rank in (0..8).rev() {
            // Iterate over ranks 7 to 0
            let mut empty_squares = 0;

            for file in 0..8 {
                let square = rank * 8 + file;
                let mut piece_found = false;

                for (i, &bitboard) in bitboards.iter().enumerate() {
                    if (bitboard & (1u64 << square)) != 0 {
                        if empty_squares > 0 {
                            fen.push_str(&empty_squares.to_string());
                            empty_squares = 0;
                        }
                        fen.push(pieces[i]);
                        piece_found = true;
                        break;
                    }
                }

                if !piece_found {
                    empty_squares += 1;
                }
            }

            if empty_squares > 0 {
                fen.push_str(&empty_squares.to_string());
            }

            if rank > 0 {
                fen.push('/');
            }
        }

        // Add placeholder values for the rest of the FEN string
        fen.push_str(" w KQkq - 0 1");

        fen
    }

    /// A function to create capture string
    pub fn create_capture_string(from: &str, to: &str) -> String {
        // Extract the file from each square (the first character)
        let from_file = &from[0..1];
        let to_file = &to[0..1];

        // Extract the rank from the 'to' square (the second character)
        let to_rank = &to[1..2];

        // Combine them into the desired format: "cxb4"
        format!("{}x{}{}", from_file, to_file, to_rank)
    }

    pub fn get_piece(piece: &str) -> Result<Piece> {
        let piece = match piece {
            "wP" => Piece::WhitePawn,
            "wN" => Piece::WhiteKnight,
            "wB" => Piece::WhiteBishop,
            "wR" => Piece::WhiteRook,
            "wQ" => Piece::WhiteQueen,
            "wK" => Piece::WhiteKing,
            "bP" => Piece::BlackPawn,
            "bN" => Piece::BlackKnight,
            "bB" => Piece::BlackBishop,
            "bR" => Piece::BlackRook,
            "bQ" => Piece::BlackQueen,
            "bK" => Piece::BlackKing,
            _ => Err(ChessError::InvalidPiece)?,
        };
        Ok(piece)
    }

    #[allow(unused_variables)]
    /// A function to capture a piece on the board
    pub fn capture_piece(
        &mut self,
        from: &str,
        to: &str,
        piece: Piece,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_square = Square::from_str(from).unwrap();
        let to_square = Square::from_str(to).unwrap();
        log::info!("Capturing piece: {:?}", captured_piece);
        match piece {
            Piece::WhitePawn => self.white_pawn_captures(from_square, to_square, captured_piece),
            Piece::BlackPawn => self.black_pawn_captures(from_square, to_square, captured_piece),

            Piece::WhiteKnight | Piece::BlackKnight => {
                if piece == Piece::WhiteKnight {
                    self.white_knight_captures(from_square, to_square, captured_piece)
                } else {
                    self.black_knight_captures(from_square, to_square, captured_piece)
                }
            }

            Piece::WhiteBishop | Piece::BlackBishop => {
                if piece == Piece::WhiteBishop {
                    self.white_bishop_captures(from_square, to_square, captured_piece)
                } else {
                    self.black_bishop_captures(from_square, to_square, captured_piece)
                }
            }
            Piece::WhiteRook | Piece::BlackRook => {
                if piece == Piece::WhiteRook {
                    self.white_rook_captures(from_square, to_square, captured_piece)
                } else {
                    self.black_rook_captures(from_square, to_square, captured_piece)
                }
            }
            Piece::WhiteQueen | Piece::BlackQueen => {
                if piece == Piece::WhiteQueen {
                    self.white_queen_capture(from_square, to_square, captured_piece)
                } else {
                    self.black_queen_capture(from_square, to_square, captured_piece)
                }
            }

            Piece::WhiteKing | Piece::BlackKing => {
                if piece == Piece::WhiteKing {
                    self.white_king_captures(from_square, to_square, captured_piece)
                } else {
                    self.black_king_captures(from_square, to_square, captured_piece)
                }
            }
        }
    }

    /// A function to select a piece move
    pub fn select_piece_to_move(&mut self, from: &str, to: &str, piece: Piece) -> Result<bool> {
        let from_square = Square::from_str(from).unwrap();
        let to_square = Square::from_str(to).unwrap();
        match piece {
            Piece::WhitePawn => self.white_pawn_moves(from_square, to_square),
            Piece::BlackPawn => self.black_pawn_moves(from_square, to_square),

            Piece::WhiteKnight | Piece::BlackKnight => {
                self.knight_moves(from_square, to_square, piece)
            }

            Piece::WhiteBishop | Piece::BlackBishop => {
                if piece == Piece::WhiteBishop {
                    self.white_bishop_moves(from_square, to_square)
                } else {
                    self.black_bishop_moves(from_square, to_square)
                }
            }
            Piece::WhiteRook | Piece::BlackRook => {
                if piece == Piece::WhiteRook {
                    self.white_rook_moves(from_square, to_square)
                } else {
                    self.black_rook_moves(from_square, to_square)
                }
            }
            Piece::WhiteQueen | Piece::BlackQueen => {
                if piece == Piece::WhiteQueen {
                    self.white_queen_moves(from_square, to_square)
                } else {
                    self.black_queen_moves(from_square, to_square)
                }
            }

            Piece::WhiteKing | Piece::BlackKing => self.king_moves(from_square, to_square, piece),
        }
    }

    /* ----------------------Piece Capturing Logic------------------------------- */

    /// A function to capute pieces
    pub fn white_pawn_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if WHITE_ATTACKS[from as usize] & to_bit != 0 && self.all_black_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_black_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.wP &= !from_bit;

                    // Set the bit at the new position
                    self.wP |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using black pawn
    pub fn black_pawn_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if BLACK_ATTACKS[from as usize] & to_bit != 0 && self.all_white_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_white_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.bP &= !from_bit;

                    // Set the bit at the new position
                    self.bP |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using white knight
    pub fn white_knight_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if KNIGHT_MOVES[from as usize] & to_bit != 0 && self.all_black_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_black_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.wN &= !from_bit;

                    // Set the bit at the new position
                    self.wN |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using black knight
    pub fn black_knight_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if KNIGHT_MOVES[from as usize] & to_bit != 0 && self.all_white_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_white_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.bN &= !from_bit;

                    // Set the bit at the new position
                    self.bN |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using white king
    pub fn white_king_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if KING_MOVES[from as usize] & to_bit != 0 && self.all_black_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_black_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.wK &= !from_bit;

                    // Set the bit at the new position
                    self.wK |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using black king
    pub fn black_king_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if KING_MOVES[from as usize] & to_bit != 0 && self.all_white_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_white_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.bK &= !from_bit;

                    // Set the bit at the new position
                    self.bK |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using white rook
    pub fn white_rook_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = generate_rook_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 && self.all_black_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_black_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.wR &= !from_bit;

                    // Set the bit at the new position
                    self.wR |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using black rook
    pub fn black_rook_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = generate_rook_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 && self.all_white_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_white_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.bR &= !from_bit;

                    // Set the bit at the new position
                    self.bR |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using white bishop
    pub fn white_bishop_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = bishop_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 && self.all_black_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_black_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.wB &= !from_bit;

                    // Set the bit at the new position
                    self.wB |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using black bishop
    pub fn black_bishop_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = bishop_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 && self.all_white_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_white_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.bB &= !from_bit;

                    // Set the bit at the new position
                    self.bB |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using white queen
    pub fn white_queen_capture(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = queen_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 && self.all_black_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_black_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.wQ &= !from_bit;

                    // Set the bit at the new position
                    self.wQ |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to capute pieces using black queen
    pub fn black_queen_capture(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = queen_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 && self.all_white_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_white_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.bQ &= !from_bit;

                    // Set the bit at the new position
                    self.bQ |= to_bit;

                    Ok(true)
                }
                _ => return Err(ChessError::PieceNotFound),
            }
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /* ----------------------Piece Movement Logic------------------------------- */

    /// A function to move a white pawn piece on the board
    pub fn white_pawn_moves(&mut self, from: Square, to: Square) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        if WHITE_MOVES[from as usize] & to_bit != 0 && self.all_pieces & to_bit == 0 {
            // Clear the bit at the original position
            self.wP &= !from_bit;

            // Set the bit at the new position
            self.wP |= to_bit;

            // Update every piece bitboard
            self.all_white_pieces &= !from_bit;
            self.all_white_pieces |= to_bit;
            self.all_pieces = self.all_white_pieces | self.all_black_pieces;

            Ok(true)
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to move black pawn piece on the board
    pub fn black_pawn_moves(&mut self, from: Square, to: Square) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;
        if BLACK_MOVES[from as usize] & to_bit != 0 && self.all_pieces & to_bit == 0 {
            // Clear the bit at the original position
            self.bP &= !from_bit;

            // Set the bit at the new position
            self.bP |= to_bit;

            // Update every piece bitboard
            self.all_black_pieces &= !from_bit;
            self.all_black_pieces |= to_bit;
            self.all_pieces = self.all_white_pieces | self.all_black_pieces;

            Ok(true)
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to move a knight piece on the board
    pub fn knight_moves(&mut self, from: Square, to: Square, piece: Piece) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        match piece {
            Piece::WhiteKnight => {
                if KNIGHT_MOVES[from as usize] & to_bit != 0 && self.all_pieces & to_bit == 0 {
                    // Clear the bit at the original position
                    self.wN &= !from_bit;

                    // Set the bit at the new position
                    self.wN |= to_bit;

                    // Update every piece bitboard
                    self.all_white_pieces &= !from_bit;
                    self.all_white_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }

            Piece::BlackKnight => {
                if KNIGHT_MOVES[from as usize] & to_bit != 0 && self.all_pieces & to_bit == 0 {
                    // Clear the bit at the original position
                    self.bN &= !from_bit;

                    // Set the bit at the new position
                    self.bN |= to_bit;

                    // Update every piece bitboard
                    self.all_black_pieces &= !from_bit;
                    self.all_black_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            _ => Err(ChessError::PieceNotFound),
        }
    }

    /// A function to move a king piece on the board
    pub fn king_moves(&mut self, from: Square, to: Square, piece: Piece) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        match piece {
            Piece::WhiteKing => {
                if KING_MOVES[from as usize] & to_bit != 0 && self.all_pieces & to_bit == 0 {
                    // Clear the bit at the original position
                    self.wK &= !from_bit;

                    // Set the bit at the new position
                    self.wK |= to_bit;

                    // Update every piece bitboard
                    self.all_white_pieces &= !from_bit;
                    self.all_white_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::BlackKing => {
                if KING_MOVES[from as usize] & to_bit != 0 && self.all_pieces & to_bit == 0 {
                    // Clear the bit at the original position
                    self.bK &= !from_bit;

                    // Set the bit at the new position
                    self.bK |= to_bit;

                    // Update every piece bitboard
                    self.all_black_pieces &= !from_bit;
                    self.all_black_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            _ => Err(ChessError::PieceNotFound),
        }
    }

    /// A function to move a white rook piece on the board
    pub fn white_rook_moves(&mut self, from: Square, to: Square) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = generate_rook_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 {
            // Clear the bit at the original position
            self.wR &= !from_bit;

            // Set the bit at the new position
            self.wR |= to_bit;

            // Update every piece bitboard
            self.all_white_pieces &= !from_bit;
            self.all_white_pieces |= to_bit;
            self.all_pieces = self.all_white_pieces | self.all_black_pieces;

            Ok(true)
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to move a black rook piece on the board
    pub fn black_rook_moves(&mut self, from: Square, to: Square) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = generate_rook_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 {
            // Clear the bit at the original position
            self.bR &= !from_bit;

            // Set the bit at the new position
            self.bR |= to_bit;

            // Update every piece bitboard
            self.all_black_pieces &= !from_bit;
            self.all_black_pieces |= to_bit;
            self.all_pieces = self.all_white_pieces | self.all_black_pieces;

            Ok(true)
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    pub fn white_bishop_moves(&mut self, from: Square, to: Square) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = bishop_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 {
            // Clear the bit at the original position
            self.wB &= !from_bit;

            // Set the bit at the new position
            self.wB |= to_bit;

            // Update every piece bitboard
            self.all_white_pieces &= !from_bit;
            self.all_white_pieces |= to_bit;
            self.all_pieces = self.all_white_pieces | self.all_black_pieces;

            Ok(true)
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    pub fn black_bishop_moves(&mut self, from: Square, to: Square) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = bishop_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 {
            // Clear the bit at the original position
            self.bB &= !from_bit;

            // Set the bit at the new position
            self.bB |= to_bit;

            // Update every piece bitboard
            self.all_black_pieces &= !from_bit;
            self.all_black_pieces |= to_bit;
            self.all_pieces = self.all_white_pieces | self.all_black_pieces;

            Ok(true)
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to move a white queen piece on the board
    pub fn white_queen_moves(&mut self, from: Square, to: Square) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = queen_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 {
            // Clear the bit at the original position
            self.wQ &= !from_bit;

            // Set the bit at the new position
            self.wQ |= to_bit;

            // Update every piece bitboard
            self.all_white_pieces &= !from_bit;
            self.all_white_pieces |= to_bit;
            self.all_pieces = self.all_white_pieces | self.all_black_pieces;

            Ok(true)
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to move a black queen piece on the board
    pub fn black_queen_moves(&mut self, from: Square, to: Square) -> Result<bool> {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = queen_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 {
            // Clear the bit at the original position
            self.bQ &= !from_bit;

            // Set the bit at the new position
            self.bQ |= to_bit;

            // Update every piece bitboard
            self.all_black_pieces &= !from_bit;
            self.all_black_pieces |= to_bit;
            self.all_pieces = self.all_white_pieces | self.all_black_pieces;

            Ok(true)
        } else {
            Err(ChessError::PieceNotFound)
        }
    }

    /// A function to remove a black piece from the board
    pub fn remove_black_piece(&mut self, to_bit: u64, captured_piece: Piece) -> Result<bool> {
        match captured_piece {
            Piece::BlackPawn => {
                if self.bP & to_bit != 0 {
                    self.bP &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::BlackKnight => {
                if self.bN & to_bit != 0 {
                    self.bN &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::BlackBishop => {
                if self.bB & to_bit != 0 {
                    self.bB &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::BlackRook => {
                if self.bR & to_bit != 0 {
                    self.bR &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::BlackQueen => {
                if self.bQ & to_bit != 0 {
                    self.bQ &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::BlackKing => {
                if self.bK & to_bit != 0 {
                    self.bK &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            _ => return Err(ChessError::PieceNotFound),
        }

        // Update the overall black pieces bitboard
        self.all_black_pieces &= !to_bit;
        self.all_pieces = self.all_white_pieces | self.all_black_pieces;
        Ok(true)
    }

    /// A function to remove a white piece from the board
    pub fn remove_white_piece(&mut self, to_bit: u64, captured_piece: Piece) -> Result<bool> {
        match captured_piece {
            Piece::WhitePawn => {
                if self.wP & to_bit != 0 {
                    self.wP &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::WhiteKnight => {
                if self.wN & to_bit != 0 {
                    self.wN &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::WhiteBishop => {
                if self.wB & to_bit != 0 {
                    self.wB &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::WhiteRook => {
                if self.wR & to_bit != 0 {
                    self.wR &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::WhiteQueen => {
                if self.wQ & to_bit != 0 {
                    self.wQ &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            Piece::WhiteKing => {
                if self.wK & to_bit != 0 {
                    self.wK &= !to_bit;
                } else {
                    return Err(ChessError::PieceNotFound);
                }
            }
            _ => return Err(ChessError::PieceNotFound),
        }

        // Update the overall white pieces bitboard
        self.all_white_pieces &= !to_bit;
        self.all_pieces = self.all_white_pieces | self.all_black_pieces;
        Ok(true)
    }
}
