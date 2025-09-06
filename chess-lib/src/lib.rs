pub mod board;
pub mod moves;
pub mod utils;

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
