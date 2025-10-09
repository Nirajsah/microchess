use std::str::FromStr;

use serde::{Deserialize, Serialize};

use crate::board::{bitboard::BitBoard, chessboard::ChessBoard, piece::Piece, square::Square};

#[derive(Clone, Copy, Default, Debug, Serialize, Deserialize, PartialEq)]
pub enum MoveType {
    #[default]
    Move,
    Capture(Piece),
    Castle,
    EnPassant,
    Promotion(Piece),
    PromotionCapture(Piece, Piece),
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct MoveData {
    pub from: Square,
    pub to: Square,
    pub piece: Piece,
    pub move_type: MoveType,
}

impl MoveData {
    /// Create a new MoveData by analyzing the board state
    /// Requires a reference to the board to determine move type
    pub fn new(
        from: &str,
        to: &str,
        p: &str,
        promoted_to: Option<Piece>,
        board: &ChessBoard,
    ) -> Self {
        let from = Square::from_str(from).unwrap();
        let to = Square::from_str(to).unwrap();
        let piece = Piece::from_str(p).unwrap();

        // Determine move type
        let move_type = if let Some(promo_piece) = promoted_to {
            // Promotion move
            if let Some(captured) = board.get_piece_at(to) {
                MoveType::PromotionCapture(promo_piece, captured)
            } else {
                MoveType::Promotion(promo_piece)
            }
        } else if piece.is_king() && board.is_castling_move(from, to) {
            // Castling
            MoveType::Castle
        } else if piece.is_pawn()
            && board.en_passant == Some(to)
            && board.is_en_passant_capture(from, to, piece.color())
        {
            // En passant
            MoveType::EnPassant
        } else if let Some(captured) = board.get_piece_at(to) {
            // Regular capture
            MoveType::Capture(captured)
        } else {
            // Regular move
            MoveType::Move
        };

        MoveData {
            from,
            to,
            piece,
            move_type,
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct CompleteMove {
    pub from: Square,
    pub to: Square,
    pub piece: Piece,
    pub move_type: MoveType,
    pub previous_castling_rights: u8,
    pub previous_en_passant: Option<Square>,
    pub previous_halfmove_clock: u16,
    pub game_hash: u64,
}

impl CompleteMove {
    pub fn to_move_data(&self) -> MoveData {
        MoveData {
            from: self.from,
            to: self.to,
            piece: self.piece,
            move_type: self.move_type,
        }
    }
}
