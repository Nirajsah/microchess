use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

use crate::{
    ChessError, Result,
    moves::{
        generator::{
            NOT_A_FILE, NOT_H_FILE, bishop_attacks_on_the_fly, computed_king_moves,
            computed_knight_attacks, computed_pawn_attacks, computed_pawn_moves,
            queen_attacks_on_the_fly, rook_attacks_on_the_fly,
        },
        move_type::{MoveData, MoveType},
    },
    pieces::Color,
};

use super::{bitboard::BitBoard, piece::Piece, square::Square};

lazy_static! {
    pub static ref KNIGHT_MOVES: [BitBoard; 64] = computed_knight_attacks();
    pub static ref KING_MOVES: [BitBoard; 64] = computed_king_moves();
    pub static ref WHITE_PMOVES: [BitBoard; 64] = computed_pawn_moves(&Color::White);
    pub static ref WHITE_PATTACKS: [BitBoard; 64] = computed_pawn_attacks(&Color::White);
    pub static ref BLACK_PATTACKS: [BitBoard; 64] = computed_pawn_attacks(&Color::Black);
    pub static ref BLACK_PMOVES: [BitBoard; 64] = computed_pawn_moves(&Color::Black);
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct ChessBoard {
    pub bitboards: [BitBoard; 12],  // one for each piece type
    pub occupancies: [BitBoard; 2], // white and black occupancy bitboards(0 White, 1 Black)
    pub square_map: Vec<Option<Piece>>,
    /// Castling rights
    pub attack_masks: [BitBoard; 2], // [White, Black]
    pub attack_mask_history: Vec<[BitBoard; 2]>,
    pub castling_rights: u8, // [White, Black](KingSide, QueenSide)
    /// En passant
    pub en_passant: BitBoard,
}

impl Default for ChessBoard {
    fn default() -> Self {
        ChessBoard {
            bitboards: [BitBoard::default(); 12],
            occupancies: [BitBoard::default(), BitBoard::default()],
            square_map: vec![None; 64],
            attack_masks: [BitBoard::default(), BitBoard::default()],
            attack_mask_history: Vec::new(),
            castling_rights: 0b1111,
            en_passant: BitBoard::default(),
        }
    }
}

impl ChessBoard {
    /// Generates a new Board
    pub fn new() -> Self {
        ChessBoard {
            bitboards: [
                BitBoard(0x000000000000FF00),
                BitBoard(0x0000000000000042),
                BitBoard(0x0000000000000024),
                BitBoard(0x0000000000000081),
                BitBoard(0x0000000000000008),
                BitBoard(0x0000000000000010),
                BitBoard(0x00FF000000000000),
                BitBoard(0x4200000000000000),
                BitBoard(0x2400000000000000),
                BitBoard(0x8100000000000000),
                BitBoard(0x0800000000000000),
                BitBoard(0x1000000000000000),
            ],
            occupancies: [
                BitBoard(0x0000_0000_0000_FFFF),
                BitBoard(0xFFFF_0000_0000_0000),
            ],
            square_map: vec![None; 64],
            attack_masks: Self::initial_attack_masks(),
            attack_mask_history: Vec::new(),
            castling_rights: 0b1111,
            en_passant: BitBoard::EMPTY,
        }
    }

    pub fn initial_attack_masks() -> [BitBoard; 2] {
        let mut attack_masks: [BitBoard; 2] = [BitBoard::EMPTY, BitBoard::EMPTY];
        // White attack mask initialization
        let mut white_pawn_attacks = BitBoard(0);
        for sq in [
            Square::A2,
            Square::B2,
            Square::C2,
            Square::D2,
            Square::E2,
            Square::F2,
            Square::G2,
            Square::H2,
        ] {
            white_pawn_attacks |= WHITE_PATTACKS[sq as usize].into();
        }
        // Black attack mask initialization
        let mut black_pawn_attacks = BitBoard(0);
        for sq in [
            Square::A7,
            Square::B7,
            Square::C7,
            Square::D7,
            Square::E7,
            Square::F7,
            Square::G7,
            Square::H7,
        ] {
            black_pawn_attacks |= BLACK_PATTACKS[sq as usize].into();
        }
        attack_masks[Color::White.index()] = white_pawn_attacks
            | KNIGHT_MOVES[Square::B1 as usize]
            | KNIGHT_MOVES[Square::G1 as usize];

        attack_masks[Color::Black.index()] = black_pawn_attacks
            | KNIGHT_MOVES[Square::B8 as usize]
            | KNIGHT_MOVES[Square::G8 as usize];

        attack_masks
    }

    pub fn attack_mask(&self, col: Color) -> BitBoard {
        self.attack_masks[col.index()]
    }

    pub fn update_attack_masks(&mut self, mv: MoveData) {
        // Remove old attacks of the piece
        self.remove_piece_attacks(mv.from, mv.piece);
        // If capture: remove opponent attacks from captured piece
        if let MoveType::Capture(captured) = mv.move_type {
            self.remove_piece_attacks(mv.to, captured);
        }
        // Add new attacks for the moved piece
        self.add_piece_attacks(mv.to, mv.piece);
    }

    fn remove_piece_attacks(&mut self, square: Square, piece: Piece) {
        let idx = piece.color().index();
        self.attack_masks[idx] ^= self.attacks_for_piece(square, piece).into();
    }

    fn add_piece_attacks(&mut self, square: Square, piece: Piece) {
        let idx = piece.color().index();
        self.attack_masks[idx] |= self.attacks_for_piece(square, piece).into();
    }

    fn attacks_for_piece(&self, sq: Square, piece: Piece) -> BitBoard {
        match piece {
            Piece::WhitePawn => WHITE_PATTACKS[sq as usize],
            Piece::BlackPawn => BLACK_PATTACKS[sq as usize],
            Piece::WhiteKnight | Piece::BlackKnight => KNIGHT_MOVES[sq as usize],
            Piece::WhiteBishop | Piece::BlackBishop => {
                bishop_attacks_on_the_fly(sq.into(), self.all_pieces())
            }
            Piece::WhiteRook | Piece::BlackRook => {
                rook_attacks_on_the_fly(sq.into(), self.all_pieces())
            }
            Piece::WhiteQueen | Piece::BlackQueen => {
                queen_attacks_on_the_fly(sq.into(), self.all_pieces())
            }
            Piece::WhiteKing | Piece::BlackKing => KING_MOVES[sq as usize],
        }
    }

    /// A Method to check if the square is under attack
    /// ```True``` means the square is under attack
    pub fn is_under_attack(&self, sq: Square, by_color: Color) -> bool {
        self.attack_masks[by_color.index()].is_set(sq)
    }

    pub fn clear(&mut self) {
        self.bitboards = [BitBoard::EMPTY; 12];

        // Reset other game state if you have them
        self.castling_rights = 0b1111;
        self.en_passant = BitBoard::EMPTY;
    }

    /// method to reset en_passant square
    pub fn reset_enpassant(&mut self) {
        self.en_passant = BitBoard::EMPTY;
    }

    /// A function to generate FEN string using bitboard
    pub fn to_fen(&self, halfmove_clock: u8, fullmove_number: u8, active_player: Color) -> String {
        let bitboards = self.bitboards;

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

        if mask & 0b0001 != 0 {
            castling_str.push('K');
        }
        if mask & 0b0010 != 0 {
            castling_str.push('Q');
        }
        if mask & 0b0100 != 0 {
            castling_str.push('k');
        }
        if mask & 0b1000 != 0 {
            castling_str.push('q');
        }
        if castling_str.is_empty() {
            castling_str.push('-');
        }

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

        fen.push_str(&halfmove_clock.to_string());

        fen.push(' '); // just to have a whitespace

        fen.push_str(&fullmove_number.to_string());

        fen
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

    /// Returns a bitboard containing all pieces on the board
    pub fn all_pieces(&self) -> BitBoard {
        self.occupancies[0] | self.occupancies[1]
    }

    /// Returns the bitboard of all white pieces on the board
    pub fn white_pieces(&self) -> BitBoard {
        self.occupancies[0]
    }

    /// Returns the bitboard of all black pieces on the board
    pub fn black_pieces(&self) -> BitBoard {
        self.occupancies[1]
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
        &mut self.bitboards[piece.index()]
    }

    /// A function to get the bitboard of a piece as immutable reference
    pub fn get_board(&self, piece: &Piece) -> &BitBoard {
        &self.bitboards[piece.index()]
    }

    /// Moves a piece on the board, while checking if the king is in check
    pub fn apply_move(&mut self, mv: MoveData) -> Result<()> {
        self.attack_mask_history.push(self.attack_masks); // save current attack mask useful when undo

        let piece_idx = mv.piece.index();
        let color_idx = mv.piece.color().index();

        let from_bit = 1u64 << mv.from;
        let to_bit = 1u64 << mv.to;

        self.bitboards[piece_idx] ^= from_bit | to_bit;

        // Update occupancy for this color
        self.occupancies[color_idx] ^= from_bit | to_bit;

        // Update square_map
        self.square_map[mv.from as usize] = None;
        self.square_map[mv.to as usize] = Some(mv.piece);

        self.update_attack_masks(mv);

        Ok(())
    }

    pub fn undo_move(&mut self, mv: MoveData) -> Result<()> {
        let last_masks = self.attack_mask_history.pop().expect("No move to undo");

        self.attack_masks = last_masks;

        let piece_idx = mv.piece.index();
        let color_idx = mv.piece.color().index();

        let from_bit = 1u64 << mv.from;
        let to_bit = 1u64 << mv.to;

        // Undo bitboards
        self.bitboards[piece_idx] ^= from_bit | to_bit;

        // Undo occupancies
        self.occupancies[color_idx] ^= from_bit | to_bit;

        // Undo square map
        self.square_map[mv.from as usize] = Some(mv.piece);
        self.square_map[mv.to as usize] = None;

        Ok(())
    }

    pub fn get_opponent_pieces(&self, piece: Piece) -> BitBoard {
        match piece.color() {
            Color::White => self.black_pieces(),
            Color::Black => self.white_pieces(),
        }
    }

    /// Handle captures
    pub fn piece_capture(&mut self, capture_piece: Piece, mv: MoveData) -> Result<()> {
        let capture_idx = capture_piece.index();
        self.bitboards[capture_idx].clear(mv.to);
        let captured_color_idx = capture_piece.color().index();
        self.occupancies[captured_color_idx].clear(mv.to);

        Ok(())
    }

    pub fn wp_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;
        let piece = mv.piece;

        match mv.move_type {
            MoveType::Move => {
                if !WHITE_PMOVES[from as usize].is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
                // For two-square moves, check if the intermediate square is also clear

                if to == from + 16 {
                    let intermediate_sq = from + 8;

                    if self.all_pieces().is_set(intermediate_sq) {
                        return Err(ChessError::InvalidMove);
                    }
                    // Set en passant square only for two-square moves
                    self.en_passant = BitBoard(1u64 << (from + 8));
                    // update black attack mask: add only adjacent pawn captures
                    let ep_mask = (self.en_passant.0 >> 7 & NOT_H_FILE)
                        | (self.en_passant.0 >> 9 & NOT_A_FILE);

                    self.attack_masks[Color::Black.index()] |= ep_mask;
                }

                self.apply_move(mv)
            }
            MoveType::Capture(capture_piece) => {
                if !WHITE_PATTACKS[from as usize].is_set(to)
                    || !self.get_opponent_pieces(piece).is_set(to)
                {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)
                    .and_then(|_| self.apply_move(mv))
            }
            _ => Err(ChessError::InvalidMove),
        }
    }

    pub fn bp_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;
        let piece = mv.piece;

        match mv.move_type {
            MoveType::Move => {
                if !BLACK_PMOVES[from as usize].is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
                // For two-square moves, check if the intermediate square is also clear
                if to == from - 16 {
                    let intermediate_sq = from - 8;
                    if self.all_pieces().is_set(intermediate_sq) {
                        return Err(ChessError::InvalidMove);
                    }
                    // Set en passant square only for two-square moves
                    self.en_passant = BitBoard(1u64 << (from - 8));
                    // update white attack mask: add only adjacent pawn captures
                    let ep_mask = (self.en_passant.0 << 7 & NOT_A_FILE)
                        | (self.en_passant.0 << 9 & NOT_H_FILE);

                    self.attack_masks[Color::White.index()] |= ep_mask;
                }
                self.apply_move(mv)
            }
            MoveType::Capture(capture_piece) => {
                if !BLACK_PATTACKS[from as usize].is_set(to)
                    || !self.get_opponent_pieces(piece).is_set(to)
                {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)
                    .and_then(|_| self.apply_move(mv))
            }
            _ => Err(ChessError::InvalidMove),
        }
    }

    pub fn rook_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;
        let piece = mv.piece;

        match mv.move_type {
            MoveType::Move => {
                if !rook_attacks_on_the_fly(from.into(), self.all_pieces()).is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
            }
            MoveType::Capture(capture_piece) => {
                if !rook_attacks_on_the_fly(from.into(), self.all_pieces()).is_set(to) {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)?;
            }
            _ => return Err(ChessError::InvalidMove),
        }

        self.revoke_castling_rights(piece.color(), Some(from));
        self.apply_move(mv)
    }

    pub fn bishop_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;

        match mv.move_type {
            MoveType::Move => {
                if !bishop_attacks_on_the_fly(from.into(), self.all_pieces()).is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
            }
            MoveType::Capture(capture_piece) => {
                if !bishop_attacks_on_the_fly(from.into(), self.all_pieces()).is_set(to) {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)?;
            }
            _ => return Err(ChessError::InvalidMove),
        }
        self.apply_move(mv)
    }

    pub fn queen_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;

        match mv.move_type {
            MoveType::Move => {
                if !queen_attacks_on_the_fly(from.into(), self.all_pieces()).is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
            }
            MoveType::Capture(capture_piece) => {
                if !queen_attacks_on_the_fly(from.into(), self.all_pieces()).is_set(to) {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)?;
            }
            _ => return Err(ChessError::InvalidMove),
        }
        self.apply_move(mv)
    }

    pub fn knight_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;

        match mv.move_type {
            MoveType::Move => {
                if !KNIGHT_MOVES[from as usize].is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
            }
            MoveType::Capture(capture_piece) => {
                if KNIGHT_MOVES[from as usize].is_set(to) {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)?;
            }
            _ => return Err(ChessError::InvalidMove),
        }
        self.apply_move(mv)
    }

    pub fn king_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;

        match mv.move_type {
            MoveType::Move => {
                if !KING_MOVES[from as usize].is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
            }
            MoveType::Capture(capture_piece) => {
                if KING_MOVES[from as usize].is_set(to) {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)?;
            }
            _ => return Err(ChessError::InvalidMove),
        }

        self.revoke_castling_rights(mv.piece.color(), None);
        self.apply_move(mv)
    }
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use crate::utils::print_bitboard;

    use super::*;

    // Helper function to create a default test board with initial setup
    fn create_test_board() -> ChessBoard {
        ChessBoard::default()
    }

    // Helper function to create a move
    fn create_move(piece: Piece, from: String, to: String, move_type: MoveType) -> MoveData {
        MoveData {
            piece,
            from: Square::from_str(from.as_str()).unwrap(),
            to: Square::from_str(to.as_str()).unwrap(),
            move_type,
        }
    }

    #[test]
    fn test_board_generation() {
        let board: ChessBoard = ChessBoard::new();

        let expeced_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        assert_eq!(
            board.to_fen(0, 1, Color::White),
            expeced_fen,
            "Board FEN is not correct!"
        );
    }

    #[test]
    fn test_revoke_castling_rights_white_kingside() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111; // All rights initially

        board.revoke_castling_rights(Color::White, Some(Square::H1));
        assert_eq!(
            board.castling_rights & 0b0001,
            0,
            "White kingside should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b1110,
            0b1110,
            "Other rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_white_queenside() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::White, Some(Square::A1));
        assert_eq!(
            board.castling_rights & 0b0010,
            0,
            "White queenside should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b1101,
            0b1101,
            "Other rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_black_kingside() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::Black, Some(Square::H8));
        assert_eq!(
            board.castling_rights & 0b0100,
            0,
            "Black kingside should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b1011,
            0b1011,
            "Other rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_black_queenside() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::Black, Some(Square::A8));
        assert_eq!(
            board.castling_rights & 0b1000,
            0,
            "Black queenside should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b0111,
            0b0111,
            "Other rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_white_king_moved() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::White, None);
        assert_eq!(
            board.castling_rights & 0b0011,
            0,
            "Both white sides should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b1100,
            0b1100,
            "Black rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_black_king_moved() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::Black, None);
        assert_eq!(
            board.castling_rights & 0b1100,
            0,
            "Both black sides should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b0011,
            0b0011,
            "White rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_invalid_square() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;
        let original_rights = board.castling_rights;

        // Test with invalid square - should not change anything
        board.revoke_castling_rights(Color::White, Some(Square::E4));
        assert_eq!(
            board.castling_rights, original_rights,
            "Invalid square should not change rights"
        );
    }

    #[test]
    fn test_get_board_immutable_access() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        // Set a piece on the board
        board
            .get_mut_board(&white_pawn)
            .set(Square::uint_to_square(8)); // Set bit at position 8

        // Test immutable access
        let board_ref = board.get_board(&white_pawn);
        assert!(
            board_ref.is_set(Square::uint_to_square(8)),
            "Should have piece at position 8"
        );
    }

    #[test]
    fn test_get_mut_board_mutable_access() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        // Test mutable access
        {
            let board_ref = board.get_mut_board(&white_pawn);
            board_ref.set(Square::uint_to_square(16));
        }

        assert!(
            board
                .get_board(&white_pawn)
                .is_set(Square::uint_to_square(16)),
            "Should have piece at position 16"
        );
    }

    #[test]
    fn test_make_move_basic() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        // Set up initial position
        board.get_mut_board(&white_pawn).set(Square::A2); // A2
        board.square_map[8] = Some(white_pawn);
        board.occupancies[Color::White.index()].set(Square::A2); // A2;

        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "a3".to_string(),
            MoveType::Move,
        );
        let result = board.wp_move_or_capture(mv);

        assert!(result.is_ok(), "Move should succeed");
        assert!(
            !board
                .get_board(&white_pawn)
                .is_set(Square::uint_to_square(8)),
            "Piece should be removed from source"
        );
        assert!(
            board
                .get_board(&white_pawn)
                .is_set(Square::uint_to_square(16)),
            "Piece should be at destination"
        );
        assert_eq!(board.square_map[8], None, "Source square should be empty");
        assert_eq!(
            board.square_map[16],
            Some(white_pawn),
            "Destination should have piece"
        );
    }

    #[test]
    fn test_piece_capture() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;
        let black_pawn = Piece::BlackPawn;

        // Set up capture scenario
        board.get_mut_board(&black_pawn).set(Square::B3); // Target square
        board.occupancies[Color::Black.index()].set(Square::B3);

        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "b3".to_string(),
            MoveType::Capture(black_pawn),
        );
        let result = board.piece_capture(black_pawn, mv);

        assert!(result.is_ok(), "Capture should succeed");
        assert!(
            !board.get_board(&black_pawn).is_set(Square::B3),
            "Captured piece should be removed"
        );
        assert!(
            !board.occupancies[Color::Black.index()].is_set(Square::B3),
            "Black occupancy should be updated"
        );
    }

    #[test]
    fn test_white_pawn_single_move() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        // Set up pawn at A2 (square 8)
        board.get_mut_board(&white_pawn).set(Square::A2);
        board.square_map[8] = Some(white_pawn);
        board.occupancies[Color::White.index()].set(Square::A2);

        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "a3".to_string(),
            MoveType::Move,
        );
        let result = board.wp_move_or_capture(mv);

        assert!(result.is_ok(), "Single pawn move should succeed");
        assert!(
            board.get_board(&white_pawn).is_set(Square::A3),
            "Pawn should be at destination"
        );
    }

    #[test]
    fn test_white_pawn_double_move() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        // Set up pawn at A2 (square 8)
        board.get_mut_board(&white_pawn).set(Square::A2);
        board.square_map[8] = Some(white_pawn);
        board.occupancies[Color::White.index()].set(Square::A2);

        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "a4".to_string(),
            MoveType::Move,
        );
        let result = board.wp_move_or_capture(mv);

        assert!(result.is_ok(), "Double pawn move should succeed");
        assert!(
            board.en_passant.is_set(Square::A3),
            "En passant square should be set"
        );
        assert!(
            board.attack_masks[Color::Black.index()]
                & (board.en_passant.0 >> 7 | board.en_passant.0 >> 9)
                != 0,
            "Black attack mask should be updated for en passant"
        );
    }

    #[test]
    fn test_white_pawn_blocked_double_move() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;
        let blocking_piece = Piece::BlackPawn;

        // Set up pawn at A2 and blocking piece at A3
        board.get_mut_board(&white_pawn).set(Square::A2);
        board.get_mut_board(&blocking_piece).set(Square::A3); // Blocking square
        board.occupancies[Color::Black.index()].set(Square::uint_to_square(16));
        board.square_map[8] = Some(white_pawn);
        board.square_map[16] = Some(blocking_piece);

        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "a4".to_string(),
            MoveType::Move,
        );
        let result = board.wp_move_or_capture(mv);

        assert!(result.is_err(), "Blocked double move should fail");
    }

    #[test]
    fn test_white_pawn_capture() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;
        let black_pawn = Piece::BlackPawn;

        // Set up capture scenario: white pawn at A2, black pawn at B3
        board.get_mut_board(&white_pawn).set(Square::A2); // A2
        board.get_mut_board(&black_pawn).set(Square::B3); // B3
        board.square_map[8] = Some(white_pawn);
        board.square_map[17] = Some(black_pawn);
        board.occupancies[Color::White.index()].set(Square::A2);
        board.occupancies[Color::Black.index()].set(Square::B3);

        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "b3".to_string(),
            MoveType::Capture(black_pawn),
        );
        let result = board.wp_move_or_capture(mv);

        assert!(result.is_ok(), "Pawn capture should succeed");
        assert!(
            !board
                .get_board(&black_pawn)
                .is_set(Square::uint_to_square(17)),
            "Captured pawn should be removed"
        );
    }

    #[test]
    fn test_white_pawn_invalid_move() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        board.get_mut_board(&white_pawn).set(Square::A2);
        board.square_map[8] = Some(white_pawn);

        // Try invalid move (backward)
        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "a1".to_string(),
            MoveType::Move,
        );
        let result = board.wp_move_or_capture(mv);

        assert!(result.is_err(), "Invalid pawn move should fail");
    }

    #[test]
    fn test_black_pawn_single_move() {
        let mut board = create_test_board();
        let black_pawn = Piece::BlackPawn;

        // Set up pawn at A7 (square 48)
        board
            .get_mut_board(&black_pawn)
            .set(Square::uint_to_square(48));
        board.square_map[48] = Some(black_pawn);
        board.occupancies[Color::Black.index()].set(Square::uint_to_square(48));

        let mv = create_move(
            black_pawn,
            "a7".to_string(),
            "a6".to_string(),
            MoveType::Move,
        );
        let result = board.bp_move_or_capture(mv);

        assert!(result.is_ok(), "Black pawn single move should succeed");
    }

    #[test]
    fn test_black_pawn_double_move() {
        let mut board = create_test_board();
        let black_pawn = Piece::BlackPawn;

        // Set up pawn at A7 (square 48)
        board
            .get_mut_board(&black_pawn)
            .set(Square::uint_to_square(48));
        board.square_map[48] = Some(black_pawn);
        board.occupancies[Color::Black.index()].set(Square::uint_to_square(48));

        let mv = create_move(
            black_pawn,
            "a7".to_string(),
            "a5".to_string(),
            MoveType::Move,
        );
        let result = board.bp_move_or_capture(mv);

        assert!(result.is_ok(), "Black pawn double move should succeed");
        assert!(
            board.en_passant.is_set(Square::uint_to_square(40)),
            "En passant square should be set"
        );
    }

    #[test]
    fn test_rook_horizontal_move() {
        let mut board = create_test_board();
        let white_rook = Piece::WhiteRook;

        // Set up rook at A1
        board.get_mut_board(&white_rook).set(Square::A1);
        board.square_map[0] = Some(white_rook);
        board.occupancies[Color::White.index()].set(Square::A1);
        board.castling_rights = 0b1111;

        let mv = create_move(
            white_rook,
            "a1".to_string(),
            "e1".to_string(),
            MoveType::Move,
        );
        let result = board.rook_move_or_capture(mv);

        assert!(result.is_ok(), "Rook horizontal move should succeed");
        assert_eq!(
            board.castling_rights & 0b0010,
            0,
            "Queenside castling should be revoked"
        );
    }

    #[test]
    fn test_rook_vertical_move() {
        let mut board = create_test_board();
        let white_rook = Piece::WhiteRook;

        // Set up rook at A1
        board.get_mut_board(&white_rook).set(Square::A1);
        board.square_map[0] = Some(white_rook);
        board.occupancies[Color::White.index()].set(Square::A1);

        let mv = create_move(
            white_rook,
            "a1".to_string(),
            "a5".to_string(),
            MoveType::Move,
        );
        let result = board.rook_move_or_capture(mv);

        assert!(result.is_ok(), "Rook vertical move should succeed");
    }

    #[test]
    fn test_bishop_diagonal_move() {
        let mut board = create_test_board();
        let white_bishop = Piece::WhiteBishop;

        // Set up bishop at D4 (square 27)
        board
            .get_mut_board(&white_bishop)
            .set(Square::uint_to_square(27));
        board.square_map[27] = Some(white_bishop);
        board.occupancies[Color::White.index()].set(Square::uint_to_square(27));

        let mv = create_move(
            white_bishop,
            "d4".to_string(),
            "f6".to_string(),
            MoveType::Move,
        );
        let result = board.bishop_move_or_capture(mv);

        assert!(result.is_ok(), "Bishop diagonal move should succeed");
    }

    #[test]
    fn test_queen_combined_moves() {
        let mut board = create_test_board();
        let white_queen = Piece::WhiteQueen;

        // Set up queen at D4
        board
            .get_mut_board(&white_queen)
            .set(Square::uint_to_square(27));
        board.square_map[27] = Some(white_queen);
        board.occupancies[Color::White.index()].set(Square::uint_to_square(27));

        // Test horizontal move
        let mv1 = create_move(
            white_queen,
            "d4".to_string(),
            "h4".to_string(),
            MoveType::Move,
        );
        assert!(
            board.queen_move_or_capture(mv1).is_ok(),
            "Queen horizontal move should succeed"
        );

        // Reset queen position
        board.undo_move(mv1).unwrap();

        // Test diagonal move
        let mv2 = create_move(
            white_queen,
            "d4".to_string(),
            "f6".to_string(),
            MoveType::Move,
        );
        assert!(
            board.queen_move_or_capture(mv2).is_ok(),
            "Queen diagonal move should succeed"
        );
    }

    #[test]
    fn test_knight_l_shaped_moves() {
        let mut board = create_test_board();
        let white_knight = Piece::WhiteKnight;

        // Set up knight at E4 (square 28)
        board
            .get_mut_board(&white_knight)
            .set(Square::uint_to_square(28));
        board.square_map[28] = Some(white_knight);
        board.occupancies[Color::White.index()].set(Square::uint_to_square(28));

        // Test valid knight move
        let mv = create_move(
            white_knight,
            "e4".to_string(),
            "f6".to_string(),
            MoveType::Move,
        );
        let result = board.knight_move_or_capture(mv);

        assert!(result.is_ok(), "Knight L-shaped move should succeed");
    }

    #[test]
    fn test_knight_invalid_move() {
        let mut board = create_test_board();
        let white_knight = Piece::WhiteKnight;

        board
            .get_mut_board(&white_knight)
            .set(Square::uint_to_square(28));
        board.square_map[28] = Some(white_knight);

        // Test invalid move (not L-shaped)
        let mv = create_move(
            white_knight,
            "e4".to_string(),
            "f4".to_string(),
            MoveType::Move,
        );
        let result = board.knight_move_or_capture(mv);

        assert!(result.is_err(), "Invalid knight move should fail");
    }

    #[test]
    fn test_king_single_square_moves() {
        let mut board = create_test_board();
        let white_king = Piece::WhiteKing;

        // Set up king at E1
        board.get_mut_board(&white_king).set(Square::E1);
        board.square_map[4] = Some(white_king);
        board.occupancies[Color::White.index()].set(Square::E1);
        board.castling_rights = 0b1111;

        let mv = create_move(
            white_king,
            "e1".to_string(),
            "e2".to_string(),
            MoveType::Move,
        );
        let result = board.king_move_or_capture(mv);

        assert!(result.is_ok(), "King single square move should succeed");
        assert_eq!(
            board.castling_rights & 0b0011,
            0,
            "Both white castling rights should be revoked"
        );
    }

    #[test]
    fn test_king_invalid_move() {
        let mut board = create_test_board();
        let white_king = Piece::WhiteKing;

        board.get_mut_board(&white_king).set(Square::E1);
        board.square_map[4] = Some(white_king);

        // Test invalid move (too far)
        let mv = create_move(
            white_king,
            "e1".to_string(),
            "e3".to_string(),
            MoveType::Move,
        );
        let result = board.king_move_or_capture(mv);

        assert!(result.is_err(), "Invalid king move should fail");
    }

    #[test]
    fn test_capture_with_all_pieces() {
        let mut board = create_test_board();
        let white_queen = Piece::WhiteQueen;
        let black_pawn = Piece::BlackPawn;

        // Set up capture scenario
        board
            .get_mut_board(&white_queen)
            .set(Square::uint_to_square(27)); // D4
        board
            .get_mut_board(&black_pawn)
            .set(Square::uint_to_square(35)); // D5
        board.square_map[27] = Some(white_queen);
        board.square_map[35] = Some(black_pawn);
        board.occupancies[Color::White.index()].set(Square::uint_to_square(27));
        board.occupancies[Color::Black.index()].set(Square::uint_to_square(35));

        let mv = create_move(
            white_queen,
            "d4".to_string(),
            "d5".to_string(),
            MoveType::Capture(black_pawn),
        );
        let result = board.queen_move_or_capture(mv);

        assert!(result.is_ok(), "Queen capture should succeed");

        print_bitboard(*board.get_board(&black_pawn));

        assert!(
            !board
                .get_board(&black_pawn)
                .is_set(Square::uint_to_square(35)),
            "Captured piece should be removed"
        );
    }

    #[test]
    fn test_attack_mask_history_preservation() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        board.get_mut_board(&white_pawn).set(Square::A2);
        board.square_map[8] = Some(white_pawn);

        let original_history_len = board.attack_mask_history.len();

        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "a3".to_string(),
            MoveType::Move,
        );
        let _ = board.apply_move(mv);

        assert_eq!(
            board.attack_mask_history.len(),
            original_history_len + 1,
            "Attack mask history should be preserved"
        );

        let _ = board.undo_move(mv);
        assert_eq!(
            board.attack_mask_history.len(),
            original_history_len,
            "Attack mask history should be restored after undo"
        );
    }

    #[test]
    fn test_get_opponent_pieces() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;
        let black_pawn = Piece::BlackPawn;

        board
            .get_mut_board(&black_pawn)
            .set(Square::uint_to_square(48));
        board.occupancies[Color::Black.index()].set(Square::uint_to_square(48));

        let opponent_pieces = board.get_opponent_pieces(white_pawn);
        assert!(
            opponent_pieces.is_set(Square::uint_to_square(48)),
            "Should find black pieces as opponent"
        );
    }

    #[test]
    fn test_multiple_move_undo_sequence() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        // Set up initial position
        board.get_mut_board(&white_pawn).set(Square::A2);
        board.square_map[8] = Some(white_pawn);
        board.occupancies[Color::White.index()].set(Square::A2);

        let moves = [
            create_move(
                white_pawn,
                "a2".to_string(),
                "a3".to_string(),
                MoveType::Move,
            ),
            create_move(
                white_pawn,
                "a3".to_string(),
                "a4".to_string(),
                MoveType::Move,
            ),
            create_move(
                white_pawn,
                "a4".to_string(),
                "a5".to_string(),
                MoveType::Move,
            ),
        ];

        // Make all moves
        for &mv in &moves {
            assert!(board.apply_move(mv).is_ok(), "Move should succeed");
        }

        // Undo all moves in reverse order
        for &mv in moves.iter().rev() {
            assert!(board.undo_move(mv).is_ok(), "Undo should succeed");
        }

        // Verify we're back to original state
        assert!(
            board.get_board(&white_pawn).is_set(Square::A2),
            "Should be back to original position"
        );
        assert_eq!(
            board.square_map[8],
            Some(white_pawn),
            "Square map should be restored"
        );
    }

    #[test]
    fn test_undo_move_basic() {
        let mut board = create_test_board();
        let white_pawn = Piece::WhitePawn;

        // Set up initial position
        board.get_mut_board(&white_pawn).set(Square::A2);
        board.square_map[8] = Some(white_pawn);
        board.occupancies[Color::White.index()].set(Square::A2);

        let mv = create_move(
            white_pawn,
            "a2".to_string(),
            "a3".to_string(),
            MoveType::Move,
        );

        // Make and then undo move
        let _ = board.apply_move(mv);
        let result = board.undo_move(mv);

        assert!(result.is_ok(), "Undo should succeed");
        assert!(
            board.get_board(&white_pawn).is_set(Square::A2),
            "Piece should be back at source"
        );
        assert!(
            !board.get_board(&white_pawn).is_set(Square::A3),
            "Piece should be removed from destination"
        );
        assert_eq!(
            board.square_map[8],
            Some(white_pawn),
            "Source should have piece"
        );
        assert_eq!(board.square_map[16], None, "Destination should be empty");
    }
}
