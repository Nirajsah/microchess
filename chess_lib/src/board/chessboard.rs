use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

use crate::{moves::generator::{bishop_attacks_on_the_fly, computed_king_moves, computed_knight_attacks, computed_pawn_attacks, computed_pawn_moves, queen_attacks_on_the_fly, rook_attacks_on_the_fly, NOT_A_FILE, NOT_H_FILE}, pieces::Color, ChessError, Result};

use super::{bitboard::BitBoard, square::Square};

lazy_static! {
    pub static ref KNIGHT_MOVES: [BitBoard; 64] = computed_knight_attacks();
    pub static ref KING_MOVES: [BitBoard; 64] = computed_king_moves();
    pub static ref WHITE_PMOVES: [BitBoard; 64] = computed_pawn_moves(&Color::White);
    pub static ref WHITE_PATTACKS: [BitBoard; 64] = computed_pawn_attacks(&Color::White);
    pub static ref BLACK_PATTACKS: [BitBoard; 64] = computed_pawn_attacks(&Color::Black);
    pub static ref BLACK_PMOVES: [BitBoard; 64] = computed_pawn_moves(&Color::Black);
}

#[derive(Copy, Clone)]
pub enum Piece {
    WhitePawn, WhiteKnight, WhiteBishop, WhiteRook, WhiteQueen, WhiteKing,
    BlackPawn, BlackKnight, BlackBishop, BlackRook, BlackQueen, BlackKing,
}

