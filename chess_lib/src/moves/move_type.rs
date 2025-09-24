use serde::{Deserialize, Serialize};

use crate::board::{piece::Piece, square::Square};

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum CastleType {
    KingSide,
    QueenSide,
}

#[derive(Clone, Copy, Default, Debug, Serialize, Deserialize)]
pub enum MoveType {
    #[default]
    Move,
    Capture(Piece),
    Castle(CastleType),
    EnPassant,
    Promotion(Piece),
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct MoveData {
    pub from: Square,
    pub to: Square,
    pub piece: Piece,
    pub move_type: MoveType, // Changed to `move_type` to avoid confusion with the `m` field
}
