use serde::{Deserialize, Serialize};

use crate::pieces::Color;

use super::{bitboard::BitBoard, square::Square};

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq)]
pub struct ChessBoard {
    pub wp: BitBoard,
    pub wn: BitBoard,
    pub wb: BitBoard,
    pub wr: BitBoard,
    pub wq: BitBoard,
    pub wk: BitBoard,
    pub bp: BitBoard,
    pub bn: BitBoard,
    pub bb: BitBoard,
    pub br: BitBoard,
    pub bq: BitBoard,
    pub bk: BitBoard,

    /// Castling rights
    pub castling_rights: u8, // [White, Black](KingSide, QueenSide)
    /// En passant
    pub en_passant: BitBoard,
}

impl ChessBoard {
    /// Generates a new Board
    pub fn new() -> Self {
        ChessBoard {
            wp: BitBoard(0x000000000000FF00),
            wn: BitBoard(0x0000000000000042),
            wb: BitBoard(0x0000000000000024),
            wr: BitBoard(0x0000000000000081),
            wq: BitBoard(0x0000000000000008),
            wk: BitBoard(0x0000000000000010),
            bp: BitBoard(0x00FF000000000000),
            bn: BitBoard(0x4200000000000000),
            bb: BitBoard(0x2400000000000000),
            br: BitBoard(0x8100000000000000),
            bq: BitBoard(0x0800000000000000),
            bk: BitBoard(0x1000000000000000),

            castling_rights: 0b1111,
            en_passant: BitBoard::EMPTY,
        }
    }

