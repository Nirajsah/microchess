#![allow(unused_imports)]
use crate::{
    bishop_attacks_on_the_fly, computed_king_moves, computed_knight_attacks, computed_pawn_attacks,
    computed_pawn_moves, lazy_static,
    magic::{magic_index, make_table, BISHOP_MAGICS, ROOK_MAGICS},
    queen_attacks_on_the_fly, rook_attacks_on_the_fly, Bitboard, ChessError, Color, Game, MoveData,
    MoveType, Piece, NOT_A_FILE, NOT_H_FILE,
};
use async_graphql::SimpleObject;
use serde::{Deserialize, Serialize};

use crate::Square;

pub type BitBoard = u64;
pub type Result<T> = std::result::Result<T, ChessError>;

lazy_static! {
    pub static ref WHITE_PMOVES: Vec<BitBoard> = computed_pawn_moves(&Color::White);
    pub static ref WHITE_PATTACKS: Vec<Bitboard> = computed_pawn_attacks(&Color::White);
    pub static ref BLACK_PATTACKS: Vec<Bitboard> = computed_pawn_attacks(&Color::Black);
    pub static ref BLACK_PMOVES: Vec<Bitboard> = computed_pawn_moves(&Color::Black);
    pub static ref KNIGHT_MOVES: Vec<Bitboard> = computed_knight_attacks();
    pub static ref KING_MOVES: Vec<Bitboard> = computed_king_moves();
    pub static ref BISHOP_ATTACK_TABLE: Vec<BitBoard> =
        make_table(BISHOP_MAGICS, Piece::WhiteBishop);
    pub static ref ROOK_ATTACK_TABLE: Vec<BitBoard> = make_table(ROOK_MAGICS, Piece::WhiteRook);
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

    /// Castling rights
    pub castling_rights: [bool; 2],
    /// En passant
    pub en_passant: BitBoard,
}

impl ChessBoard {
    /// Generates a new Board
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

