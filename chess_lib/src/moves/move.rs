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

impl MoveData {
    pub fn new(from: Square, to: Square, piece: Piece, board: &ChessBoard) -> Self {
        let move_type = if let Some(captured_piece) = board.get_piece_at(to) {
            MoveType::Capture(captured_piece)
        } else {
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
