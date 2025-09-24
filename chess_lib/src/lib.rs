use serde::{Deserialize, Serialize};
use thiserror::Error;

pub mod board;
pub mod game;
pub mod moves;
pub mod pieces;
pub mod utils;

#[derive(Debug, PartialEq, Serialize, Deserialize, Eq, Clone, Error)]
pub enum ChessError {
    #[error("Piece not found")]
    PieceNotFound,
    #[error("Invalid piece")]
    InvalidPiece,
    #[error("Invalid move")]
    InvalidMove,
    #[error("Invalid capture")]
    InvalidCapture,
    #[error("Invalid promotion")]
    InvalidPromotion,
    #[error("Invalid castle")]
    InvalidCastle,
    #[error("Invalid en passant")]
    InvalidEnPassant,
    #[error("Invalid request")]
    InvalidRequest,
    #[error("Castle rights not available")]
    CastleRights,
    #[error("King in check")]
    KingInCheck,
    #[error("Checkmate")]
    Checkmate,
    #[error("Stalemate")]
    Stalemate,
}

pub type Result<T> = std::result::Result<T, ChessError>;

#[cfg(test)]
mod tests {
    use crate::board::chessboard::ChessBoard;

    #[test]
    fn new_board() {
        let result = ChessBoard::new();
        log::info!("result {:?}", result);
        assert_eq!(4, 4);
    }
}