            castling_rights: [true; 2],
            en_passant: 0x00,
        }
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
                let square = 1u64 << (63 - (rank_idx * 8 + file_idx));

                match c {
                    'P' => board.wP |= square,
                    'N' => board.wN |= square,
                    'B' => board.wB |= square,
                    'R' => board.wR |= square,
                    'Q' => board.wQ |= square,
                    'K' => board.wK |= square,
                    'p' => board.bP |= square,
                    'n' => board.bN |= square,
                    'b' => board.bB |= square,
                    'r' => board.bR |= square,
                    'q' => board.bQ |= square,
                    'k' => board.bK |= square,
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
        board.castling_rights[0] = castling_rights.contains('K') || castling_rights.contains('Q');
        board.castling_rights[1] = castling_rights.contains('k') || castling_rights.contains('q');

        // Parse en passant
        if *en_passant != "-" {
            let en_passant_square = match en_passant.chars().nth(0) {
                Some(file) => match en_passant.chars().nth(1) {
                    Some(rank) => Some(
                        (rank.to_digit(10).unwrap() as u64 - 1) * 8 + (file as u64 - 'a' as u64),
                    ),
                    None => None,
                },
                None => None,
            };
            if let Some(square) = en_passant_square {
                board.en_passant = 1u64 << square;
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

    /// Get the pawn moves for a given color and square
    pub fn get_pawn_moves(&self, sq: Square, color: Color) -> Option<Vec<Square>> {
        // Check if there's a pawn of the correct color on the square
        let pawn_present = match color {
            Color::White => self.wP & (1 << sq as usize),
            Color::Black => self.bP & (1 << sq as usize),
        };

        if pawn_present == 0 {
            return None; // Return None if no pawn of the correct color is present
        }

        let (moves_bitboard, attacks_bitboard) = match color {
            Color::White => (&WHITE_PMOVES[sq as usize], &WHITE_PATTACKS[sq as usize]),
            Color::Black => (&BLACK_PMOVES[sq as usize], &BLACK_PATTACKS[sq as usize]),
        };

        // Get opponent pieces
        let opponent_pieces = match color {
            Color::White => self.black_pieces(),
            Color::Black => self.white_pieces(),
        };

        // Filter moves to only include empty squares
        let valid_moves = moves_bitboard & !self.all_pieces();

        // Filter attacks to only include squares with opponent pieces
        let valid_attacks = attacks_bitboard & opponent_pieces;

        // Combine the valid moves and attacks
        let combined_bitboard = valid_moves | valid_attacks;

        Some(self.extract_moves(combined_bitboard))
    }

    /// Get the knight moves for a given color and square
    pub fn get_knight_moves(&self, sq: Square, color: Color) -> Option<Vec<Square>> {
        // Check if a knight of the given color is present on the square
        let knight_present = match color {
            Color::White => self.wN & (1 << sq as usize) != 0,
            Color::Black => self.bN & (1 << sq as usize) != 0,
        };

        if !knight_present {
            return None; // Return None if no knight is present on the square
        }

        // Get opponent pieces
        let friendly_pieces = match color {
            Color::White => self.white_pieces(),
            Color::Black => self.black_pieces(),
        };

        // Get the knight moves
        let bitboard = KNIGHT_MOVES[sq as usize] & !self.all_pieces();

        let valid = bitboard & !friendly_pieces;

        Some(self.extract_moves(valid))
    }

    /// Get the king moves for a given color and square
    pub fn get_king_moves(&self, sq: Square, color: Color) -> Option<Vec<Square>> {
        let king_present = match color {
            Color::White => self.wK & (1 << sq as usize) != 0,
            Color::Black => self.bK & (1 << sq as usize) != 0,
        };

        if !king_present {
            return None; // Return None if no king is present on the square
        }

        let friendly_pieces = match color {
            Color::White => self.white_pieces(),
            Color::Black => self.black_pieces(),
        };

        // Get the king moves
        let bitboard = KING_MOVES[sq as usize] & !self.all_pieces();

        let valid = bitboard & !friendly_pieces;

        Some(self.extract_moves(valid))
    }

    /// Get the bishop moves for a given color and square
    pub fn get_bishop_moves(&self, sq: Square, color: Color) -> Option<Vec<Square>> {
        let bishop_present = match color {
            Color::White => self.wB & (1 << sq as usize) != 0,
            Color::Black => self.bB & (1 << sq as usize) != 0,
        };

        if !bishop_present {
            return None; // Return None if no bishop is present on the square
        }

        let friendly_pieces = match color {
            Color::White => self.white_pieces(),
            Color::Black => self.black_pieces(),
        };

        // Get the bishop moves
        let bitboard = bishop_attacks_on_the_fly(sq, self.all_pieces());

        let valid = bitboard & !friendly_pieces;

        Some(self.extract_moves(valid))
    }

    /// Get the rook moves for a given color and square
    pub fn get_rook_moves(&self, sq: Square, color: Color) -> Option<Vec<Square>> {
        let rook_present = match color {
            Color::White => self.wR & (1 << sq as usize) != 0,
            Color::Black => self.bR & (1 << sq as usize) != 0,
        };

        if !rook_present {
            return None; // Return None if no rook is present on the square
        }

        let friendly_pieces = match color {
            Color::White => self.white_pieces(),
            Color::Black => self.black_pieces(),
        };

        // Get the rook moves
        let bitboard = rook_attacks_on_the_fly(sq, self.all_pieces());

        let valid = bitboard & !friendly_pieces;

        Some(self.extract_moves(valid))
    }

    /// Get the queen moves for a given color and square
    pub fn get_queen_moves(&self, sq: Square, color: Color) -> Option<Vec<Square>> {
        let queen_present = match color {
            Color::White => self.wQ & (1 << sq as usize) != 0,
            Color::Black => self.bQ & (1 << sq as usize) != 0,
        };

        if !queen_present {
            return None; // Return None if no queen is present on the square
        }

        let friendly_pieces = match color {
            Color::White => self.white_pieces(),
            Color::Black => self.black_pieces(),
        };

        // Get the queen moves
        let bitboard = queen_attacks_on_the_fly(sq, self.all_pieces());

        let valid = bitboard & !friendly_pieces;

        Some(self.extract_moves(valid))
    }

    /// Collect all pieces and their positions using bitboards.
    pub fn collect_pieces(&self, opponent_color: Color) -> Vec<(Square, Piece)> {
        let mut opponent_pieces = Vec::new();

        // Get the bitboard representing all of the opponent's pieces
        let opponent_bitboard = match opponent_color {
            Color::White => self.white_pieces(),
            Color::Black => self.black_pieces(),
        };

        // Iterate over each bit set in the opponent's bitboard
        let mut bitboard = opponent_bitboard;
        while bitboard != 0 {
            // Isolate the least significant bit
            let square_index = bitboard.trailing_zeros() as usize;

            // Convert the index to a square
            let square = Square::usize_to_square(square_index);

            // Identify the piece at this position
            if let Some(piece) = self.get_piece_at(Square::usize_to_square(square_index)) {
                if piece.color() == opponent_color {
                    opponent_pieces.push((square, piece));
                }
            }

            // Remove the least significant bit from the bitboard
            bitboard &= bitboard - 1;
        }

        opponent_pieces
    }

    /// Check if a square is empty
    fn is_square_empty(&self, square: isize) -> bool {
        self.all_pieces() & (1 << square) == 0
    }

    /// Get the rank of a square (0 to 7)
    fn rank_of(&self, square: usize) -> usize {
        square / 8
    }

    /// Returns the piece at a given square
    pub fn get_piece_at(&self, square: Square) -> Option<Piece> {
        let bit = 1u64 << square as usize;

        if self.wP & bit != 0 {
            return Some(Piece::WhitePawn);
        }
        if self.wN & bit != 0 {
            return Some(Piece::WhiteKnight);
        }
        if self.wB & bit != 0 {
            return Some(Piece::WhiteBishop);
        }
        if self.wR & bit != 0 {
            return Some(Piece::WhiteRook);
        }
        if self.wQ & bit != 0 {
            return Some(Piece::WhiteQueen);
        }
        if self.wK & bit != 0 {
            return Some(Piece::WhiteKing);
        }
        if self.bP & bit != 0 {
            return Some(Piece::BlackPawn);
        }
        if self.bN & bit != 0 {
            return Some(Piece::BlackKnight);
        }
        if self.bB & bit != 0 {
            return Some(Piece::BlackBishop);
        }
        if self.bR & bit != 0 {
            return Some(Piece::BlackRook);
        }
        if self.bQ & bit != 0 {
            return Some(Piece::BlackQueen);
        }
        if self.bK & bit != 0 {
            return Some(Piece::BlackKing);
        }

        None // No piece at this square
    }

    /// A function to update the castling right of a color
    pub fn update_castling_rights(&mut self, color: Color) {
        self.castling_rights[color.index()] = false;
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

    /// A function to get the mutable bitboard for a piece
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

    /// A function to get the bitboard of a piece as immutable reference
    pub fn get_board(&mut self, piece: &Piece) -> &BitBoard {
        match piece {
            Piece::WhitePawn => &self.wP,
            Piece::WhiteKnight => &self.wN,
            Piece::WhiteBishop => &self.wB,
            Piece::WhiteRook => &self.wR,
            Piece::WhiteQueen => &self.wQ,
            Piece::WhiteKing => &self.wK,
            Piece::BlackPawn => &self.bP,
            Piece::BlackKnight => &self.bN,
            Piece::BlackBishop => &self.bB,
            Piece::BlackRook => &self.bR,
            Piece::BlackQueen => &self.bQ,
            Piece::BlackKing => &self.bK,
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

        // if self.castling_rights[0] {
        //     fen.push_str(" K");
        // }

        // if self.castling_rights[1] {
        //     fen.push_str(" Q");
        // }

        // Add placeholder values for the rest of the FEN string

        if self.castling_rights[Color::White.index()] {
            fen.push_str(" KQ");
        } else {
            fen.push_str(" -");
        }

        if self.castling_rights[Color::Black.index()] {
            fen.push_str("kq");
        } else {
            fen.push_str(" -");
        }

        fen.push_str(" - 0 1");

        if self.in_check(Color::White) {
            fen.push_str(" ;wK");
        }

        if self.in_check(Color::Black) {
            fen.push_str(" ;bK");
        }

        fen
    }

    /// Returns true if the king of the given color is in check
    pub fn in_check(&self, color: Color) -> bool {
        let king = match color {
            Color::White => self.wK,
            Color::Black => self.bK,
        };

        let attack_mask = self.attack_mask(color.opposite());

        (attack_mask & king) != 0
    }

    /// Return a Piece from a string
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
            _ => return Err(ChessError::InvalidPiece),
        };
        Ok(piece)
    }

    /// Bishop moves using magic bitboards
    pub fn magic_bishop_moves(square: Square, blockers: Bitboard) -> Bitboard {
        let magic = &BISHOP_MAGICS[square as usize];
        BISHOP_ATTACK_TABLE[magic_index(magic, blockers)]
    }

    /// Rook moves using magic bitboards
    pub fn magic_rook_moves(square: Square, blockers: Bitboard) -> Bitboard {
        let magic = &ROOK_MAGICS[square as usize];
        ROOK_ATTACK_TABLE[magic_index(magic, blockers)]
    }

    /// Queen moves using magic bitboards
    pub fn magic_queen_moves(sq: Square, blockers: Bitboard) -> Bitboard {
        Self::magic_bishop_moves(sq, blockers) | Self::magic_rook_moves(sq, blockers)
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
    pub fn capture_piece(&mut self, to: Square, piece: &Piece) -> Result<()> {
        let c_board = self.get_mut_board(&piece);
        if *c_board & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidPiece);
        }
        Self::clear(to, c_board);
        Ok(())
    }

    /// Sets a piece on the board
    pub fn set(square: Square, board: &mut BitBoard) {
        *board |= 1u64 << square as usize;
    }

    /// Clears a piece on the board
    pub fn clear(square: Square, board: &mut BitBoard) {
        *board &= !(1u64 << square as usize);
    }

    /// A function to undo a move on the board
    pub fn undo_move(&mut self, mv: &MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;
        let piece = mv.piece;

        Self::clear(to, self.get_mut_board(&piece));
        Self::set(from, self.get_mut_board(&piece));

        // Restore the captured piece, if any
        if let MoveType::Capture(captured_piece) = mv.move_type {
            Self::set(to, self.get_mut_board(&captured_piece));
        }
        Ok(())
    }

    /// A function to add a piece to the board
    pub fn add_piece(&mut self, at: Square, piece: Piece, promoted_to: Piece) -> Result<()> {
        Self::clear(at, self.get_mut_board(&piece));
        Self::set(at, self.get_mut_board(&promoted_to));
        Ok(())
    }

    /// Moves a piece on the board, while checking if the king is in check
    pub fn move_piece(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let color = piece.color();
        let board = self.get_board(&piece);

        // Check if the piece is at the 'from' square
        if *board & (1u64 << from as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }

        // if the player is already in_check, does making the move get king out of check?, if not don't move.
        if self.in_check(color) {
            Self::clear(from, self.get_mut_board(&piece));
            Self::set(to, self.get_mut_board(&piece));
            if self.in_check(color) {
                Self::clear(to, self.get_mut_board(&piece));
                Self::set(from, self.get_mut_board(&piece));
                return Err(ChessError::InvalidMove);
            }
        }

        // if the player is not in_check, remove the piece and check if the player is in_check, if not set the piece at new square.
        if !self.in_check(color) {
            Self::clear(from, self.get_mut_board(&piece));
            if self.in_check(color) {
                Self::set(from, self.get_mut_board(&piece));
                return Err(ChessError::InvalidMove);
            }
            Self::set(to, self.get_mut_board(&piece));
        }

        Ok(())
    }

    /** ---------------------------------------- Piece Move Logic ----------------------------------------- */

    /// Moves a white pawn
    pub fn wP_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let sq = from as usize + 8 as usize;
        if to as usize == from as usize + 16 {
            // Ensure the square directly in front is unoccupied
            if self.all_pieces() & (1u64 << sq) != 0 {
                return Err(ChessError::InvalidMove);
            }
            self.en_passant = 1u64 << sq;
        }
        if WHITE_PMOVES[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.move_piece(from, to, piece)
    }

    /// Moves a black pawn
    pub fn bP_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let sq = from as usize - 8 as usize;
        if to as usize == from as usize - 16 {
            // Ensure the square directly in front is unoccupied
            if self.all_pieces() & (1u64 << sq) != 0 {
                return Err(ChessError::InvalidMove);
            }

            self.en_passant = 1u64 << sq;
        }
        if BLACK_PMOVES[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.move_piece(from, to, piece)
    }

    /// Moves a knight
    pub fn knight_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        if KNIGHT_MOVES[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.move_piece(from, to, piece)
    }

    /// Moves a King
    pub fn king_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let color = piece.color();
        if KING_MOVES[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.update_castling_rights(color);
        self.move_piece(from, to, piece)
    }

    /// Moves a Rook
    pub fn rook_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let color = piece.color();
        if rook_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.update_castling_rights(color);
        self.move_piece(from, to, piece)
    }

    /// Moves a Bishop
    pub fn bishop_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        if bishop_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.move_piece(from, to, piece)
    }

    pub fn queen_moves(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        if queen_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidMove);
        }
        self.move_piece(from, to, piece)
    }

    /** --------------------------------Piece Capture Logic---------------------------------- */

    /// En passant capture
    pub fn en_passant_capture(&mut self, from: Square, to: Square, piece: &Piece) -> Result<()> {
        let color = piece.color();
        // Ensure en passant is possible and the destination is the en passant square
        if self.en_passant == 0 || self.en_passant & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }
        // Determine the attack pattern based on the piece color
        let valid_attack = if color == Color::White {
            WHITE_PATTACKS[from as usize]
        } else {
            BLACK_PATTACKS[from as usize]
        };

        // Validate that the move is a valid en passant capture
        if valid_attack & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }

        let en_piece: Piece = if color == Color::Black {
            Piece::WhitePawn
        } else {
            Piece::BlackPawn
        };

        // Calculate the captured pawn's square (it is behind the en passant target square)
        let captured_square = if color == Color::White {
            to as usize - 8 as usize // White pawns move "up" the board, so capture square is "down"
        } else {
            to as usize + 8 as usize // Black pawns move "down" the board, so capture square is "up"
        };

        self.capture_piece(Square::usize_to_square(captured_square), &en_piece)
            .and_then(|_| self.move_piece(from, to, piece))
    }

    /// White pawn captures
    pub fn wP_captures(
        &mut self,
        from: Square,
        to: Square,
        piece: &Piece,
        c_captured: &Piece,
    ) -> Result<()> {
        if WHITE_PATTACKS[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }

        self.move_piece(from, to, piece)
            .and_then(|_| self.capture_piece(to, c_captured))

        // self.capture_piece(to, c_captured)
        //     .and_then(|_| self.move_piece(from, to, piece))
    }

    /// Black pawn captures
    pub fn bP_captures(
        &mut self,
        from: Square,
        to: Square,
        piece: &Piece,
        c_captured: &Piece,
    ) -> Result<()> {
        if BLACK_PATTACKS[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }
        self.capture_piece(to, c_captured)
            .and_then(|_| self.move_piece(from, to, piece))
    }

    /// Knight Captures
    pub fn knight_captures(
        &mut self,
        from: Square,
        to: Square,
        piece: &Piece,
        c_captured: &Piece,
    ) -> Result<()> {
        if KNIGHT_MOVES[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }
        self.capture_piece(to, c_captured)
            .and_then(|_| self.move_piece(from, to, piece))
    }

    /// King Captures
    pub fn king_captures(
        &mut self,
        from: Square,
        to: Square,
        piece: &Piece,
        c_captured: &Piece,
    ) -> Result<()> {
        let color = piece.color();
        if KING_MOVES[from as usize] & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }
        self.capture_piece(to, c_captured).and_then(|_| {
            self.update_castling_rights(color);
            self.move_piece(from, to, piece)
        })
    }

    /// Rook Captures
    pub fn rook_captures(
        &mut self,
        from: Square,
        to: Square,
        piece: &Piece,
        c_captured: &Piece,
    ) -> Result<()> {
        let color = piece.color();
        if rook_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }
        self.capture_piece(to, c_captured).and_then(|_| {
            self.update_castling_rights(color);
            self.move_piece(from, to, piece)
        })
    }

    /// Bishop Captures
    pub fn bishop_captures(
        &mut self,
        from: Square,
        to: Square,
        piece: &Piece,
        c_captured: &Piece,
    ) -> Result<()> {
        if bishop_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }
        self.capture_piece(to, c_captured)
            .and_then(|_| self.move_piece(from, to, piece))
    }

    pub fn queen_captures(
        &mut self,
        from: Square,
        to: Square,
        piece: &Piece,
        c_captured: &Piece,
    ) -> Result<()> {
        if queen_attacks_on_the_fly(from, self.all_pieces()) & (1u64 << to as usize) == 0 {
            return Err(ChessError::InvalidCapture);
        }
        self.capture_piece(to, c_captured)
            .and_then(|_| self.move_piece(from, to, piece))
    }

    pub fn is_under_attack(&self, sq: Square, color: Color) -> bool {
        match color {
            Color::White => {
                if self.white_attack_mask() & (1u64 << sq as usize) == 0 {
                    return false;
                }
                return true;
            }
            Color::Black => {
                if self.black_attack_mask() & (1u64 << sq as usize) == 0 {
                    return false;
                }
                return true;
            }
        }
    }

    /** ----------------------------------------- Castling Logic ---------------------------------------------- */

    /// White King castling king side
    pub fn wK_castle_king_side(&mut self) -> Result<()> {
        let all_pieces = self.all_pieces();
        let mask_under_attack = [Square::E1, Square::F1, Square::G1];
        let mask_clear = (1 << Square::F1 as usize) | (1 << Square::G1 as usize);
        if all_pieces & mask_clear == 0
            && self.wR & (1 << Square::H1 as usize) != 0
            && mask_under_attack
                .iter()
                .all(|&x| self.is_under_attack(x, Color::White))
        {
            self.move_piece(Square::E1, Square::G1, &Piece::WhiteKing)
                .and_then(|_| {
                    self.update_castling_rights(Color::White);
                    self.move_piece(Square::H1, Square::F1, &Piece::WhiteRook)
                })
        } else {
            return Err(ChessError::InvalidCastle);
        }
    }

    /// White King castling queen side
    pub fn wK_castle_queen_side(&mut self) -> Result<()> {
        let all_pieces = self.all_pieces();
        let mask_under_attack = [Square::E1, Square::D1, Square::C1];
        let mask_clear =
            (1 << Square::C1 as usize) | (1 << Square::D1 as usize) | (1 << Square::B1 as usize);

        if all_pieces & mask_clear == 0
            && self.wR & (1 << Square::A1 as usize) != 0
            && mask_under_attack
                .iter()
                .all(|&x| self.is_under_attack(x, Color::White))
        {
            self.move_piece(Square::E1, Square::C1, &Piece::WhiteKing)
                .and_then(|_| {
                    self.update_castling_rights(Color::White);
                    self.move_piece(Square::A1, Square::D1, &Piece::WhiteRook)
                })
        } else {
            return Err(ChessError::InvalidCastle);
        }
    }

    /// Black King castling king side
    pub fn bK_castle_king_side(&mut self) -> Result<()> {
        let all_pieces = self.all_pieces();
        let mask_under_attack = [Square::E8, Square::F8];
        let mask_clear = (1 << Square::F8 as usize) | (1 << Square::G8 as usize);
        if all_pieces & mask_clear == 0
            && self.bR & (1 << Square::H8 as usize) != 0
            && mask_under_attack
                .iter()
                .all(|&x| self.is_under_attack(x, Color::Black))
        {
            self.move_piece(Square::E8, Square::G8, &Piece::BlackKing)
                .and_then(|_| {
                    self.update_castling_rights(Color::Black);
                    self.move_piece(Square::H8, Square::F8, &Piece::BlackRook)
                })
        } else {
            Err(ChessError::InvalidCastle)
        }
    }

    /// Black King castling queen side
    pub fn bK_castle_queen_side(&mut self) -> Result<()> {
        let all_pieces = self.all_pieces();
        let mask_under_attack = [Square::E8, Square::D8, Square::C8];
        let mask_clear =
            (1 << Square::C8 as usize) | (1 << Square::D8 as usize) | (1 << Square::B8 as usize);

        if all_pieces & mask_clear == 0
            && self.bR & (1 << Square::A8 as usize) != 0
            && mask_under_attack
                .iter()
                .all(|&x| self.is_under_attack(x, Color::Black))
        {
            self.move_piece(Square::E8, Square::C8, &Piece::BlackKing)
                .and_then(|_| {
                    self.update_castling_rights(Color::Black);
                    self.move_piece(Square::A8, Square::D8, &Piece::BlackRook)
                })
        } else {
            Err(ChessError::InvalidCastle)
        }
    }

    /** ----------------------------------------- Compute Attack Mask for current pieces-------------------------------- */

    pub fn attack_mask(&self, color: Color) -> Bitboard {
        match color {
            Color::White => self.white_attack_mask(),
            Color::Black => self.black_attack_mask(),
        }
    }

    /// A function to calculate the attack mask for white pieces
    pub fn white_attack_mask(&self) -> Bitboard {
        let mut attacks = 0u64;

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
            attacks |= bishop_attacks_on_the_fly(square, self.all_pieces());
            bishops &= bishops - 1; // Remove the LSB
        }

        // Rook attacks
        let mut rooks = self.wR;
        while rooks != 0 {
            let rook_pos = rooks.trailing_zeros() as usize;
            let square = Square::usize_to_square(rook_pos);
            attacks |= rook_attacks_on_the_fly(square, self.all_pieces());
            rooks &= rooks - 1; // Remove the LSB
        }

        // Queen attacks
        let mut queens = self.wQ;
        while queens != 0 {
            let queen_pos = queens.trailing_zeros() as usize;
            let square = Square::usize_to_square(queen_pos);
            attacks |= queen_attacks_on_the_fly(square, self.all_pieces());
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
            attacks |= bishop_attacks_on_the_fly(square, self.all_pieces());
            bishops &= bishops - 1; // Remove the LSB
        }

        // Rook attacks
        let mut rooks = self.bR;
        while rooks != 0 {
            let rook_pos = rooks.trailing_zeros() as usize;
            let square = Square::usize_to_square(rook_pos);
            attacks |= rook_attacks_on_the_fly(square, self.all_pieces());
            rooks &= rooks - 1; // Remove the LSB
        }

        // Queen attacks
        let mut queens = self.bQ;
        while queens != 0 {
            let queen_pos = queens.trailing_zeros() as usize;
            let square = Square::usize_to_square(queen_pos);
            attacks |= queen_attacks_on_the_fly(square, self.all_pieces());
            queens &= queens - 1; // Remove the LSB
        }

        attacks
    }
}
