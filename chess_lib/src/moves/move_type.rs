use serde::{Deserialize, Serialize};

use crate::board::{bitboard::BitBoard, piece::Piece, square::Square};

#[derive(Clone, Copy, Default, Debug, Serialize, Deserialize)]
pub enum MoveType {
    #[default]
    Move,
    Capture(Piece),
    Castle,
    EnPassant,
    Promotion(Piece),
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct MoveData {
    pub from: Square,
    pub to: Square,
    pub piece: Piece,
    pub move_type: MoveType,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CompleteMove {
    pub from: Square,
    pub to: Square,
    pub piece: Piece,
    pub move_type: MoveType,
    pub previous_castling_rights: u8,
    pub previous_en_passant: BitBoard,
    pub previous_halfmove_clock: u8,
}
