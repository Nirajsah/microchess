use std::str::FromStr;

use serde::{Deserialize, Serialize};

use crate::{
    ChessError,
    board::{chessboard::ChessBoard, piece::Piece, square::Square},
};
 use crate::game::game::GameState;

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
        from: String,
        to: String,
        p: String,
        promoted_to: Option<String>,
        board: &ChessBoard,
    ) -> MoveData {
        let from = Square::from_str(&from).unwrap();
        let to = Square::from_str(&to).unwrap();
        let piece = Piece::from_str(&p).unwrap();

        // Determine move type
        let move_type = if let Some(promo) = promoted_to {
            let promo_piece = Piece::from_str(&promo).unwrap();
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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CompleteMove {
    pub from: Square,
    pub to: Square,
    pub piece: Piece,
    pub move_type: MoveType,
    pub previous_castling_rights: u8,
    pub previous_en_passant: Option<Square>,
    pub previous_halfmove_clock: u16,
    pub game_hash: u64,
    pub san: Option<String>,
    pub game_state: GameState,
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

    pub fn to_san(&self) -> String {
        match self.move_type {
            MoveType::Castle => {
                // Kingside or queenside
                if self.to.file() == 6 {
                    "O-O".to_string()
                } else {
                    "O-O-O".to_string()
                }
            }
            MoveType::Move
            | MoveType::Capture(_)
            | MoveType::Promotion(_)
            | MoveType::PromotionCapture(_, _) => {
                let mut notation = String::new();

                let piece_char = match self.piece {
                    Piece::WhitePawn | Piece::BlackPawn => None,
                    Piece::WhiteKnight | Piece::BlackKnight => Some('N'),
                    Piece::WhiteBishop | Piece::BlackBishop => Some('B'),
                    Piece::WhiteRook | Piece::BlackRook => Some('R'),
                    Piece::WhiteQueen | Piece::BlackQueen => Some('Q'),
                    Piece::WhiteKing | Piece::BlackKing => Some('K'),
                };

                // If not a pawn move, prepend the piece letter
                if let Some(c) = piece_char {
                    notation.push(c);
                }

                // Add capture indicator if needed
                if let MoveType::Capture(_)
                | MoveType::PromotionCapture(_, _)
                | MoveType::EnPassant = self.move_type
                {
                    // For pawns, we show file of origin (e.g., "exd5")
                    if self.piece.is_pawn() && piece_char.is_none() {
                        notation.push(self.from.to_string().chars().next().unwrap());
                    }
                    notation.push('x');
                }

                // Destination square
                notation.push_str(&self.to.to_string());

                // Add promotion notation
                if let MoveType::Promotion(promoted) | MoveType::PromotionCapture(promoted, _) =
                    self.move_type
                {
                    notation.push('=');
                    notation.push(promoted.to_char());
                }

                notation
            }
            MoveType::EnPassant => {
                format!("{}x{}", self.from.to_string(), self.to.to_string())
            }
        }
    }
}
