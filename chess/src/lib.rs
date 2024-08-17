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

    all_white_pieces: Bitboard,

    all_black_pieces: Bitboard,

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

        if self.white_attack_mask() & self.bK != 0 {
            fen.push_str(";bk_inCheck");
        }

        if self.black_attack_mask() & self.wK != 0 {
            fen.push_str(";wk_inCheck");
        }

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
    ) -> bool {
        let from_square = Square::from_str(from).unwrap();
        let to_square = Square::from_str(to).unwrap();
        log::info!("Capturing called for: {:?}", captured_piece);
        match piece {
            Piece::WhitePawn => {
                log::info!("White Pawn is Capturing");
                self.white_pawn_captures(from_square, to_square, captured_piece)
            }
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

    /* ----------------------Piece Capturing Logic------------------------------- */

    /// A function to capute pieces
    pub fn white_pawn_captures(&mut self, from: Square, to: Square, captured_piece: Piece) -> bool {
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

                    self.all_white_pieces &= !from_bit;
                    self.all_white_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using black pawn
    pub fn black_pawn_captures(&mut self, from: Square, to: Square, captured_piece: Piece) -> bool {
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

                    self.all_black_pieces &= !from_bit;
                    self.all_black_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using white knight
    pub fn white_knight_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> bool {
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

                    self.all_white_pieces &= !from_bit;
                    self.all_white_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using black knight
    pub fn black_knight_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> bool {
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

                    self.all_black_pieces &= !from_bit;
                    self.all_black_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using white king
    pub fn white_king_captures(&mut self, from: Square, to: Square, captured_piece: Piece) -> bool {
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

                    self.all_white_pieces &= !from_bit;
                    self.all_white_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using black king
    pub fn black_king_captures(&mut self, from: Square, to: Square, captured_piece: Piece) -> bool {
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

                    self.all_black_pieces &= !from_bit;
                    self.all_black_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using white rook
    pub fn white_rook_captures(&mut self, from: Square, to: Square, captured_piece: Piece) -> bool {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = rook_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 && self.all_black_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_black_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.wR &= !from_bit;

                    // Set the bit at the new position
                    self.wR |= to_bit;

                    self.all_white_pieces &= !from_bit;
                    self.all_white_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using black rook
    pub fn black_rook_captures(&mut self, from: Square, to: Square, captured_piece: Piece) -> bool {
        let from_bit = 1u64 << from as u32;
        let to_bit = 1u64 << to as u32;

        let board = rook_attacks_on_the_fly(from, self.all_pieces);

        if board & to_bit != 0 && self.all_white_pieces & to_bit != 0 {
            // Remove the opponent's piece from its bitboard
            match self.remove_white_piece(to_bit, captured_piece) {
                Ok(true) => {
                    // Clear the bit at the original position
                    self.bR &= !from_bit;

                    // Set the bit at the new position
                    self.bR |= to_bit;

                    self.all_black_pieces &= !from_bit;
                    self.all_black_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using white bishop
    pub fn white_bishop_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> bool {
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

                    self.all_white_pieces &= !from_bit;
                    self.all_white_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using black bishop
    pub fn black_bishop_captures(
        &mut self,
        from: Square,
        to: Square,
        captured_piece: Piece,
    ) -> bool {
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

                    self.all_black_pieces &= !from_bit;
                    self.all_black_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;
                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using white queen
    pub fn white_queen_capture(&mut self, from: Square, to: Square, captured_piece: Piece) -> bool {
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

                    self.all_white_pieces &= !from_bit;
                    self.all_white_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /// A function to capute pieces using black queen
    pub fn black_queen_capture(&mut self, from: Square, to: Square, captured_piece: Piece) -> bool {
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

                    self.all_black_pieces &= !from_bit;
                    self.all_black_pieces |= to_bit;
                    self.all_pieces = self.all_white_pieces | self.all_black_pieces;

                    true
                }
                _ => false,
            }
        } else {
            false
        }
    }

    /* ----------------------Piece Movement Logic------------------------------- */

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

    /// A function to calculate attacks mask for white pieces
    pub fn white_attack_mask(&self) -> Bitboard {
        let mut attacks = 0;

        // Pawn attacks
        attacks |= (self.wP << 7) & NOT_H_FILE;
        attacks |= (self.wP << 9) & NOT_A_FILE;

        // Knight attacks
        let mut knights = self.wN;
        while knights != 0 {
            let knight_pos = knights.trailing_zeros() as usize;
            attacks |= KNIGHT_MOVES[knight_pos as usize];
            knights &= knights - 1; // Remove the LSB
        }

        // King attacks
        let mut kings = self.wK;
        while kings != 0 {
            let king_pos = kings.trailing_zeros() as usize;
            attacks |= KING_MOVES[king_pos as usize];
            kings &= kings - 1; // Remove the LSB
        }

        // Bishop attacks
        let mut bishops = self.wB;
        while bishops != 0 {
            let bishop_pos = bishops.trailing_zeros() as usize;
            let square = Square::usize_to_square(bishop_pos);
            attacks |= bishop_attacks_on_the_fly(square, self.all_pieces);
            bishops &= bishops - 1; // Remove the LSB
        }

        // Rook attacks
        let mut rooks = self.wR;
        while rooks != 0 {
            let rook_pos = rooks.trailing_zeros() as usize;
            let square = Square::usize_to_square(rook_pos);
            attacks |= rook_attacks_on_the_fly(square, self.all_pieces);
            rooks &= rooks - 1; // Remove the LSB
        }

        // Queen attacks
        let mut queens = self.wQ;
        while queens != 0 {
            let queen_pos = queens.trailing_zeros() as usize;
            let square = Square::usize_to_square(queen_pos);
            attacks |= queen_attacks_on_the_fly(square, self.all_pieces);
            queens &= queens - 1; // Remove the LSB
        }

        attacks
    }

    /// A function to calculate attacks mask for black pieces
    pub fn black_attack_mask(&self) -> Bitboard {
        let mut attacks = 0;

        // Pawn attacks
        attacks |= (self.bP >> 7) & NOT_A_FILE;
        attacks |= (self.bP >> 9) & NOT_H_FILE;

        // Knight attacks
        let mut knights = self.bN;
        while knights != 0 {
            let knight_pos = knights.trailing_zeros() as usize;
            attacks |= KNIGHT_MOVES[knight_pos as usize];
            knights &= knights - 1; // Remove the LSB
        }

        // King attacks
        let mut kings = self.bK;
        while kings != 0 {
            let king_pos = kings.trailing_zeros() as usize;
            attacks |= KING_MOVES[king_pos as usize];
            kings &= kings - 1; // Remove the LSB
        }

        // Bishop attacks
        let mut bishops = self.bB;
        while bishops != 0 {
            let bishop_pos = bishops.trailing_zeros() as usize;
            let square = Square::usize_to_square(bishop_pos);
            attacks |= bishop_attacks_on_the_fly(square, self.all_pieces);
            bishops &= bishops - 1; // Remove the LSB
        }

        // Rook attacks
        let mut rooks = self.bR;
        while rooks != 0 {
            let rook_pos = rooks.trailing_zeros() as usize;
            let square = Square::usize_to_square(rook_pos);
            attacks |= rook_attacks_on_the_fly(square, self.all_pieces);
            rooks &= rooks - 1; // Remove the LSB
        }

        // Queen attacks
        let mut queens = self.bQ;
        while queens != 0 {
            let queen_pos = queens.trailing_zeros() as usize;
            let square = Square::usize_to_square(queen_pos);
            attacks |= queen_attacks_on_the_fly(square, self.all_pieces);
            queens &= queens - 1; // Remove the LSB
        }

        attacks
    }

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

        let board = rook_attacks_on_the_fly(from, self.all_pieces);

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

        let board = rook_attacks_on_the_fly(from, self.all_pieces);

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
        log::info!("Black piece is being captured: {:?}", captured_piece);
        match captured_piece {
            Piece::BlackPawn => {
                if self.bP & to_bit != 0 {
                    self.bP &= !to_bit;
                    log::info!("Black Pawn captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::BlackKnight => {
                if self.bN & to_bit != 0 {
                    self.bN &= !to_bit;
                    log::info!("Black Knight captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::BlackBishop => {
                if self.bB & to_bit != 0 {
                    self.bB &= !to_bit;
                    log::info!("Black Bishop captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::BlackRook => {
                if self.bR & to_bit != 0 {
                    self.bR &= !to_bit;
                    log::info!("Black Rook captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::BlackQueen => {
                if self.bQ & to_bit != 0 {
                    self.bQ &= !to_bit;
                    log::info!("Black Queen captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::BlackKing => {
                if self.bK & to_bit != 0 {
                    self.bK &= !to_bit;
                    log::info!("Black King captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            _ => Err(ChessError::PieceNotFound),
        }
    }

    /// A function to remove a white piece from the board
    pub fn remove_white_piece(&mut self, to_bit: u64, captured_piece: Piece) -> Result<bool> {
        match captured_piece {
            Piece::WhitePawn => {
                if self.wP & to_bit != 0 {
                    self.wP &= !to_bit;
                    log::info!("White Pawn captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::WhiteKnight => {
                if self.wN & to_bit != 0 {
                    self.wN &= !to_bit;
                    log::info!("Black Knight captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::WhiteBishop => {
                if self.wB & to_bit != 0 {
                    self.wB &= !to_bit;
                    log::info!("Black Bishop captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::WhiteRook => {
                if self.wR & to_bit != 0 {
                    self.wR &= !to_bit;
                    log::info!("Black Rook captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::WhiteQueen => {
                if self.wQ & to_bit != 0 {
                    self.wQ &= !to_bit;
                    log::info!("Black Queen captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            Piece::WhiteKing => {
                if self.wK & to_bit != 0 {
                    self.wK &= !to_bit;
                    log::info!("Black King captured");
                    Ok(true)
                } else {
                    Err(ChessError::PieceNotFound)
                }
            }
            _ => Err(ChessError::PieceNotFound),
        }
    }
}
