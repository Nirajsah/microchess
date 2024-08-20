#![allow(unused_imports)]
use crate::{
    bishop_attacks_on_the_fly, computed_king_moves, computed_knight_attacks, computed_pawn_attacks,
    computed_pawn_moves, lazy_static, rook_attacks_on_the_fly, Bitboard, Color, Piece, NOT_A_FILE,
    NOT_H_FILE,
};
use async_graphql::SimpleObject;
use serde::{Deserialize, Serialize};

use crate::Square;

pub type BitBoard = u64;

#[derive(Debug)]
pub enum ChessError {
    PieceNotFound,
    InvalidPiece,
}

lazy_static! {
    pub static ref WHITE_PMOVES: Vec<BitBoard> = computed_pawn_moves(&Color::White);
    pub static ref WHITE_PATTACKS: Vec<Bitboard> = computed_pawn_attacks(&Color::White);
    pub static ref BLACK_PATTACKS: Vec<Bitboard> = computed_pawn_attacks(&Color::Black);
    pub static ref BLACK_PMOVES: Vec<Bitboard> = computed_pawn_moves(&Color::Black);
    pub static ref KNIGHT_MOVES: Vec<Bitboard> = computed_knight_attacks();
    pub static ref KING_MOVES: Vec<Bitboard> = computed_king_moves();
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, SimpleObject)]
pub struct ChessBoard {
    pub wP: BitBoard,
    pub wN: BitBoard,
    pub wB: BitBoard,
    pub wR: BitBoard,
    pub wQ: BitBoard,
    pub wK: BitBoard,
    pub bP: BitBoard,
    pub bN: BitBoard,
    pub bB: BitBoard,
    pub bR: BitBoard,
    pub bQ: BitBoard,
    pub bK: BitBoard,
}

impl ChessBoard {
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

    /// A function to get the mutable bitboard of a piece
    pub fn get_mut_board(&mut self, piece: &Piece) -> &mut BitBoard {
        match piece {
            Piece::WhitePawn => &mut self.wP,
            Piece::WhiteKnight => &mut self.wN,
            Piece::WhiteBishop => &mut self.wB,
            Piece::WhiteRook => &mut self.wR,
            Piece::WhiteQueen => &mut self.wQ,
            Piece::WhiteKing => &mut self.wK,
            Piece::BlackPawn => &mut self.bP,
            Piece::BlackKnight => &mut self.bN,
            Piece::BlackBishop => &mut self.bB,
            Piece::BlackRook => &mut self.bR,
            Piece::BlackQueen => &mut self.bQ,
            Piece::BlackKing => &mut self.bK,
        }
    }

    ///A function to generate FEN string using bitboard
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

        // if self.white_attack_mask() & self.bK != 0 {
        //     fen.push_str(";bk_inCheck");
        // }

        // if self.black_attack_mask() & self.wK != 0 {
        //     fen.push_str(";wk_inCheck");
        // }

