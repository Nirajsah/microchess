use serde::{Deserialize, Serialize};

use crate::board::{piece::Piece, square::Square};

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
