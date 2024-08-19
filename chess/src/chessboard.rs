#![allow(unused_imports)]
use crate::{
    computed_king_moves, computed_knight_attacks, computed_pawn_attacks, computed_pawn_moves,
    lazy_static, Bitboard, Color, Piece, NOT_A_FILE, NOT_H_FILE,
};
use async_graphql::SimpleObject;
use serde::{Deserialize, Serialize};

use crate::Square;

pub type BitBoard = u64;

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
    const fn capture_piece(to: Square, board: &mut BitBoard) {
        if *board & (1u64 << to as usize) != 0 {
            self.clear(to, board);
        } else {
            log::info!("No piece to capture");
        }
    }
    /// Sets a piece on the board
    const fn set(square: Square, board: &mut BitBoard) {
        *board |= 1u64 << square as usize;
    }

    /// Clears a piece on the board
    const fn clear(square: Square, board: &mut BitBoard) {
        *board &= !(1u64 << square as usize);
    }

    /// Moves a piece on the board
    const fn move_piece(from: Square, to: Square, board: &mut BitBoard) {
        if *board & (1u64 << from as usize) != 0 {
            Self::clear(from, board);
            Self::set(to, board);
        } else {
            log::info!("No piece to move");
        }
    }

    /// Moves a white pawn
    pub fn wP_moves(&self, from: Square, to: Square, board: &mut BitBoard) {
        if WHITE_PMOVES[from as usize] & (1u64 << to as usize) != 0
            && *board & (1u64 << to as usize) == 0
        {
            Self::move_piece(from, to, board);
        } else {
            log::info!("Invalid move");
        }
    }

    /// Moves a black pawn
    pub fn bP_moves(&self, from: Square, to: Square, board: &mut BitBoard) {
        if BLACK_PMOVES[from as usize] & (1u64 << to as usize) != 0
            && *board & (1u64 << to as usize) == 0
        {
            Self::move_piece(from, to, board);
        } else {
            log::info!("Invalid move");
        }
    }

    /// Moves a knight
    pub fn knight_moves(&self, from: Square, to: Square, board: &mut BitBoard) {
        if KNIGHT_MOVES[from as usize] & (1u64 << to as usize) != 0
            && *board & (1u64 << to as usize) == 0
        {
            Self::move_piece(from, to, board);
        } else {
            log::info!("Invalid move");
        }
    }

    /// Moves a King
    pub fn king_moves(&self, from: Square, to: Square, board: &mut BitBoard) {
        if KING_MOVES[from as usize] & (1u64 << to as usize) != 0
            && *board & (1u64 << to as usize) == 0
        {
            Self::move_piece(from, to, board);
        } else {
            log::info!("Invalid move");
        }
    }

    /** --------------------------------Piece Capture Logic---------------------------------- */

    /// White pawn captures
    pub fn wP_captures(
        &self,
        from: Square,
        to: Square,
        board: &mut BitBoard,
        captured: &mut Bitboard,
    ) {
        if WHITE_PCAPTURES[from as usize] & (1u64 << to as usize) != 0
            && *board & (1u64 << to as usize) != 0
            && *captured & (1u64 << to as usize) != 0
        {
            Self::capture_piece(to, captured);
            Self::move_piece(from, to, board);
        } else {
            log::info!("white pawn could'nt capture");
        }
    }

    /// Black pawn captures
    pub fn bP_captures(
        &self,
        from: Square,
        to: Square,
        board: &mut BitBoard,
        captured: &mut Bitboard,
    ) {
        if BLACK_PCAPTURES[from as usize] & (1u64 << to as usize) != 0
            && *board & (1u64 << to as usize) != 0
            && *captured & (1u64 << to as usize) != 0
        {
            Self::capture_piece(to, captured);
            Self::move_piece(from, to, board);
        } else {
            log::info!("black pawn could'nt capture");
        }
    }

    /// Knight Captures
    pub fn knight_captures(
        &self,
        from: Square,
        to: Square,
        board: &mut BitBoard,
        captured: &mut Bitboard,
    ) {
        if KNIGHT_MOVES[from as usize] & (1u64 << to as usize) != 0
            && *board & (1u64 << to as usize) != 0
            && *captured & (1u64 << to as usize) != 0
        {
            Self::capture_piece(to, captured);
            Self::move_piece(from, to, board);
        } else {
            log::info!("Knight could'nt capture");
        }
    }

    /// King Captures
    pub fn king_captures(
        &self,
        from: Square,
        to: Square,
        board: &mut BitBoard,
        captured: &mut Bitboard,
    ) {
        if KING_MOVES[from as usize] & (1u64 << to as usize) != 0
            && *board & (1u64 << to as usize) != 0
            && *captured & (1u64 << to as usize) != 0
        {
            Self::capture_piece(to, captured);
            Self::move_piece(from, to, board);
        } else {
            log::info!("Knight could'nt capture");
        }
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