        fen
    }

    /// Return a Piece from a string
    pub fn get_piece(piece: &str) -> Result<Piece, ChessError> {
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

    #[rustfmt::skip]
    /// Returns the bitboard of all pieces on the board
    pub fn all_pieces(&self) -> BitBoard {
        self.wP | self.wN | self.wB | self.wR | self.wQ | self.wK |
        self.bP | self.bN | self.bB | self.bR | self.bQ | self.bK
    }

    /// Returns the bitboard of all white pieces on the board
    pub fn white_pieces(&self) -> BitBoard {
        self.wP | self.wN | self.wB | self.wR | self.wQ | self.wK
    }

    /// Returns the bitboard of all black pieces on the board
    pub fn black_pieces(&self) -> BitBoard {
        self.bP | self.bN | self.bB | self.bR | self.bQ | self.bK
    }

    /// Caputures a piece on the board
    pub fn capture_piece(&mut self, to: Square, piece: &Piece) {
        let c_board = self.get_mut_board(&piece);
        if *c_board & (1u64 << to as usize) != 0 {
            Self::clear(to, c_board);
        } else {
            log::info!("No piece to capture");
        }
    }
    /// Sets a piece on the board
    pub fn set(square: Square, board: &mut BitBoard) {
        *board |= 1u64 << square as usize;
    }

    /// Clears a piece on the board
    pub fn clear(square: Square, board: &mut BitBoard) {
        *board &= !(1u64 << square as usize);
    }

    /// Moves a piece on the board
    pub fn move_piece(&mut self, from: Square, to: Square, piece: &Piece) {
        let board = self.get_mut_board(&piece);
        if *board & (1u64 << from as usize) != 0 {
            Self::clear(from, board);
            Self::set(to, board);
        } else {
            log::info!("No piece to move");
        }
    }

    /** ---------------------------------------- Piece Move Logic ----------------------------------------- */

    /// Moves a white pawn
    pub fn wP_moves(&mut self, from: Square, to: Square, piece: &Piece) {
        if WHITE_PMOVES[from as usize] & (1u64 << to as usize) != 0 {
            self.move_piece(from, to, piece);
        } else {
            log::info!("Invalid move");
        }
    }

    /// Moves a black pawn
    pub fn bP_moves(&mut self, from: Square, to: Square, piece: &Piece) {
        if BLACK_PMOVES[from as usize] & (1u64 << to as usize) != 0 {
            self.move_piece(from, to, piece);
        } else {
            log::info!("Invalid move");
        }
    }

    /// Moves a knight
    pub fn knight_moves(&mut self, from: Square, to: Square, piece: &Piece) {
        if KNIGHT_MOVES[from as usize] & (1u64 << to as usize) != 0 {
            self.move_piece(from, to, piece);
        } else {
            log::info!("Invalid move");
        }
    }

    /// Moves a King
    pub fn king_moves(&mut self, from: Square, to: Square, piece: &Piece) {
        if KING_MOVES[from as usize] & (1u64 << to as usize) != 0 {
            self.move_piece(from, to, piece);
        } else {
            log::info!("Invalid move");
        }
    }

    /// Moves a Rook
    pub fn rook_moves(&mut self, from: Square, to: Square, piece: &Piece) {
        if rook_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) != 0 {
            self.move_piece(from, to, piece);
        } else {
            log::info!("Invalid move");
        }
    }

    /// Moves a Bishop
    pub fn bishop_moves(&mut self, from: Square, to: Square, piece: &Piece) {
        if bishop_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) != 0 {
            self.move_piece(from, to, piece);
        } else {
            log::info!("Invalid move");
        }
    }

    /** --------------------------------Piece Capture Logic---------------------------------- */

    /// White pawn captures
    pub fn wP_captures(&mut self, from: Square, to: Square, piece: &Piece, c_captured: &Piece) {
        if WHITE_PATTACKS[from as usize] & (1u64 << to as usize) != 0 {
            self.capture_piece(to, c_captured);
            self.move_piece(from, to, piece);
        } else {
            log::info!("white pawn couldn't capture");
        }
    }

    /// Black pawn captures
    pub fn bP_captures(&mut self, from: Square, to: Square, board: &Piece, c_captured: &Piece) {
        if BLACK_PATTACKS[from as usize] & (1u64 << to as usize) != 0 {
            self.capture_piece(to, c_captured);
            self.move_piece(from, to, board);
        } else {
            log::info!("black pawn couldn't capture");
        }
    }

    /// Knight Captures
    pub fn knight_captures(&mut self, from: Square, to: Square, piece: &Piece, c_captured: &Piece) {
        if KNIGHT_MOVES[from as usize] & (1u64 << to as usize) != 0 {
            self.capture_piece(to, c_captured);
            self.move_piece(from, to, piece);
        } else {
            log::info!("Knight couldn't capture");
        }
    }

    /// King Captures
    pub fn king_captures(&mut self, from: Square, to: Square, piece: &Piece, c_captured: &Piece) {
        if KING_MOVES[from as usize] & (1u64 << to as usize) != 0 {
            self.capture_piece(to, c_captured);
            self.move_piece(from, to, piece);
        } else {
            log::info!("Knight couldn't capture");
        }
    }

    /// Rook Captures
    pub fn rook_captures(&mut self, from: Square, to: Square, piece: &Piece, c_captured: &Piece) {
        if rook_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) != 0 {
            self.capture_piece(to, c_captured);
            self.move_piece(from, to, piece);
        } else {
            log::info!("Rook couldn't capture");
        }
    }

    /// Bishop Captures
    pub fn bishop_captures(&mut self, from: Square, to: Square, piece: &Piece, c_captured: &Piece) {
        if bishop_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) != 0 {
            self.capture_piece(to, c_captured);
            self.move_piece(from, to, piece);
        } else {
            log::info!("Bishop couldn't capture");
        }
    }

    /** ----------------------------------------- Castling Logic ---------------------------------------------- */

    /// White King castling king side
    pub fn wK_castle_king_side(&mut self) {
        todo!()
    }

    /// White King castling queen side
    pub fn wK_castle_queen_side(&mut self) {
        todo!()
    }

    /// Black King castling king side
    pub fn bK_castle_king_side(&mut self) {
        todo!()
    }

    /// Black King castling queen side
    pub fn bK_castle_queen_side(&mut self) {
        todo!()
    }

    // pub fn white_attack_mask(&self) -> Bitboard {
    //     let mut attacks = 0u64;

    //     // Pawn attacks
    //     attacks |= (self.wP << 7) & NOT_H_FILE;
    //     attacks |= (self.wP << 9) & NOT_A_FILE;

    //     // Knight attacks
    //     let mut knights = self.wN;
    //     while knights != 0 {
    //         let knight_pos = knights.trailing_zeros() as usize;
    //         attacks |= KNIGHT_MOVES[knight_pos as usize];
    //         knights &= knights - 1; // Remove the LSB
    //     }

    //     // King attacks
    //     let mut kings = self.wK;
    //     while kings != 0 {
    //         let king_pos = kings.trailing_zeros() as usize;
    //         attacks |= KING_MOVES[king_pos as usize];
    //         kings &= kings - 1; // Remove the LSB
    //     }

    //     // Bishop attacks
    //     let mut bishops = self.wB;
    //     while bishops != 0 {
    //         let bishop_pos = bishops.trailing_zeros() as usize;
    //         let square = Square::usize_to_square(bishop_pos);
    //         attacks |= bishop_attacks_on_the_fly(square, self.all_pieces);
    //         bishops &= bishops - 1; // Remove the LSB
    //     }

    //     // Rook attacks
    //     let mut rooks = self.wR;
    //     while rooks != 0 {
    //         let rook_pos = rooks.trailing_zeros() as usize;
    //         let square = Square::usize_to_square(rook_pos);
    //         attacks |= rook_attacks_on_the_fly(square, self.all_pieces);
    //         rooks &= rooks - 1; // Remove the LSB
    //     }

    //     // Queen attacks
    //     let mut queens = self.wQ;
    //     while queens != 0 {
    //         let queen_pos = queens.trailing_zeros() as usize;
    //         let square = Square::usize_to_square(queen_pos);
    //         attacks |= queen_attacks_on_the_fly(square, self.all_pieces);
    //         queens &= queens - 1; // Remove the LSB
    //     }

    //     attacks
    // }

    // /// A function to calculate attacks mask for black pieces
    // pub fn black_attack_mask(&self) -> Bitboard {
    //     let mut attacks = 0;

    //     // Pawn attacks
    //     attacks |= (self.bP >> 7) & NOT_A_FILE;
    //     attacks |= (self.bP >> 9) & NOT_H_FILE;

    //     // Knight attacks
    //     let mut knights = self.bN;
    //     while knights != 0 {
    //         let knight_pos = knights.trailing_zeros() as usize;
    //         attacks |= KNIGHT_MOVES[knight_pos as usize];
    //         knights &= knights - 1; // Remove the LSB
    //     }

    //     // King attacks
    //     let mut kings = self.bK;
    //     while kings != 0 {
    //         let king_pos = kings.trailing_zeros() as usize;
    //         attacks |= KING_MOVES[king_pos as usize];
    //         kings &= kings - 1; // Remove the LSB
    //     }

    //     // Bishop attacks
    //     let mut bishops = self.bB;
    //     while bishops != 0 {
    //         let bishop_pos = bishops.trailing_zeros() as usize;
    //         let square = Square::usize_to_square(bishop_pos);
    //         attacks |= bishop_attacks_on_the_fly(square, self.all_pieces);
    //         bishops &= bishops - 1; // Remove the LSB
    //     }

    //     // Rook attacks
    //     let mut rooks = self.bR;
    //     while rooks != 0 {
    //         let rook_pos = rooks.trailing_zeros() as usize;
    //         let square = Square::usize_to_square(rook_pos);
    //         attacks |= rook_attacks_on_the_fly(square, self.all_pieces);
    //         rooks &= rooks - 1; // Remove the LSB
    //     }

    //     // Queen attacks
    //     let mut queens = self.bQ;
    //     while queens != 0 {
    //         let queen_pos = queens.trailing_zeros() as usize;
    //         let square = Square::usize_to_square(queen_pos);
    //         attacks |= queen_attacks_on_the_fly(square, self.all_pieces);
    //         queens &= queens - 1; // Remove the LSB
    //     }

    //     attacks
    // }
}