    /// method to reset en_passant square
    pub fn reset_enpassant(&mut self) {
        self.en_passant = BitBoard::EMPTY;
    }

         
    ///A function to generate FEN string using bitboard
    pub fn to_fen(
        &self,
        active_player: Color,
        halfmove_count: &u32,
        fullmove_count: &u32,
    ) -> String {
        let bitboards = [
            self.wp, self.wn, self.wb, self.wr, self.wq, self.wk,
            self.bp, self.bn, self.bb, self.br, self.bq, self.bk,
        ];
        let pieces = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'];

        let mut fen = String::with_capacity(100);

        for rank in (0..8).rev() {
            // Iterate over ranks 7 to 0
            let mut empty_squares = 0;

            for file in 0..8 {
                let square = rank * 8 + file;

                let mut piece_found = false;

                for (i, &bitboard) in bitboards.iter().enumerate() {
                    if (bitboard.as_u64() & (1u64 << square)) != 0 {
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
        fen.push(' '); // just to have a whitespace
        
        fen.push(active_player.into());

        fen.push(' '); // just to have a whitespace
    
        // Add placeholder values for the rest of the FEN string
        // castling rights for K(0)Q(1)k(2)q(3)
        // Castling rights for K (White Kingside), Q (White Queenside),
        // k (Black Kingside), q (Black Queenside)
        let mut castling_str = String::with_capacity(4);
        let mask = self.castling_rights;

        if mask & 0b0001 != 0 { castling_str.push('K'); }
        if mask & 0b0010 != 0 { castling_str.push('Q'); }
        if mask & 0b0100 != 0 { castling_str.push('k'); }
        if mask & 0b1000 != 0 { castling_str.push('q'); }
        if castling_str.is_empty() { castling_str.push('-'); }
        
        fen.push_str(&castling_str);

        if self.en_passant != 0 {
            let en_passant_square = self.en_passant.trailing_zeros();
            let square = Square::usize_to_string(en_passant_square as usize);
            fen.push(' '); // just to have a whitespace
            fen.push_str(&square);
        } else {
            fen.push_str(" -");
        }

        fen.push(' '); // just to have a whitespace

        fen.push_str(&halfmove_count.to_string());

        fen.push(' '); // just to have a whitespace

        fen.push_str(&fullmove_count.to_string());

        fen
    }

    
    /// Generates a ChessBoard from a FEN string
    pub fn with_fen(fen: &str) -> Self {
        let mut board = ChessBoard::default();

        let parts: Vec<&str> = fen.split_whitespace().collect();
        let piece_placement = parts[0];
        let castling_rights = parts.get(2).unwrap_or(&"-");
        let en_passant = parts.get(3).unwrap_or(&"-");

        // Parse the piece placement
        for (rank_idx, rank) in piece_placement.split('/').enumerate() {
            let mut file_idx = 0;
            for c in rank.chars() {
                let square = (7 - rank_idx) * 8 + file_idx;
                let mask = 1u64 << square;

                match c {
                    'P' => board.wp |= mask,
                    'N' => board.wn |= mask,
                    'B' => board.wb |= mask,
                    'R' => board.wr |= mask,
                    'Q' => board.wq |= mask,
                    'K' => board.wk |= mask,
                    'p' => board.bp |= mask,
                    'n' => board.bn |= mask,
                    'b' => board.bb |= mask,
                    'r' => board.br |= mask,
                    'q' => board.bq |= mask,
                    'k' => board.bk |= mask,
                    '1'..='8' => {
                        let empty_squares = c.to_digit(10).unwrap() as usize;
                        file_idx += empty_squares - 1;
                    }
                    _ => {}
                }
                file_idx += 1;
            }
        }

        // Parse castling rights
        let mut mask = 0;
        for ch in castling_rights.chars() {
            match ch {
                'K' => mask |= 0b0001,
                'Q' => mask |= 0b0010,
                'k' => mask |= 0b0100,
                'q' => mask |= 0b1000,
                '-' => {},
                _   => panic!("Invalid castling char: {}", ch),
            }
        }
        board.castling_rights = mask;

        // Parse en passant
        if *en_passant != "-" {
            let en_passant_square = match en_passant.chars().nth(0) {
                Some(file) => en_passant.chars().nth(1).map(|rank| {
                    (rank.to_digit(10).unwrap() as u64 - 1) * 8 + (file as u64 - 'a' as u64)
                }),
                None => None,
            };
            if let Some(square) = en_passant_square {
                board.en_passant |= 1u64 << square;
            }
        }
        board
    }

    /// Helper function to extract moves from a bitboard
    pub fn extract_moves(&self, bitboard: u64) -> Vec<Square> {
        let mut moves = Vec::new();
        let mut bb = bitboard;

        while bb != 0 {
            let lsb = bb & bb.wrapping_neg(); // Get least significant bit (LSB)
            let sq_index = lsb.trailing_zeros() as usize; // Get index of LSB
            moves.push(Square::usize_to_square(sq_index)); // Convert to Square and add to moves
            bb &= bb - 1; // Clear the LSB
        }

        moves
    }

    
    #[rustfmt::skip]
    /// Returns a bitboard containing all pieces on the board
    pub fn all_pieces(&self) -> BitBoard {
        self.wp | self.wn | self.wb | self.wr | self.wq | self.wk |
        self.bp | self.bn | self.bb | self.br | self.bq | self.bk
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_board() {
        let board: ChessBoard = ChessBoard::new();    
        let default_board = ChessBoard {
            wp: BitBoard(0x000000000000FF00),
            wn: BitBoard(0x0000000000000042),
            wb: BitBoard(0x0000000000000024),
            wr: BitBoard(0x0000000000000081),
            wq: BitBoard(0x0000000000000008),
            wk: BitBoard(0x0000000000000010),
            bp: BitBoard(0x00FF000000000000),
            bn: BitBoard(0x4200000000000000),
            bb: BitBoard(0x2400000000000000),
            br: BitBoard(0x8100000000000000),
            bq: BitBoard(0x0800000000000000),
            bk: BitBoard(0x1000000000000000),
            castling_rights: 0b1111,
            en_passant: BitBoard::EMPTY,
        };    

        assert_eq!(board, default_board);
    }

    
    #[test]
    fn test_board_to_fen_method() {
        let starting_board: ChessBoard = ChessBoard::new();    
        let fen_string = starting_board.to_fen(Color::White, &0, &1);
        let correct_fen_string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        assert_eq!(correct_fen_string, fen_string);
    }


    #[test]
    fn test_board_with_fen_method() {
        let fen_string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        let starting_board: ChessBoard = ChessBoard::with_fen(fen_string);
        let generated_fen = starting_board.to_fen(Color::White, &0, &1); // halfmove=0, fullmove=1

        assert_eq!(generated_fen, fen_string, "FEN generated from board does not match original FEN");
    }
}

