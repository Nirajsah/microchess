use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

use crate::{
    ChessError, Result,
    moves::{
        generator::{
            bishop_attacks_on_the_fly, computed_king_moves, computed_knight_attacks,
            computed_pawn_attacks, computed_pawn_moves, queen_attacks_on_the_fly,
            rook_attacks_on_the_fly,
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
    pub castling_rights: u8, // [White, Black](KingSide, QueenSide)
    /// En passant
    pub en_passant: Option<Square>,
}

impl Default for ChessBoard {
    fn default() -> Self {
        ChessBoard {
            bitboards: [BitBoard::default(); 12],
            occupancies: [BitBoard::default(), BitBoard::default()],
            square_map: vec![None; 64],
            castling_rights: 0b1111,
            en_passant: None,
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
            square_map: ChessBoard::initial_square_map(),
            castling_rights: 0b1111,
            en_passant: None,
        }
    }

    fn initial_square_map() -> Vec<Option<Piece>> {
        let mut square_map: Vec<Option<Piece>> = vec![None; 64];

        // Rank 1 (White's back rank) - indices 0-7
        square_map[0] = Some(Piece::WhiteRook); // a1
        square_map[1] = Some(Piece::WhiteKnight); // b1
        square_map[2] = Some(Piece::WhiteBishop); // c1
        square_map[3] = Some(Piece::WhiteQueen); // d1
        square_map[4] = Some(Piece::WhiteKing); // e1
        square_map[5] = Some(Piece::WhiteBishop); // f1
        square_map[6] = Some(Piece::WhiteKnight); // g1
        square_map[7] = Some(Piece::WhiteRook); // h1

        // Rank 2 (White pawns) - indices 8-15
        for i in 8..16 {
            square_map[i] = Some(Piece::WhitePawn);
        }

        // Ranks 3-6 (empty squares) - indices 16-47 are already None

        // Rank 7 (Black pawns) - indices 48-55
        for i in 48..56 {
            square_map[i] = Some(Piece::BlackPawn);
        }

        // Rank 8 (Black's back rank) - indices 56-63
        square_map[56] = Some(Piece::BlackRook); // a8
        square_map[57] = Some(Piece::BlackKnight); // b8
        square_map[58] = Some(Piece::BlackBishop); // c8
        square_map[59] = Some(Piece::BlackQueen); // d8
        square_map[60] = Some(Piece::BlackKing); // e8
        square_map[61] = Some(Piece::BlackBishop); // f8
        square_map[62] = Some(Piece::BlackKnight); // g8
        square_map[63] = Some(Piece::BlackRook); // h8

        square_map
    }

    pub fn exec_castle(&mut self, mv: MoveData) -> Result<()> {
        let rank = mv.from.rank() - 1;
        let file_dest = mv.to.file() - 1;

        let rook_from =
            Square::uint_to_square((rank * 8 + if file_dest == 6 { 7 } else { 0 }) as u8);
        let rook_to = Square::uint_to_square((rank * 8 + if file_dest == 6 { 5 } else { 3 }) as u8);

        let rook = if mv.piece.color() == Color::White {
            Piece::WhiteRook
        } else {
            Piece::BlackRook
        };

        if !self.get_board(&rook).is_set(rook_from) {
            return Err(ChessError::InvalidCastle);
        }

        let king_idx = mv.piece.index();
        let rook_idx = rook.index();
        let color_idx = mv.piece.color().index();

        let from_bit = 1u64 << (mv.from as usize);
        let to_bit = 1u64 << (mv.to as usize);
        let from_rook_bit = 1u64 << (rook_from as usize);
        let to_rook_bit = 1u64 << (rook_to as usize);

        // Update king bitboards and occupancy (clear old, set new)
        self.bitboards[king_idx] ^= from_bit | to_bit;
        self.occupancies[color_idx] ^= from_bit | to_bit;

        // Update rook bitboards and occupancy
        self.bitboards[rook_idx] ^= from_rook_bit | to_rook_bit;
        self.occupancies[color_idx] ^= from_rook_bit | to_rook_bit;

        // Update square map for king
        self.square_map[mv.from as usize] = None;
        self.square_map[mv.to as usize] = Some(mv.piece);

        // Update square map for rook
        self.square_map[rook_from as usize] = None;
        self.square_map[rook_to as usize] = Some(rook);

        // Revoke castling rights for this color
        self.revoke_castling_rights(mv.piece.color(), None);

        Ok(())
    }

    pub fn undo_castle(&mut self, mv: MoveData) -> Result<()> {
        let rank = mv.from.rank() - 1;
        let file_dest = mv.to.file() - 1;

        // Determine rook positions (same logic as exec_castle)
        let rook_from =
            Square::uint_to_square((rank * 8 + if file_dest == 6 { 7 } else { 0 }) as u8);

        let rook_to = Square::uint_to_square((rank * 8 + if file_dest == 6 { 5 } else { 3 }) as u8);

        let rook = if mv.piece.color() == Color::White {
            Piece::WhiteRook
        } else {
            Piece::BlackRook
        };

        let king_idx = mv.piece.index();

        let rook_idx = rook.index();
        let color_idx = mv.piece.color().index();

        let from_bit = 1u64 << mv.from.index();
        let to_bit = 1u64 << mv.to.index();
        let from_rook_bit = 1u64 << rook_from.index();
        let to_rook_bit = 1u64 << rook_to.index();

        self.bitboards[king_idx] ^= from_bit | to_bit;
        self.occupancies[color_idx] ^= from_bit | to_bit;

        self.bitboards[rook_idx] ^= from_rook_bit | to_rook_bit;
        self.occupancies[color_idx] ^= from_rook_bit | to_rook_bit;

        self.square_map[mv.from.index()] = Some(mv.piece);
        self.square_map[mv.to.index()] = None;

        self.square_map[rook_from.index()] = Some(rook);
        self.square_map[rook_to.index()] = None;

        Ok(())
    }

    // Returns true if piece is not present
    #[inline(always)]
    pub fn is_square_empty(&self, sq: Square) -> bool {
        !self.all_pieces().is_set(sq)
    }

    pub fn get_piece_at(&self, sq: Square) -> Option<Piece> {
        self.square_map[sq.index()]
    }

    pub fn get_king_square(&self, color: Color) -> Square {
        let king_bb = match color {
            Color::White => self.bitboards[Piece::WhiteKing.index()],
            Color::Black => self.bitboards[Piece::BlackKing.index()],
        };

        let idx = king_bb.trailing_zeros() as u8;
        Square::uint_to_square(idx)
    }

    /// Returns `True` if the given color's king is under attack
    pub fn king_in_check(&self, color: Color) -> bool {
        let sq = self.get_king_square(color);
        self.is_under_attack(sq, color.opposite())
    }

    // Returns an attack mask for a given color
    pub fn attack_mask(&self, color: Color) -> BitBoard {
        self.recompute_attack_mask(color)
    }

    /// Responsible for generating a new attack_mask for a color.
    pub fn recompute_attack_mask(&self, color: Color) -> BitBoard {
        let mut pieces_board = self.occupancies[color.index()];
        let all_pieces = &self.all_pieces();
        let mut attack_mask = BitBoard::EMPTY;

        while let Some(from_idx) = pieces_board.pop_lsb() {
            if let Some(piece) = self.square_map[from_idx as usize] {
                let mask = match piece {
                    Piece::WhitePawn => WHITE_PATTACKS[from_idx as usize],
                    Piece::BlackPawn => BLACK_PATTACKS[from_idx as usize],
                    Piece::WhiteKnight | Piece::BlackKnight => KNIGHT_MOVES[from_idx as usize],
                    Piece::WhiteBishop | Piece::BlackBishop => {
                        bishop_attacks_on_the_fly(from_idx as u8, *all_pieces)
                    }
                    Piece::WhiteRook | Piece::BlackRook => {
                        rook_attacks_on_the_fly(from_idx as u8, *all_pieces)
                    }
                    Piece::WhiteQueen | Piece::BlackQueen => {
                        queen_attacks_on_the_fly(from_idx as u8, *all_pieces)
                    }
                    Piece::WhiteKing | Piece::BlackKing => KING_MOVES[from_idx as usize],
                };
                attack_mask |= mask.into();
            }
        }

        attack_mask
    }

    pub fn compute_attack_mask_on_the_fly(
        &self,
        occupancy: &BitBoard,
        opponent_board: &BitBoard,
    ) -> BitBoard {
        let mut attack_mask = BitBoard::EMPTY;
        let mut pieces_to_check = *opponent_board;

        while let Some(from_idx) = pieces_to_check.pop_lsb() {
            if let Some(piece) = self.square_map[from_idx as usize] {
                let mask = match piece {
                    Piece::WhitePawn => WHITE_PATTACKS[from_idx as usize],
                    Piece::BlackPawn => BLACK_PATTACKS[from_idx as usize],
                    Piece::WhiteKnight | Piece::BlackKnight => KNIGHT_MOVES[from_idx as usize],
                    Piece::WhiteBishop | Piece::BlackBishop => {
                        bishop_attacks_on_the_fly(from_idx as u8, *occupancy)
                    }
                    Piece::WhiteRook | Piece::BlackRook => {
                        rook_attacks_on_the_fly(from_idx as u8, *occupancy)
                    }
                    Piece::WhiteQueen | Piece::BlackQueen => {
                        queen_attacks_on_the_fly(from_idx as u8, *occupancy)
                    }
                    Piece::WhiteKing | Piece::BlackKing => KING_MOVES[from_idx as usize],
                };
                attack_mask |= mask.into();
            }
        }

        attack_mask
    }

    /// A Method to check if the square is under attack
    /// ```True``` means the square is under attack
    pub fn is_under_attack(&self, sq: Square, by_color: Color) -> bool {
        self.attack_mask(by_color).is_set(sq)
    }

    pub fn clear(&mut self) {
        self.bitboards = [BitBoard::EMPTY; 12];

        // Reset other game state if you have them
        self.castling_rights = 0b1111;
        self.en_passant = None;
    }

    #[inline]
    pub fn get_pseudo_legal_moves(&self, from: Square, piece: Piece) -> bool {
        let color = piece.color();

        let move_mask = match piece {
            Piece::WhitePawn | Piece::BlackPawn => self.get_pawn_pseudo_legal(from, color),
            Piece::WhiteKnight | Piece::BlackKnight => self.get_knight_pseudo_legal(from, color),
            Piece::WhiteBishop | Piece::BlackBishop => self.get_bishop_pseudo_legal(from, color),
            Piece::WhiteRook | Piece::BlackRook => self.get_rook_pseudo_legal(from, color),
            Piece::WhiteQueen | Piece::BlackQueen => self.get_queen_pseudo_legal(from, color),
            Piece::WhiteKing | Piece::BlackKing => self.get_king_pseudo_legal(from, color),
        };

        let mut temp_mask = move_mask;
        let opponent = color.opposite();
        let own_king = self.get_king_square(color);

        while let Some(to_idx) = temp_mask.pop_lsb() {
            let to = Square::uint_to_square(to_idx as u8);

            // Create temporary board state
            let mut all_occ = self.all_pieces();
            let mut opponent_occ = self.occupancies[opponent.index()];
            let mut own_occ = self.occupancies[color.index()];

            // Handle en passant capture (special case)
            let is_en_passant =
                matches!(piece, Piece::WhitePawn | Piece::BlackPawn) && Some(to) == self.en_passant;

            if is_en_passant {
                // Remove the captured pawn (not at 'to', but at the en passant capture square)
                let capture_square = match color {
                    Color::White => Square::uint_to_square((to - 8) as u8), // Pawn is one rank below
                    Color::Black => Square::uint_to_square((to + 8) as u8), // Pawn is one rank above
                };

                // Remove captured pawn from occupancies and square map
                if let Some(captured_piece) = self.square_map[capture_square.index()] {
                    opponent_occ.clear(capture_square);
                    all_occ.clear(capture_square);
                }
            }

            // Make the move temporarily
            all_occ.clear(from);
            all_occ.set(to);
            own_occ.clear(from);
            own_occ.set(to);

            // If capturing (regular capture), remove opponent piece
            if self.square_map[to.index()].is_some() && !is_en_passant {
                opponent_occ.clear(to);
                all_occ.clear(to); // Piece will be replaced by moving piece
                all_occ.set(to); // Add moving piece
            }

            // Get king square (may have changed if piece is king)
            let king_sq = if matches!(piece, Piece::WhiteKing | Piece::BlackKing) {
                to // King moved to new position
            } else {
                own_king
            };

            // Check if king is under attack after this move
            // This handles:
            // - Pinned pieces (can only move along pin ray)
            // - King safety (king can't move into check)
            // - Discovered attacks (moving piece exposes king)
            if !self
                .compute_attack_mask_on_the_fly(&all_occ, &opponent_occ)
                .is_set(king_sq)
            {
                return true;
            }
        }
        return false;
    }

    #[inline]
    pub fn get_legal_moves(&self, from: Square, piece: Piece) -> BitBoard {
        let color = piece.color();

        let move_mask = match piece {
            Piece::WhitePawn | Piece::BlackPawn => self.get_pawn_pseudo_legal(from, color),
            Piece::WhiteKnight | Piece::BlackKnight => self.get_knight_pseudo_legal(from, color),
            Piece::WhiteBishop | Piece::BlackBishop => self.get_bishop_pseudo_legal(from, color),
            Piece::WhiteRook | Piece::BlackRook => self.get_rook_pseudo_legal(from, color),
            Piece::WhiteQueen | Piece::BlackQueen => self.get_queen_pseudo_legal(from, color),
            Piece::WhiteKing | Piece::BlackKing => self.get_king_pseudo_legal(from, color),
        };

        let mut temp_mask = move_mask;
        let mut valid_moves = BitBoard::EMPTY;
        let opponent = color.opposite();

        while let Some(to_idx) = temp_mask.pop_lsb() {
            let to = Square::uint_to_square(to_idx as u8);

            // Create temporary board state
            let mut all_occ = self.all_pieces();
            let mut opponent_occ = self.occupancies[opponent.index()];
            let mut own_occ = self.occupancies[color.index()];

            // Handle en passant capture (special case)
            let is_en_passant =
                matches!(piece, Piece::WhitePawn | Piece::BlackPawn) && Some(to) == self.en_passant;

            if is_en_passant {
                // Remove the captured pawn (not at 'to', but at the en passant capture square)
                let capture_square = match color {
                    Color::White => Square::uint_to_square((to - 8) as u8), // Pawn is one rank below
                    Color::Black => Square::uint_to_square((to + 8) as u8), // Pawn is one rank above
                };

                // Remove captured pawn from occupancies and square map
                if let Some(captured_piece) = self.square_map[capture_square.index()] {
                    opponent_occ.clear(capture_square);
                    all_occ.clear(capture_square);
                }
            }

            // Make the move temporarily
            all_occ.clear(from);
            all_occ.set(to);
            own_occ.clear(from);
            own_occ.set(to);

            // If capturing (regular capture), remove opponent piece
            if self.square_map[to.index()].is_some() && !is_en_passant {
                opponent_occ.clear(to);
                all_occ.clear(to); // Piece will be replaced by moving piece
                all_occ.set(to); // Add moving piece
            }

            // Get king square (may have changed if piece is king)
            let king_sq = if matches!(piece, Piece::WhiteKing | Piece::BlackKing) {
                to // King moved to new position
            } else {
                self.get_king_square(color) // King didn't move
            };

            // Check if king is under attack after this move
            // This handles:
            // - Pinned pieces (can only move along pin ray)
            // - King safety (king can't move into check)
            // - Discovered attacks (moving piece exposes king)
            if !self
                .compute_attack_mask_on_the_fly(&all_occ, &opponent_occ)
                .is_set(king_sq)
            {
                valid_moves.set(to);
            }
        }

        valid_moves
    }

    #[inline]
    pub fn get_pawn_legal_move(
        &self,
        from: Square,
        color: Color,
        all_pieces: BitBoard,
    ) -> BitBoard {
        let empty = !all_pieces.as_u64();
        let pawn_bb = 1u64 << from.index();

        match color {
            Color::White => {
                let single_push = (pawn_bb << 8) & empty;
                let rank4 = 0x00000000FF000000u64;
                let double_push = (single_push << 8) & empty & rank4;
                BitBoard(single_push | double_push)
            }
            Color::Black => {
                let single_push = (pawn_bb >> 8) & empty;
                let rank5 = 0x000000FF00000000u64;
                let double_push = (single_push >> 8) & empty & rank5;
                BitBoard(single_push | double_push)
            }
        }
    }

    #[inline]
    pub fn get_pawn_legal_capture(
        &self,
        from: Square,
        color: Color,
        opponent_occupancy: &BitBoard,
    ) -> BitBoard {
        let attacks = match color {
            Color::White => WHITE_PATTACKS[from.index()],
            Color::Black => BLACK_PATTACKS[from.index()],
        };

        let mut valid_captures = attacks & *opponent_occupancy;

        if let Some(ep_square) = self.en_passant {
            if attacks.is_set(ep_square) {
                let is_valid_ep = match color {
                    Color::White => from.rank() == 5,
                    Color::Black => from.rank() == 4,
                };

                if is_valid_ep {
                    valid_captures.set(ep_square);
                }
            }
        }

        valid_captures
    }

    #[inline]
    fn get_pawn_pseudo_legal(&self, from: Square, color: Color) -> BitBoard {
        let occ_opponent = self.occupancies[color.opposite().index()];
        let all_pieces = self.all_pieces();
        let valid_attacks = self.get_pawn_legal_capture(from, color, &occ_opponent);
        let valid_forward = self.get_pawn_legal_move(from, color, all_pieces);

        valid_forward | valid_attacks
    }

    #[inline]
    fn get_knight_pseudo_legal(&self, from: Square, color: Color) -> BitBoard {
        let occ_own = self.occupancies[color.index()];
        KNIGHT_MOVES[from.index()] & !occ_own.as_u64()
    }

    #[inline]
    pub fn get_bishop_pseudo_legal(&self, from: Square, color: Color) -> BitBoard {
        let occ_own = self.occupancies[color.index()];
        bishop_attacks_on_the_fly(from.into(), self.all_pieces()) & !occ_own.as_u64()
    }

    #[inline]
    fn get_rook_pseudo_legal(&self, from: Square, color: Color) -> BitBoard {
        let occ_own = self.occupancies[color.index()];
        rook_attacks_on_the_fly(from.into(), self.all_pieces()) & !occ_own.as_u64()
    }

    #[inline]
    fn get_queen_pseudo_legal(&self, from: Square, color: Color) -> BitBoard {
        self.get_bishop_pseudo_legal(from, color) | self.get_rook_pseudo_legal(from, color)
    }

    #[inline]
    pub fn get_king_pseudo_legal(&self, from: Square, color: Color) -> BitBoard {
        let occ_own = self.occupancies[color.index()];
        let all_occ = self.all_pieces();

        let mut move_mask = KING_MOVES[from.index()] & !occ_own.as_u64();

        if color == Color::White && from == Square::E1 {
            // White queenside castling (e8 -> c8)
            if (self.castling_rights & 0b0100) != 0 {
                if !all_occ.is_set(Square::B1)
                    && !all_occ.is_set(Square::C1)
                    && !all_occ.is_set(Square::D1)
                {
                    // ← ADD THESE CHECKS
                    if !self.is_under_attack(Square::E1, Color::Black)
                        && !self.is_under_attack(Square::D1, Color::Black)
                        && !self.is_under_attack(Square::C1, Color::Black)
                    {
                        move_mask.set(Square::C1);
                    }
                }
            }

            // White kingside castling (e8 -> g8)
            if (self.castling_rights & 0b1000) != 0 {
                if !all_occ.is_set(Square::F1) && !all_occ.is_set(Square::G1) {
                    // ← ADD THESE CHECKS
                    if !self.is_under_attack(Square::E1, Color::Black)
                        && !self.is_under_attack(Square::F1, Color::Black)
                        && !self.is_under_attack(Square::G1, Color::Black)
                    {
                        move_mask.set(Square::G1);
                    }
                }
            }
        }

        if color == Color::Black && from == Square::E8 {
            // Black queenside castling (e8 -> c8)
            if (self.castling_rights & 0b0001) != 0 {
                if !all_occ.is_set(Square::B8)
                    && !all_occ.is_set(Square::C8)
                    && !all_occ.is_set(Square::D8)
                {
                    // ← ADD THESE CHECKS
                    if !self.is_under_attack(Square::E8, Color::White)
                        && !self.is_under_attack(Square::D8, Color::White)
                        && !self.is_under_attack(Square::C8, Color::White)
                    {
                        move_mask.set(Square::C8);
                    }
                }
            }

            // Black kingside castling (e8 -> g8)
            if (self.castling_rights & 0b0010) != 0 {
                if !all_occ.is_set(Square::F8) && !all_occ.is_set(Square::G8) {
                    // ← ADD THESE CHECKS
                    if !self.is_under_attack(Square::E8, Color::White)
                        && !self.is_under_attack(Square::F8, Color::White)
                        && !self.is_under_attack(Square::G8, Color::White)
                    {
                        move_mask.set(Square::G8);
                    }
                }
            }
        }
        let opponent_attacks = self.attack_mask(color.opposite());

        move_mask & !opponent_attacks
    }

    /// Returns a bitboard containing all pieces on the board
    #[inline]
    pub fn all_pieces(&self) -> BitBoard {
        self.occupancies[0] | self.occupancies[1]
    }

    /// Returns the bitboard of all white pieces on the board
    #[inline]
    pub fn white_pieces(&self) -> BitBoard {
        self.occupancies[0]
    }

    /// Returns the bitboard of all black pieces on the board
    #[inline]
    pub fn black_pieces(&self) -> BitBoard {
        self.occupancies[1]
    }

    /// Revoke castling rights permanently.
    ///
    /// - If `rook_position` is `Some(square)`, revoke only that rook's side.
    /// - If `rook_position` is `None`, revoke both sides (king moved).
    ///
    #[inline]
    fn revoke_castling_rights(&mut self, color: Color, rook_position: Option<Square>) {
        match (color, rook_position) {
            // White rooks
            (Color::White, Some(Square::H1)) => self.castling_rights &= !0b1000, // White kingside (K)
            (Color::White, Some(Square::A1)) => self.castling_rights &= !0b0100, // White queenside (Q)

            // Black rooks
            (Color::Black, Some(Square::H8)) => self.castling_rights &= !0b0010, // Black kingside (k)
            (Color::Black, Some(Square::A8)) => self.castling_rights &= !0b0001, // Black queenside (q)

            // King moved → revoke both rights
            (Color::White, None) => self.castling_rights &= !0b1100, // Clear both K and Q
            (Color::Black, None) => self.castling_rights &= !0b0011, // Clear both k and q

            _ => {}
        }
    }

    /// A function to get the mutable bitboard for a piece
    ///
    #[inline]
    pub fn get_mut_board(&mut self, piece: &Piece) -> &mut BitBoard {
        &mut self.bitboards[piece.index()]
    }

    /// A function to get the bitboard of a piece as immutable reference
    ///
    #[inline]
    pub fn get_board(&self, piece: &Piece) -> &BitBoard {
        &self.bitboards[piece.index()]
    }

    /// Moves a piece on the board, while checking if the king is in check
    #[inline]
    fn apply_move(&mut self, mv: MoveData) -> Result<()> {
        let piece_idx = mv.piece.index();
        let color_idx = mv.piece.color().index();

        let from_bit = 1u64 << mv.from.index();
        let to_bit = 1u64 << mv.to.index();

        self.bitboards[piece_idx] ^= from_bit | to_bit;

        // Update occupancy for this color
        self.occupancies[color_idx] ^= from_bit | to_bit;

        // Update square_map
        self.square_map[mv.from.index()] = None;
        self.square_map[mv.to.index()] = Some(mv.piece);

        Ok(())
    }

    #[inline]
    pub fn undo_move(&mut self, mv: MoveData) -> Result<()> {
        let piece_idx = mv.piece.index();
        let color_idx = mv.piece.color().index();

        let from_bit = 1u64 << mv.from.index();
        let to_bit = 1u64 << mv.to.index();

        // Undo bitboards
        self.bitboards[piece_idx] ^= from_bit | to_bit;

        // Undo occupancies
        self.occupancies[color_idx] ^= from_bit | to_bit;

        // Undo square map
        self.square_map[mv.from.index()] = Some(mv.piece);
        self.square_map[mv.to.index()] = None;

        Ok(())
    }

    #[inline]
    pub fn get_opponent_pieces(&self, piece: Piece) -> BitBoard {
        match piece.color() {
            Color::White => self.black_pieces(),
            Color::Black => self.white_pieces(),
        }
    }

    /// Handle captures
    #[inline]
    fn piece_capture(&mut self, capture_piece: Piece, mv: MoveData) -> Result<()> {
        let capture_idx = capture_piece.index();
        self.bitboards[capture_idx].clear(mv.to);
        let captured_color_idx = capture_piece.color().index();
        self.occupancies[captured_color_idx].clear(mv.to);

        if capture_piece.is_rook() {
            self.revoke_castling_rights(capture_piece.color(), Some(mv.to));
        }

        Ok(())
    }

    #[inline]
    pub fn undo_piece_capture(&mut self, capture_piece: Piece, mv: MoveData) -> Result<()> {
        self.undo_move(mv)?;

        let capture_idx = capture_piece.index();
        self.bitboards[capture_idx].set(mv.to);
        let captured_color_idx = capture_piece.color().index();
        self.occupancies[captured_color_idx].set(mv.to);
        self.square_map[mv.to.index()] = Some(capture_piece);

        Ok(())
    }

    #[inline]
    pub fn is_castling_move(&self, from: Square, to: Square) -> bool {
        // King moves two squares
        (from.index() as i8 - to.index() as i8).abs() == 2
    }

    #[inline]
    pub fn en_passant_capture_square(&self, to: Square, color: Color) -> Option<Square> {
        let offset: i8 = match color {
            Color::White => -8, // white moves upward → check behind
            Color::Black => 8,  // black moves downward → check behind
        };

        let idx = to.index() as i8 + offset;
        if idx >= 0 && idx < 64 {
            Some(Square::uint_to_square(idx as u8))
        } else {
            None
        }
    }

    #[inline]
    pub fn is_en_passant_capture(&self, from: Square, to: Square, color: Color) -> bool {
        // Must be a pawn moving diagonally to the en passant square
        if self.en_passant != Some(to) {
            return false;
        }

        // Check if move is diagonal (1 file away, 1 rank forward)
        let file_diff = (from.file() as i8 - to.file() as i8).abs();
        let rank_diff = match color {
            Color::White => to.rank() as i8 - from.rank() as i8,
            Color::Black => from.rank() as i8 - to.rank() as i8,
        };

        file_diff == 1 && rank_diff == 1
    }

    #[inline]
    pub fn exec_en_passant_capture(&mut self, mv: MoveData) -> Result<()> {
        // Move the capturing pawn
        self.apply_move(mv)?;

        // Calculate the captured pawn's square
        let captured_square = self
            .en_passant_capture_square(mv.to, mv.piece.color())
            .ok_or(ChessError::InvalidMove)?;

        let captured_pawn = if mv.piece.color() == Color::White {
            Piece::BlackPawn
        } else {
            Piece::WhitePawn
        };

        // Remove the captured pawn (DON'T use piece_capture!)
        self.bitboards[captured_pawn.index()].clear(captured_square);
        self.occupancies[captured_pawn.color().index()].clear(captured_square);
        self.square_map[captured_square.index()] = None;

        Ok(())
    }

    #[inline]
    pub fn undo_en_passant_capture(&mut self, mv: MoveData) -> Result<()> {
        let piece_idx = mv.piece.index();
        let color_idx = mv.piece.color().index();
        let opponent_color_idx = mv.piece.color().opposite().index();

        let from_bit = 1u64 << mv.from.index();
        let to_bit = 1u64 << mv.to.index();

        // Move pawn back from 'to' to 'from'
        self.bitboards[piece_idx] ^= from_bit | to_bit;
        self.occupancies[color_idx] ^= from_bit | to_bit;
        self.square_map[mv.from.index()] = Some(mv.piece);
        self.square_map[mv.to.index()] = None;

        let captured_pawn_square = if mv.piece.color() == Color::White {
            // White captured black pawn one rank below
            Square::uint_to_square((mv.to.index() - 8) as u8)
        } else {
            // Black captured white pawn one rank above
            Square::uint_to_square((mv.to.index() + 8) as u8)
        };

        let captured_pawn = if mv.piece.color() == Color::White {
            Piece::BlackPawn
        } else {
            Piece::WhitePawn
        };

        self.bitboards[captured_pawn.index()].set(captured_pawn_square);
        self.occupancies[opponent_color_idx].set(captured_pawn_square);
        self.square_map[captured_pawn_square.index()] = Some(captured_pawn);

        Ok(())
    }

    #[inline]
    pub fn undo_pawn_promotion(&mut self, promoted_to: Piece, mv: MoveData) -> Result<()> {
        let pawn_idx = mv.piece.index(); // Original pawn
        let promoted_idx = promoted_to.index(); // Queen/Rook/etc
        let color_idx = mv.piece.color().index();

        self.bitboards[promoted_idx].clear(mv.to);
        self.occupancies[color_idx].clear(mv.to);
        self.square_map[mv.to.index()] = None;

        self.bitboards[pawn_idx].set(mv.from);
        self.occupancies[color_idx].set(mv.from);
        self.square_map[mv.from.index()] = Some(mv.piece);

        Ok(())
    }

    #[inline]
    pub fn exec_pawn_promotion(&mut self, promoted_piece: Piece, mv: MoveData) -> Result<()> {
        // Remove the pawn from source square
        self.bitboards[mv.piece.index()].clear(mv.from);
        self.occupancies[mv.piece.color().index()].clear(mv.from);

        // Add promoted piece to target square
        self.bitboards[promoted_piece.index()].set(mv.to);
        self.occupancies[promoted_piece.color().index()].set(mv.to);

        // Update square map
        self.square_map[mv.from.index()] = None;
        self.square_map[mv.to.index()] = Some(promoted_piece);

        Ok(())
    }

    #[inline]
    pub fn wp_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;
        let piece = mv.piece;

        let occ_opponent = self.occupancies[piece.color().opposite().index()];
        let all_pieces = self.all_pieces();

        match mv.move_type {
            MoveType::Move => {
                let legal_move = self.get_pawn_legal_move(from, piece.color(), all_pieces);
                if !legal_move.is_set(to) {
                    return Err(ChessError::InvalidMove);
                }

                if to == from + 16 {
                    // Set en passant square only for two-square moves
                    self.en_passant = Some(from + 8);
                }

                self.apply_move(mv)
            }
            MoveType::Capture(capture_piece) => {
                let legal_capture = self.get_pawn_legal_capture(from, piece.color(), &occ_opponent);

                if !legal_capture.is_set(to) || !self.get_opponent_pieces(piece).is_set(to) {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)
                    .and_then(|_| self.apply_move(mv))
            }
            _ => Err(ChessError::InvalidMove),
        }
    }

    #[inline]
    pub fn bp_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;
        let piece = mv.piece;

        let occ_opponent = self.occupancies[piece.color().opposite().index()];
        let all_pieces = self.all_pieces();

        match mv.move_type {
            MoveType::Move => {
                let legal_move = self.get_pawn_legal_move(from, piece.color(), all_pieces);
                if !legal_move.is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
                // For two-square moves, check if the intermediate square is also clear
                if to == from - 16 {
                    // Set en passant square only for two-square moves
                    self.en_passant = Some(from - 8);
                }
                self.apply_move(mv)
            }
            MoveType::Capture(capture_piece) => {
                let legal_capture = self.get_pawn_legal_capture(from, piece.color(), &occ_opponent);
                if !legal_capture.is_set(to) || !self.get_opponent_pieces(piece).is_set(to) {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)
                    .and_then(|_| self.apply_move(mv))
            }
            _ => Err(ChessError::InvalidMove),
        }
    }

    #[inline]
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

    #[inline]
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

    #[inline]
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

    #[inline]
    pub fn knight_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;

        match mv.move_type {
            MoveType::Move => {
                if !KNIGHT_MOVES[from.index()].is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
            }
            MoveType::Capture(capture_piece) => {
                if !KNIGHT_MOVES[from.index()].is_set(to) {
                    return Err(ChessError::InvalidCapture);
                }
                self.piece_capture(capture_piece, mv)?;
            }
            _ => return Err(ChessError::InvalidMove),
        }
        self.apply_move(mv)
    }

    #[inline]
    pub fn king_move_or_capture(&mut self, mv: MoveData) -> Result<()> {
        let from = mv.from;
        let to = mv.to;

        match mv.move_type {
            MoveType::Move => {
                if !KING_MOVES[from.index()].is_set(to) {
                    return Err(ChessError::InvalidMove);
                }
            }
            MoveType::Capture(capture_piece) => {
                if !KING_MOVES[from.index()].is_set(to) {
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
    fn test_revoke_castling_rights_white_kingside() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111; // All rights initially

        board.revoke_castling_rights(Color::White, Some(Square::H1));
        assert_eq!(
            board.castling_rights & 0b1000,
            0,
            "White kingside should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b0111,
            0b0111,
            "Other rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_white_queenside() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::White, Some(Square::A1));
        assert_eq!(
            board.castling_rights & 0b0100,
            0,
            "White queenside should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b1011,
            0b1011,
            "Other rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_black_kingside() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::Black, Some(Square::H8));
        assert_eq!(
            board.castling_rights & 0b0010,
            0,
            "Black kingside should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b1101,
            0b1101,
            "Other rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_black_queenside() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::Black, Some(Square::A8));
        assert_eq!(
            board.castling_rights & 0b0001,
            0,
            "Black queenside should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b1110,
            0b1110,
            "Other rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_white_king_moved() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::White, None);
        assert_eq!(
            board.castling_rights & 0b1100,
            0,
            "Both white sides should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b0011,
            0b0011,
            "Black rights should remain"
        );
    }

    #[test]
    fn test_revoke_castling_rights_black_king_moved() {
        let mut board = create_test_board();
        board.castling_rights = 0b1111;

        board.revoke_castling_rights(Color::Black, None);
        assert_eq!(
            board.castling_rights & 0b0011,
            0,
            "Both black sides should be revoked"
        );
        assert_eq!(
            board.castling_rights & 0b1100,
            0b1100,
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
    fn test_get_board_by_index() {
        let board = ChessBoard::new();

        let pieces = [
            Piece::WhitePawn,
            Piece::WhiteKnight,
            Piece::WhiteBishop,
            Piece::WhiteRook,
            Piece::WhiteQueen,
            Piece::WhiteKing,
            Piece::BlackPawn,
            Piece::BlackKnight,
            Piece::BlackBishop,
            Piece::BlackRook,
            Piece::BlackQueen,
            Piece::BlackKing,
        ];

        for &piece in &pieces {
            let piece_board = *board.get_board(&piece);
            let actual_piece_board = board.bitboards[piece.index()];

            assert_eq!(
                piece_board, actual_piece_board,
                "{:?} board mismatch, must be the same",
                piece
            );
        }
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
        assert_eq!(
            board.en_passant,
            Some(Square::A3),
            "En passant square should be set"
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
        assert_eq!(
            board.en_passant,
            Some(Square::A6),
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
            board.castling_rights & 0b0100,
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
            board.castling_rights & 0b1100,
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

    #[test]
    fn test_get_piece_at() {
        let mut board = create_test_board();

        let pieces = [
            Piece::WhitePawn,
            Piece::WhiteKnight,
            Piece::WhiteBishop,
            Piece::WhiteRook,
            Piece::WhiteQueen,
            Piece::WhiteKing,
            Piece::BlackPawn,
            Piece::BlackKnight,
            Piece::BlackBishop,
            Piece::BlackRook,
            Piece::BlackQueen,
            Piece::BlackKing,
        ];

        let squares = [
            Square::A2,
            Square::B2,
            Square::C2,
            Square::D2,
            Square::E2,
            Square::F2,
            Square::A7,
            Square::B7,
            Square::C7,
            Square::D7,
            Square::E7,
            Square::F7,
        ];

        // Place each piece on its test square and validate lookup
        for (&piece, &square) in pieces.iter().zip(squares.iter()) {
            board.get_mut_board(&piece).set(square);
            board.square_map[square.index()] = Some(piece);
            let found_piece = board.get_piece_at(square).unwrap_or_else(|| {
                panic!("Piece {:?} not found at square {:?}", piece, square);
            });

            assert_eq!(
                found_piece, piece,
                "Expected {:?} at {:?}, but found {:?}",
                piece, square, found_piece
            );
        }
    }

    // Helper to validate board consistency
    fn validate_board_consistency(board: &ChessBoard) {
        // Check that piece bitboards don't overlap
        for i in 0..12 {
            for j in (i + 1)..12 {
                let overlap = board.bitboards[i].0 & board.bitboards[j].0;
                assert_eq!(
                    overlap,
                    0,
                    "Pieces {:?} and {:?} overlap at bits {:064b}",
                    Piece::from_index(i),
                    Piece::from_index(j),
                    overlap
                );
            }
        }

        // Check white occupancy matches white pieces
        let mut white_calc = BitBoard::EMPTY;
        for piece in [
            Piece::WhitePawn,
            Piece::WhiteKnight,
            Piece::WhiteBishop,
            Piece::WhiteRook,
            Piece::WhiteQueen,
            Piece::WhiteKing,
        ] {
            white_calc = white_calc | *board.get_board(&piece);
        }
        assert_eq!(
            board.occupancies[0].0, white_calc.0,
            "White occupancy mismatch. Expected: {:064b}, Got: {:064b}",
            white_calc.0, board.occupancies[0].0
        );

        // Check black occupancy matches black pieces
        let mut black_calc = BitBoard::EMPTY;
        for piece in [
            Piece::BlackPawn,
            Piece::BlackKnight,
            Piece::BlackBishop,
            Piece::BlackRook,
            Piece::BlackQueen,
            Piece::BlackKing,
        ] {
            black_calc = black_calc | *board.get_board(&piece);
        }
        assert_eq!(
            board.occupancies[1].0, black_calc.0,
            "Black occupancy mismatch. Expected: {:064b}, Got: {:064b}",
            black_calc.0, board.occupancies[1].0
        );

        // Check square_map consistency
        for sq_idx in 0..64 {
            let sq = Square::uint_to_square(sq_idx);
            let piece_in_map = board.square_map[sq.index()];

            if let Some(piece) = piece_in_map {
                // If square_map says there's a piece, the bitboard must have it
                assert!(
                    board.get_board(&piece).is_set(sq),
                    "square_map has {:?} at {}, but bitboard doesn't",
                    piece,
                    sq_idx
                );
            } else {
                // If square_map says empty, no bitboard should have a piece there
                for piece_idx in 0..12 {
                    assert!(
                        !board.bitboards[piece_idx].is_set(sq),
                        "square_map says {} is empty, but {:?} bitboard has a piece there",
                        sq_idx,
                        Piece::from_index(piece_idx)
                    );
                }
            }
        }

        // Check kings exist
        assert!(
            !board.get_board(&Piece::WhiteKing).is_empty(),
            "White king missing!"
        );
        assert!(
            !board.get_board(&Piece::BlackKing).is_empty(),
            "Black king missing!"
        );

        // Check only one king per side
        assert_eq!(
            board.get_board(&Piece::WhiteKing).0.count_ones(),
            1,
            "White should have exactly one king"
        );
        assert_eq!(
            board.get_board(&Piece::BlackKing).0.count_ones(),
            1,
            "Black should have exactly one king"
        );
    }

    #[test]
    fn test_initial_board_consistency() {
        let board = ChessBoard::new();
        validate_board_consistency(&board);
    }

    #[test]
    fn test_move_undo_roundtrip_knight() {
        let mut board = ChessBoard::new();
        let original_board = board.clone();

        // Move knight b1 -> a3
        let mv = MoveData {
            piece: Piece::WhiteKnight,
            from: Square::B1,
            to: Square::A3,
            move_type: MoveType::Move,
        };

        board.knight_move_or_capture(mv).unwrap();
        validate_board_consistency(&board);

        board.undo_move(mv).unwrap();
        validate_board_consistency(&board);

        // Verify board is identical to original
        assert_eq!(
            board.bitboards, original_board.bitboards,
            "Bitboards don't match after undo"
        );
        assert_eq!(
            board.occupancies, original_board.occupancies,
            "Occupancies don't match after undo"
        );
        assert_eq!(
            board.square_map, original_board.square_map,
            "square_map doesn't match after undo"
        );
    }

    #[test]
    fn test_move_undo_roundtrip_pawn() {
        let mut board = ChessBoard::new();
        let original_board = board.clone();

        // Move pawn e2 -> e4
        let mv = MoveData {
            piece: Piece::WhitePawn,
            from: Square::E2,
            to: Square::E4,
            move_type: MoveType::Move,
        };

        board.wp_move_or_capture(mv).unwrap();
        validate_board_consistency(&board);

        board.undo_move(mv).unwrap();
        validate_board_consistency(&board);

        assert_eq!(board.bitboards, original_board.bitboards);
        assert_eq!(board.occupancies, original_board.occupancies);
    }

    #[test]
    fn test_multiple_moves_sequence() {
        let mut board = ChessBoard::new();

        // Sequence: e2-e4, e7-e5, Nf3, Nc6
        let moves = vec![
            MoveData {
                piece: Piece::WhitePawn,
                from: Square::E2,
                to: Square::E4,
                move_type: MoveType::Move,
            },
            MoveData {
                piece: Piece::BlackPawn,
                from: Square::E7,
                to: Square::E5,
                move_type: MoveType::Move,
            },
            MoveData {
                piece: Piece::WhiteKnight,
                from: Square::G1,
                to: Square::F3,
                move_type: MoveType::Move,
            },
            MoveData {
                piece: Piece::BlackKnight,
                from: Square::B8,
                to: Square::C6,
                move_type: MoveType::Move,
            },
        ];

        let original_board = board.clone();

        // Make all moves
        board.wp_move_or_capture(moves[0]).unwrap();
        validate_board_consistency(&board);

        board.bp_move_or_capture(moves[1]).unwrap();
        validate_board_consistency(&board);

        board.knight_move_or_capture(moves[2]).unwrap();
        validate_board_consistency(&board);

        board.knight_move_or_capture(moves[3]).unwrap();
        validate_board_consistency(&board);

        // Undo all moves in reverse
        for mv in moves.iter().rev() {
            board.undo_move(*mv).unwrap();
            validate_board_consistency(&board);
        }

        // Verify we're back to start
        assert_eq!(board.bitboards, original_board.bitboards);
        assert_eq!(board.occupancies, original_board.occupancies);
    }

    #[test]
    fn test_capture_undo_roundtrip() {
        let mut board = ChessBoard::new();

        // Setup: move white pawn to e4, black pawn to d5, then capture
        let setup_moves = vec![
            MoveData {
                piece: Piece::WhitePawn,
                from: Square::E2,
                to: Square::E4,
                move_type: MoveType::Move,
            },
            MoveData {
                piece: Piece::BlackPawn,
                from: Square::D7,
                to: Square::D5,
                move_type: MoveType::Move,
            },
        ];

        board.wp_move_or_capture(setup_moves[0]).unwrap();
        board.bp_move_or_capture(setup_moves[1]).unwrap();
        let board_before_capture = board.clone();

        // Capture
        let capture_mv = MoveData {
            piece: Piece::WhitePawn,
            from: Square::E4,
            to: Square::D5,
            move_type: MoveType::Capture(Piece::BlackPawn),
        };

        board.wp_move_or_capture(capture_mv).unwrap();
        validate_board_consistency(&board);

        // Undo capture
        board
            .undo_piece_capture(Piece::BlackPawn, capture_mv)
            .unwrap();
        validate_board_consistency(&board);

        // Verify board matches before capture
        assert_eq!(board.bitboards, board_before_capture.bitboards);
        assert_eq!(board.occupancies, board_before_capture.occupancies);
        assert_eq!(board.square_map, board_before_capture.square_map);
    }

    #[test]
    fn test_all_starting_knight_moves() {
        // Test all 4 possible knight moves from starting position
        let knight_moves = vec![
            (Piece::WhiteKnight, Square::B1, Square::A3),
            (Piece::WhiteKnight, Square::B1, Square::C3),
            (Piece::WhiteKnight, Square::G1, Square::F3),
            (Piece::WhiteKnight, Square::G1, Square::H3),
        ];

        for (piece, from, to) in knight_moves {
            let mut board = ChessBoard::new();
            let original = board.clone();

            let mv = MoveData {
                piece,
                from,
                to,
                move_type: MoveType::Move,
            };

            board.knight_move_or_capture(mv).unwrap();
            validate_board_consistency(&board);

            board.undo_move(mv).unwrap();
            validate_board_consistency(&board);

            assert_eq!(
                board.bitboards, original.bitboards,
                "Failed roundtrip for knight {} -> {}",
                from, to
            );
        }
    }

    #[test]
    fn test_all_starting_pawn_moves() {
        // Test all possible pawn moves from starting position
        let files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        for file in files {
            // Single push
            let from_sq = Square::from_str(&format!("{}2", file)).unwrap();
            let to_sq_single = Square::from_str(&format!("{}3", file)).unwrap();
            let to_sq_double = Square::from_str(&format!("{}4", file)).unwrap();

            // Test single push
            let mut board = ChessBoard::new();
            let original = board.clone();
            let mv_single = MoveData {
                piece: Piece::WhitePawn,
                from: from_sq,
                to: to_sq_single,
                move_type: MoveType::Move,
            };

            board.wp_move_or_capture(mv_single).unwrap();
            validate_board_consistency(&board);
            board.undo_move(mv_single).unwrap();
            validate_board_consistency(&board);
            assert_eq!(
                board.bitboards, original.bitboards,
                "Failed single push roundtrip for pawn {}",
                file
            );

            // Test double push
            let mut board = ChessBoard::new();
            let mv_double = MoveData {
                piece: Piece::WhitePawn,
                from: from_sq,
                to: to_sq_double,
                move_type: MoveType::Move,
            };

            board.wp_move_or_capture(mv_double).unwrap();
            validate_board_consistency(&board);
            board.undo_move(mv_double).unwrap();
            validate_board_consistency(&board);
            assert_eq!(
                board.bitboards, original.bitboards,
                "Failed double push roundtrip for pawn {}",
                file
            );
        }
    }
}