impl Piece {
    #[rustfmt::skip]
    pub fn color(&self) -> Color {
      match self {
        Piece::WhitePawn | Piece::WhiteKnight | Piece::WhiteBishop | Piece::WhiteRook | Piece::WhiteQueen | Piece::WhiteKing => Color::White,
        Piece::BlackPawn | Piece::BlackKnight | Piece::BlackBishop | Piece::BlackRook | Piece::BlackQueen | Piece::BlackKing => Color::Black,
      }
    }
}

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
    pub halfmove_clock: u8,
    pub fullmove_number: u8,
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
            halfmove_clock: 0,
            fullmove_number: 1,
            en_passant: BitBoard::EMPTY,
        }
    }

    pub fn clear(&mut self) {
        // Clear all white pieces
        self.wp = BitBoard::EMPTY; // White pawns
        self.wr = BitBoard::EMPTY; // White rooks  
        self.wn = BitBoard::EMPTY; // White knights
        self.wb = BitBoard::EMPTY; // White bishops
        self.wq = BitBoard::EMPTY; // White queens
        self.wk = BitBoard::EMPTY; // White king
        
        // Clear all black pieces
        self.bp = BitBoard::EMPTY; // Black pawns
        self.br = BitBoard::EMPTY; // Black rooks
        self.bn = BitBoard::EMPTY; // Black knights
        self.bb = BitBoard::EMPTY; // Black bishops
        self.bq = BitBoard::EMPTY; // Black queens
        self.bk = BitBoard::EMPTY; // Black king
        
        // Reset other game state if you have them
        self.castling_rights = 0b1111;
        self.en_passant = BitBoard::EMPTY;
        self.halfmove_clock = 0;
        self.fullmove_number = 1;
    }

    /// method to reset en_passant square
    pub fn reset_enpassant(&mut self) {
        self.en_passant = BitBoard::EMPTY;
    }

         
    ///A function to generate FEN string using bitboard
    pub fn to_fen(
        &self,
        active_player: Color,
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

        fen.push_str(&self.halfmove_clock.to_string());

        fen.push(' '); // just to have a whitespace

        fen.push_str(&self.fullmove_number.to_string());

        fen
    }

    
    /// Generates a ChessBoard from a FEN string
    pub fn with_fen(fen: &str) -> Self {
        let mut board = ChessBoard::default();

        let parts: Vec<&str> = fen.split_whitespace().collect();
        let piece_placement = parts[0];
        let castling_rights = parts.get(2).unwrap_or(&"-");
        let en_passant = parts.get(3).unwrap_or(&"-");
        let halfmove_clock = parts.get(4).unwrap_or(&"0");
        let fullmove_number = parts.get(5).unwrap_or(&"1");        // Parse the piece placement

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
                board.en_passant = BitBoard(1u64 << square); // Placing en_passant
            }
        }

        board.halfmove_clock = halfmove_clock.parse().unwrap();
        board.fullmove_number = fullmove_number.parse().unwrap();

        board
    }

    /// Helper function to extract moves from a bitboard
    pub fn extract_moves(&self, bitboard: BitBoard) -> Vec<Square> {
        let mut moves = Vec::with_capacity(64);
        let mut bb = bitboard;
        
        while let Some(piece_pos) = bb.pop_lsb() {
            moves.push(Square::uint_to_square(piece_pos as u8))
        }

        moves
    }

    
    #[rustfmt::skip]
    /// Returns a bitboard containing all pieces on the board
    pub fn all_pieces(&self) -> BitBoard {
        self.wp | self.wn | self.wb | self.wr | self.wq | self.wk |
        self.bp | self.bn | self.bb | self.br | self.bq | self.bk
    }

    /// Returns the bitboard of all white pieces on the board
    pub fn white_pieces(&self) -> BitBoard {
        self.wp | self.wn | self.wb | self.wr | self.wq | self.wk
    }

    /// Returns the bitboard of all black pieces on the board
    pub fn black_pieces(&self) -> BitBoard {
        self.bp | self.bn | self.bb | self.br | self.bq | self.bk
    }

    /// Revoke castling rights permanently.
    ///
    /// - If `rook_position` is `Some(square)`, revoke only that rook's side.
    /// - If `rook_position` is `None`, revoke both sides (king moved).
    pub fn revoke_castling_rights(&mut self, color: Color, rook_position: Option<Square>) {
        match (color, rook_position) {
            (Color::White, Some(Square::H1)) => self.castling_rights &= !0b0001, // White kingside
            (Color::White, Some(Square::A1)) => self.castling_rights &= !0b0010, // White queenside
            (Color::Black, Some(Square::H8)) => self.castling_rights &= !0b0100, // Black kingside
            (Color::Black, Some(Square::A8)) => self.castling_rights &= !0b1000, // Black queenside

            // King moved → revoke both rights
            (Color::White, None) => self.castling_rights &= !(0b0001 | 0b0010),
            (Color::Black, None) => self.castling_rights &= !(0b0100 | 0b1000),

            _ => {}
        }
    }

    /// A function to get the mutable bitboard for a piece
    pub fn get_mut_board(&mut self, piece: &Piece) -> &mut BitBoard {
        match piece {
            Piece::WhitePawn => &mut self.wp,
            Piece::WhiteKnight => &mut self.wn,
            Piece::WhiteBishop => &mut self.wb,
            Piece::WhiteRook => &mut self.wr,
            Piece::WhiteQueen => &mut self.wq,
            Piece::WhiteKing => &mut self.wk,
            Piece::BlackPawn => &mut self.bp,
            Piece::BlackKnight => &mut self.bn,
            Piece::BlackBishop => &mut self.bb,
            Piece::BlackRook => &mut self.br,
            Piece::BlackQueen => &mut self.bq,
            Piece::BlackKing => &mut self.bk,
        }
    }

    /// A function to get the bitboard of a piece as immutable reference
    pub fn get_board(&mut self, piece: &Piece) -> &BitBoard {
        match piece {
            Piece::WhitePawn => &self.wp,
            Piece::WhiteKnight => &self.wn,
            Piece::WhiteBishop => &self.wb,
            Piece::WhiteRook => &self.wr,
            Piece::WhiteQueen => &self.wq,
            Piece::WhiteKing => &self.wk,
            Piece::BlackPawn => &self.bp,
            Piece::BlackKnight => &self.bn,
            Piece::BlackBishop => &self.bb,
            Piece::BlackRook => &self.br,
            Piece::BlackQueen => &self.bq,
            Piece::BlackKing => &self.bk,
        }
    }

    /// Moves a piece on the board, while checking if the king is in check
    pub fn move_piece(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let color = piece.color();

        // Check if the piece is at the 'from' square
        if *self.get_board(piece) & (1u64 << from) == 0 {
            return Err(ChessError::InvalidMove);
        }
        
        // Make the move temporarily
        {
            let board = self.get_mut_board(piece);
            board.clear(from);
            board.set(to);
        }

        // if the player is already in_check, does making the move get king out of check?, if not don't move.
        if self.in_check(color) {
            let board = self.get_mut_board(piece);
            board.clear(to);
            board.set(from);
            return Err(ChessError::InvalidMove);
        } 
        
        Ok(())
    } 

    // ---------------------------------------- Piece Move Logic -----------------------------------------

    /// Moves a white pawn
    pub fn wp_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        if WHITE_PMOVES[from as usize] & (1u64 << to) == 0 {
            return Err(ChessError::InvalidMove);
        }

        // For two-square moves, check if the intermediate square is also clear
        if to as usize == from as usize + 16 {
            let intermediate_sq = from as usize + 8;
            if self.all_pieces() & (1u64 << intermediate_sq) != 0 {
                return Err(ChessError::InvalidMove);
            }
        }

        // Attempt the move
        self.move_piece(from, to, piece)?;

        // Set en passant square only for two-square moves
        if to as usize == from as usize + 16 {
            self.en_passant = BitBoard(1u64 << (from as usize + 8));
        }

        Ok(())
    }

    /// Moves a black pawn
    pub fn bp_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        if BLACK_PMOVES[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }

        // For two-square moves, check if the intermediate square is also clear
        if to as usize == from as usize - 16 {
            let intermediate_sq = from as usize - 8;
            if self.all_pieces() & (1u64 << intermediate_sq) != 0 {
                return Err(ChessError::InvalidMove);
            }
        }

        // Attempt the move
        self.move_piece(from, to, piece)?;

        // Set en passant square only for two-square moves
        if to as usize == from as usize + 16 {
            self.en_passant = BitBoard(1u64 << (from as usize + 8));
        }

        Ok(())
    }

    /// Moves a knight
    pub fn knight_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        if KNIGHT_MOVES[from as usize] & (1u64 << to) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.move_piece(from, to, piece)
    }

    /// Moves a King
    pub fn king_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let color = piece.color();
        if KING_MOVES[from as usize] & (1u64 << to) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.revoke_castling_rights(color, None);
        self.move_piece(from, to, piece)
    }

    /// Moves a Rook
    pub fn rook_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let color = piece.color();
        if rook_attacks_on_the_fly(from.into(), self.all_pieces()) & (1u64 << to) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.revoke_castling_rights(color, Some(from));
        self.move_piece(from, to, piece)
    }

    /// Moves a Bishop
    pub fn bishop_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        if bishop_attacks_on_the_fly(from.into(), self.all_pieces()) & (1u64 << to) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.move_piece(from, to, piece)
    }

    pub fn queen_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        if queen_attacks_on_the_fly(from.into(), self.all_pieces()) & (1u64 << to) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.move_piece(from, to, piece)
    }

    /// Returns true if the king of the given color is in check
    pub fn in_check(&self, color: Color) -> bool {
        let king = match color {
            Color::White => self.wk,
            Color::Black => self.bk,
        };

        let attack_mask = self.attack_mask(color.opposite());

        (attack_mask & king.0) != 0
    }

    // ----------------------------------------- Compute Attack Mask for current pieces--------------------------------

    pub fn attack_mask(&self, color: Color) -> BitBoard {
        match color {
            Color::White => self.white_attack_mask(),
            Color::Black => self.black_attack_mask(),
        }
    }

    /// A function to calculate the attack mask for white pieces
    pub fn white_attack_mask(&self) -> BitBoard {
        const PAWN_ATTACK_DOWN_LEFT: u32 = 7;
        const PAWN_ATTACK_DOWN_RIGHT: u32 = 9;
        let mut attacks = BitBoard::EMPTY;

        // Pawn attacks
        attacks |= ((self.wp << PAWN_ATTACK_DOWN_LEFT) & NOT_H_FILE).into();
        attacks |= ((self.wp << PAWN_ATTACK_DOWN_RIGHT) & NOT_A_FILE).into();

        // Knight attacks
        let mut knights = self.wn;
        while let Some(knight_pos) = knights.pop_lsb() {
            attacks |= KNIGHT_MOVES[knight_pos as usize].into();
        }

        // King attacks
        let mut king = self.wk;
        while let Some(king_pos) = king.pop_lsb() {
            attacks |= KING_MOVES[king_pos as usize].into();
        }

        // Bishop attacks
        let mut bishops = self.wb;
        while let Some(bishop_pos) = bishops.pop_lsb() {
            attacks |= bishop_attacks_on_the_fly(bishop_pos as u8, self.all_pieces()).into();
        }

        // Rook attacks
        let mut rooks = self.wr;
        while let Some(rook_pos) = rooks.pop_lsb() {
            attacks |= rook_attacks_on_the_fly(rook_pos as u8, self.all_pieces()).into();
        }

        // Queen attacks
        let mut queen = self.wq;
        while let Some(queen_pos) = queen.pop_lsb() {
            attacks |= queen_attacks_on_the_fly(queen_pos as u8, self.all_pieces()).into();
        }

        attacks
    }

    /// A function to calculate attacks mask for black pieces
    pub fn black_attack_mask(&self) -> BitBoard {
        const PAWN_ATTACK_DOWN_LEFT: u32 = 7;
        const PAWN_ATTACK_DOWN_RIGHT: u32 = 9;
        let mut attacks = BitBoard::EMPTY;


        // Pawn attacks
        attacks |= ((self.bp >> PAWN_ATTACK_DOWN_LEFT) & NOT_A_FILE).into();
        attacks |= ((self.bp >> PAWN_ATTACK_DOWN_RIGHT) & NOT_H_FILE).into();

        // Knight attacks
        let mut knights = self.bn;
        while let Some(knight_pos) = knights.pop_lsb() {
            attacks |= KNIGHT_MOVES[knight_pos as usize].into();
        }

        // King attacks
        let mut king = self.bk;
        while let Some(king_pos) = king.pop_lsb() {
            attacks |= KING_MOVES[king_pos as usize].into();
        }

        // Bishop attacks
        let mut bishops = self.bb;
        while let Some(bishop_pos) = bishops.pop_lsb() {
            attacks |= bishop_attacks_on_the_fly(bishop_pos as u8, self.all_pieces()).into();
        }

        // Rook attacks
        let mut rooks = self.br;
        while let Some(rook_pos) = rooks.pop_lsb() {
            attacks |= rook_attacks_on_the_fly(rook_pos as u8, self.all_pieces()).into();
        }

        // Queen attacks
        let mut queen = self.bq;
        while let Some(queen_pos) = queen.pop_lsb() {
            attacks |= queen_attacks_on_the_fly(queen_pos as u8, self.all_pieces()).into();
        }

        attacks
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
            halfmove_clock: 0,
            fullmove_number: 1,
            en_passant: BitBoard::EMPTY,
        };    

        assert_eq!(board, default_board);
    }

    
    #[test]
    fn test_board_to_fen_method() {
        let starting_board: ChessBoard = ChessBoard::new();    
        let fen_string = starting_board.to_fen(Color::White);
        let correct_fen_string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        assert_eq!(correct_fen_string, fen_string);
    }


    #[test]
    fn test_board_with_fen_method() {
        let fen_string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        let starting_board: ChessBoard = ChessBoard::with_fen(fen_string);
        let generated_fen = starting_board.to_fen(Color::White); // halfmove=0, fullmove=1

        assert_eq!(generated_fen, fen_string, "FEN generated from board does not match original FEN");
    }

    #[test]
    fn test_revoke_castling_rights_method() {
        let mut board = ChessBoard::new();

        // Start with all castling rights enabled
        assert_eq!(board.castling_rights, 0b1111);

        // White Queenside (A1)
        board.revoke_castling_rights(Color::White, Some(Square::A1));

        let fen = board.to_fen(Color::Black);
        let should_be_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b Kkq - 0 1";

        assert_eq!(board.castling_rights, 0b1101, "White queenside should be revoked");
        assert_eq!(fen, should_be_fen, "White queenside should be revoked in fen");

        // White Kingside (H1)
        board.castling_rights = 0b1111; // Reset

        board.revoke_castling_rights(Color::White, Some(Square::H1));
        let fen = board.to_fen(Color::White);
        let should_be_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w Qkq - 0 1";

        assert_eq!(board.castling_rights, 0b1110, "White kingside should be revoked");
        assert_eq!(fen, should_be_fen, "White kingside should be revoked in fen");
        
        // Black Kingside (H8)
        board.castling_rights = 0b1111; // Reset

        board.revoke_castling_rights(Color::Black, Some(Square::H8));
        let fen = board.to_fen(Color::Black);
        let should_be_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQq - 0 1";
      
        assert_eq!(board.castling_rights, 0b1011, "Black kingside should be revoked");
        assert_eq!(fen, should_be_fen, "Black kingside should be revoked in fen");


        // Black Queenside (A8)
        board.revoke_castling_rights(Color::Black, Some(Square::A8));
        let fen = board.to_fen(Color::White);
        let should_be_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1";

        assert_eq!(board.castling_rights, 0b0011, "Black queenside should be revoked");
        assert_eq!(fen, should_be_fen, "Black queenside should be revoked in fen");
    }

    #[test]
    fn test_in_check_white_king() {
        let mut board = ChessBoard::new();
    
        // Initial position - white king not in check
        assert!(!board.in_check(Color::White));
    
        // Place black rook attacking white king
        board.clear();
        board.wk = BitBoard(1u64 << 4); // e1 (square 4)
        board.br = BitBoard(1u64 << 60); // e8 (square 60) - attacks down the e-file
        assert!(board.in_check(Color::White), "White king should be in check from rook on e8");
    
        // Block the attack with a piece between king and rook
        board.wp = BitBoard(1u64 << 28); // e4 (square 28) - blocks the attack
        assert!(!board.in_check(Color::White), "Attack should be blocked by pawn on e4");
    }

    #[test]
    fn test_in_check_black_king() {
        let mut board = ChessBoard::new();
        
        // Initial position - black king not in check
        assert!(!board.in_check(Color::Black));
        
        // Place white queen attacking black king
        board.clear();
        board.bk = BitBoard(1u64 << 60); // e8
        board.wq = BitBoard(1u64 << 52); // e7
        assert!(board.in_check(Color::Black));
    }

    #[test]
    fn test_white_pawn_attacks() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White pawn on e4 (square 28)
        board.wp = BitBoard(1u64 << 28);
        let attacks = board.white_attack_mask();
        
        // Should attack d5 (35) and f5 (37)
        assert!(attacks.get_bit(35)); // d5
        assert!(attacks.get_bit(37)); // f5
        assert!(!attacks.get_bit(36)); // e5 (not attacked by pawn)
    }

    #[test]
    fn test_white_pawn_attacks_edge_files() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White pawn on a4 (square 24) - should only attack b5
        board.wp = BitBoard(1u64 << 24);
        let attacks = board.white_attack_mask();
        
        assert!(attacks.get_bit(33)); // b5
        assert!(!attacks.get_bit(31)); // Invalid - would wrap around
        
        board.clear();
        // White pawn on h4 (square 31) - should only attack g5
        board.wp = BitBoard(1u64 << 31);
        let attacks = board.white_attack_mask();
        
        assert!(attacks.get_bit(38)); // g5
        assert!(!attacks.get_bit(40)); // Invalid - would wrap around
    }

    #[test]
    fn test_black_pawn_attacks() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // Black pawn on e5 (square 36)
        board.bp = BitBoard(1u64 << 36);
        let attacks = board.black_attack_mask();
        
        // Should attack d4 (27) and f4 (29)
        assert!(attacks.get_bit(27)); // d4
        assert!(attacks.get_bit(29)); // f4
        assert!(!attacks.get_bit(28)); // e4 (not attacked by pawn)
    }

    #[test]
    fn test_black_pawn_attacks_edge_files() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // Black pawn on a5 (square 32) - should only attack b4
        board.bp = BitBoard(1u64 << 32);
        let attacks = board.black_attack_mask();
        
        assert!(attacks.get_bit(25)); // b4
        
        board.clear();
        // Black pawn on h5 (square 39) - should only attack g4
        board.bp = BitBoard(1u64 << 39);
        let attacks = board.black_attack_mask();
        
        assert!(attacks.get_bit(30)); // g4
    }

    #[test]
    fn test_knight_attacks() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White knight on e4 (square 28)
        board.wn = BitBoard(1u64 << 28);
        let attacks = board.white_attack_mask();
        
        // Knight should attack all 8 possible squares
        let expected_squares = [11, 13, 18, 22, 34, 38, 43, 45];
        for &square in &expected_squares {
            if square < 64 {
                assert!(attacks.get_bit(square), "Knight should attack square {}", square);
            }
        }
    }

    #[test]
    fn test_knight_attacks_corner() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White knight on a1 (square 0) - corner case
        board.wn = BitBoard(1u64 << 0);
        let attacks = board.white_attack_mask();
        
        // Should only attack valid squares
        assert!(attacks.get_bit(10)); // c2
        assert!(attacks.get_bit(17)); // b3
        assert!(!attacks.get_bit(64)); // Invalid square
    }

    #[test]
    fn test_king_attacks() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White king on e4 (square 28)
        board.wk = BitBoard(1u64 << 28);
        let attacks = board.white_attack_mask();
        
        // King attacks all 8 adjacent squares
        let expected_squares = [19, 20, 21, 27, 29, 35, 36, 37];
        for &square in &expected_squares {
            assert!(attacks.get_bit(square), "King should attack square {}", square);
        }
    }

    #[test]
    fn test_rook_attacks_clear_path() {
        let mut board = ChessBoard::new();
        board.clear();
    
        // White rook on e4 (square 28)
        board.wr = BitBoard(1u64 << 28);
        let attacks = board.white_attack_mask();
    
        // Should attack entire rank and file
        let rook_rank = 28 / 8; // 3 (4th rank, zero-indexed)
        let rook_file = 28 % 8; // 4 (e-file, zero-indexed)
    
        // Attack all squares on the same rank (rank 3)
        for file in 0..8 {
            if file != rook_file { // Skip the rook's own square
                let square = rook_rank * 8 + file;
                assert!(attacks.get_bit(square), "Rook should attack square {} on same rank", square);
            }
        }
    
        // Attack all squares on the same file (e-file)
        for rank in 0..8 {
            if rank != rook_rank { // Skip the rook's own square
                let square = rank * 8 + rook_file;
                assert!(attacks.get_bit(square), "Rook should attack square {} on same file", square);
            }
        }
    
        // Verify it doesn't attack its own square
        assert!(!attacks.get_bit(28), "Rook shouldn't attack its own square");
    }

    #[test]
    fn test_rook_attacks_blocked() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White rook on e4, white pawn on e6 blocking
        board.wr = BitBoard(1u64 << 28); // e4
        board.wp = BitBoard(1u64 << 44); // e6
        let attacks = board.white_attack_mask();
        
        // Should attack e5 but not e7 or e8
        assert!(attacks.get_bit(36)); // e5
        assert!(attacks.get_bit(44)); // e6 (can capture own piece in attack mask)
        assert!(!attacks.get_bit(52)); // e7 (blocked)
        assert!(!attacks.get_bit(60)); // e8 (blocked)
    }

    #[test]
    fn test_bishop_attacks_clear_path() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White bishop on e4 (square 28)
        board.wb = BitBoard(1u64 << 28);
        let attacks = board.white_attack_mask();
        
        // Should attack diagonals
        assert!(attacks.get_bit(19)); // d3
        assert!(attacks.get_bit(37)); // f5
        assert!(attacks.get_bit(46)); // g6
        assert!(attacks.get_bit(10)); // c2
        assert!(attacks.get_bit(1));  // b1
    }

    #[test]
    fn test_bishop_attacks_blocked() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White bishop on e4, black pawn on f5
        board.wb = BitBoard(1u64 << 28); // e4
        board.bp = BitBoard(1u64 << 37); // f5
        let attacks = board.white_attack_mask();
        
        // Should attack f5 but not beyond
        assert!(attacks.get_bit(37)); // f5
        assert!(!attacks.get_bit(46)); // g6 (blocked)
        assert!(!attacks.get_bit(55)); // h7 (blocked)
    }

    #[test]
    fn test_queen_attacks() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White queen on d4 (square 27)
        board.wq = BitBoard(1u64 << 27);
        let attacks = board.white_attack_mask();
        
        // Should combine rook and bishop attacks
        // Test a few key squares
        assert!(attacks.get_bit(19)); // d3 (vertical)
        assert!(attacks.get_bit(35)); // d5 (vertical)
        assert!(attacks.get_bit(26)); // c4 (horizontal)
        assert!(attacks.get_bit(28)); // e4 (horizontal)
        assert!(attacks.get_bit(18)); // c3 (diagonal)
        assert!(attacks.get_bit(36)); // e5 (diagonal)
    }

    #[test]
    fn test_multiple_pieces_attack_mask() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // Multiple white pieces
        board.wp = BitBoard(1u64 << 12); // e2
        board.wn = BitBoard(1u64 << 28); // e4
        board.wr = BitBoard(1u64 << 0);  // a1
        
        let attacks = board.white_attack_mask();
        
        // Should include attacks from all pieces
        assert!(attacks.get_bit(19)); // d3 (pawn attack)
        assert!(attacks.get_bit(21)); // f3 (pawn attack)
        assert!(attacks.get_bit(11)); // d2 (knight attack from e4)
        assert!(attacks.get_bit(1));  // b1 (rook attack from a1)
    }

    #[test]
    fn test_check_detection_multiple_attackers() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White king on e1, black rook on e8 and black bishop on a5
        board.wk = BitBoard(1u64 << 4);  // e1
        board.br = BitBoard(1u64 << 60); // e8
        board.bb = BitBoard(1u64 << 32); // a5
        
        // King should be in check from rook
        assert!(board.in_check(Color::White));
    }

    #[test]
    fn test_discovered_check() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White king on e1, black rook on e8, white piece on e4 initially blocking
        board.wk = BitBoard(1u64 << 4);  // e1
        board.br = BitBoard(1u64 << 60); // e8
        board.wp = BitBoard(1u64 << 28); // e4 (blocking)
        
        // Initially not in check
        assert!(!board.in_check(Color::White));
        
        // Move the blocking piece
        board.wp = BitBoard(1u64 << 29); // f4
        
        // Now should be in check
        assert!(board.in_check(Color::White));
    }

    #[test]
    fn test_empty_board_no_attacks() {
        let mut board = ChessBoard::new();
        board.clear();
        
        let white_attacks = board.white_attack_mask();
        let black_attacks = board.black_attack_mask();
        
        assert_eq!(white_attacks, BitBoard::EMPTY);
        assert_eq!(black_attacks, BitBoard::EMPTY);
    }

    #[test]
    fn test_attack_mask_symmetry() {
        // Test that attack patterns are symmetric for same piece types
        let mut board = ChessBoard::new();
        board.clear();
        
        // White knight on e4
        board.wn = BitBoard(1u64 << 28);
        let white_attacks = board.white_attack_mask();
        
        board.clear();
        // Black knight on e4
        board.bn = BitBoard(1u64 << 28);
        let black_attacks = board.black_attack_mask();
        
        // Attack patterns should be identical for knights
        assert_eq!(white_attacks, black_attacks);
    }

    #[test]
    fn test_pawn_promotion_rank_attacks() {
        let mut board = ChessBoard::new();
        board.clear();
        
        // White pawn on 7th rank
        board.wp = BitBoard(1u64 << 52); // e7
        let attacks = board.white_attack_mask();
        
        // Should attack 8th rank
        assert!(attacks.get_bit(59)); // d8
        assert!(attacks.get_bit(61)); // f8
    }

    #[test]
    fn test_in_check_variations() {
        let mut board = ChessBoard::new();

        // Test 1: Rook check along rank 
        board.clear();
        board.wk = BitBoard(1u64 << 4);  // e1
        board.br = BitBoard(1u64 << 0);  // a1 - attacks along 1st rank
        assert!(board.in_check(Color::White), "Rook should give check along rank");

        // Test 2: Bishop check along diagonal
        board.clear();
        board.wk = BitBoard(1u64 << 4);  // e1 (dark square)
        board.bb = BitBoard(1u64 << 31); // h4 (dark square) - attacks along diagonal
        assert!(board.in_check(Color::White), "Bishop should give check along diagonal");

        // Test 3: Knight check 
        board.clear();
        board.wk = BitBoard(1u64 << 4);  // e1
        board.bn = BitBoard(1u64 << 19); // d3 - knight attacks e1
        assert!(board.in_check(Color::White), "Knight should give check");

        // Test 4: Pawn check 
        board.clear();
        board.wk = BitBoard(1u64 << 4);  // e1
        board.bp = BitBoard(1u64 << 11); // d2 - pawn attacks e1
        assert!(board.in_check(Color::White), "Pawn should give check");
    }

    //---------------------------------------------------------------------------------------------------------//
    #[test]
    fn test_simple_move() {
        let mut board = ChessBoard::new();
        // Move white pawn from e2 to e4
        board.wp_moves(Square::E2, Square::E4, &Piece::WhitePawn).unwrap();
        assert_eq!(board.to_fen(Color::Black), "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
    }

    #[test]
    fn test_illegal_move_same_color_blocking() {
        let mut board = ChessBoard::new();
        // Try to move white queen out when pawn is blocking at d2
        let result = board.queen_moves(Square::D1, Square::H5, &Piece::WhiteQueen);
        assert!(result.is_err(), "Queen should not be able to move through pawn at d2");
    }

    //--------------------------------------------------------------------------------------------------------//
    /* #[test]
    fn test_capture_piece() {
        let mut board = ChessBoard::new();
        // Move e2 -> e4 and d7 -> d5, then e4 -> d5 (pawn capture)
        board.move_piece(Square::E2, Square::E4, &Piece::WhitePawn).unwrap();
        board.move_piece(Square::D7, Square::D5, &Piece::BlackPawn).unwrap();
        board.move_piece(Square::E4, Square::D5, &Piece::WhitePawn).unwrap();

        assert_eq!(board.to_fen(Color::Black), "rnbqkbnr/ppp1pppp/8/3P4/8/8/PPP1PPPP/RNBQKBNR b KQkq - 0 2");
    } */

    /* #[test]
    fn test_illegal_move_into_check() {
        let mut board = ChessBoard::new();
        // Fool’s mate setup: f2 -> f3, e7 -> e5, g2 -> g4, Qd8 -> h4
        board.move_piece(Square::F2, Square::F3, &Piece::WhitePawn).unwrap();
        board.move_piece(Square::E7, Square::E5, &Piece::BlackPawn).unwrap();
        board.move_piece(Square::G2, Square::G4, &Piece::WhitePawn).unwrap();
        board.move_piece(Square::D8, Square::H4, &Piece::BlackQueen).unwrap();
        
        // Now try moving g1 -> f3 (knight into pinned square), which should be illegal
        let result = board.move_piece(Square::G1, Square::F3, &Piece::WhiteKnight);
        assert!(result.is_err(), "Knight cannot move if it leaves king in check");
    }

    #[test]
    fn test_castling_kingside() {
        let mut board = ChessBoard::new();
        // Set up a position where castling is legal (clear path for white king)
        // e.g. after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.O-O
        board.move_piece(Square::E2, Square::E4, &Piece::WhitePawn).unwrap();
        board.move_piece(Square::E7, Square::E5, &Piece::BlackPawn).unwrap();
        board.move_piece(Square::G1, Square::F3, &Piece::WhiteKnight).unwrap();
        board.move_piece(Square::B8, Square::C6, &Piece::BlackKnight).unwrap();
        board.move_piece(Square::F1, Square::C4, &Piece::WhiteBishop).unwrap();
        board.move_piece(Square::G8, Square::F6, &Piece::BlackKnight).unwrap();

        // Castling move: king e1 -> g1
        board.move_piece(Square::E1, Square::G1, &Piece::WhiteKing).unwrap();

        assert_eq!(board.to_fen(Color::Black), "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 4 4");
    }

    #[test]
    fn test_en_passant() {
        let mut board = ChessBoard::new();
        // e2 -> e4, d7 -> d5, e4 -> e5, f7 -> f5, e5xf6 en passant
        board.move_piece(Square::E2, Square::E4, &Piece::WhitePawn).unwrap();
        board.move_piece(Square::D7, Square::D5, &Piece::BlackPawn).unwrap();
        board.move_piece(Square::E4, Square::E5, &Piece::WhitePawn).unwrap();
        board.move_piece(Square::F7, Square::F5, &Piece::BlackPawn).unwrap();
        board.move_piece(Square::E5, Square::F6, &Piece::WhitePawn).unwrap();

        assert_eq!(board.to_fen(Color::Black), "rnbqkbnr/pppp1ppp/5P2/3p4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3");
    }

    #[test]
    fn test_promotion() {
        let mut board = ChessBoard::new();
        // Minimal setup: push a white pawn to promotion (e7 -> e8=Q)
        board.move_piece(Square::E2, Square::E4, &Piece::WhitePawn).unwrap();
        // You’d need to keep pushing the pawn manually or set up a near-promotion board
        // For simplicity, let’s assume your move_piece handles promotion choice automatically
        // (otherwise you’ll need an extended function like move_piece_with_promotion)
        todo!("Implement pawn promotion test when promotion logic is ready");
    } */
}

