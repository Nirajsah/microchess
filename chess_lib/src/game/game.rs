use std::{
    fmt::Display,
    hash::{DefaultHasher, Hash, Hasher},
};

use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

use crate::{
    ChessError, Result,
    board::{bitboard::BitBoard, chessboard::ChessBoard, piece::Piece, square::Square},
    moves::move_type::{CompleteMove, MoveData, MoveType},
    pieces::Color,
};

/// The state of a Chess game.
#[derive(Clone, Default, Serialize, Deserialize)]
pub struct Game {
    /// The current state of the board.
    pub board: ChessBoard,
    pub active_player: Color,
    /// Moves Table
    pub moves: Vec<CompleteMove>, // not saving moves for now
    /// Game State
    pub state: GameState,
    pub winner: Option<Color>,
    /// Captured Pieces Table
    pub captured_pieces: Vec<String>,
    /*
    /// current zobrist hashing
     pub current_hash: u64,
     /// position_count
     pub position_count: HashMap<u64, u32>,
     */
    /// 50-Move Rule Counter
    pub halfmove_clock: u16,
    // represents full moves(increments when black makes a move)
    pub fullmove_number: u32,
}

#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum GameState {
    #[default]
    NotStarted,
    Ongoing,
    Checkmate,
    Stalemate,
    Resign,
    Ended,
}

impl Display for GameState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let g = match self {
            GameState::NotStarted => "NotStarted",
            GameState::Ongoing => "OnGoing",
            GameState::Checkmate => "Checkmate",
            GameState::Stalemate => "Stalemate",
            GameState::Resign => "Resign",
            GameState::Ended => "Ended",
        };
        write!(f, "{}", g)
    }
}

type PieceFn = fn(&mut ChessBoard, MoveData) -> Result<()>;

lazy_static! {
    pub static ref PIECE_FUNCS: [PieceFn; 7] = [
        ChessBoard::wp_move_or_capture,
        ChessBoard::bp_move_or_capture,
        ChessBoard::knight_move_or_capture,
        ChessBoard::bishop_move_or_capture,
        ChessBoard::rook_move_or_capture,
        ChessBoard::queen_move_or_capture,
        ChessBoard::king_move_or_capture,
    ];
}

impl Game {
    /// A function to create a new game using defaults
    pub fn new() -> Self {
        let mut game = Game {
            board: ChessBoard::new(),
            active_player: Color::White,
            state: GameState::default(),
            halfmove_clock: 0,
            captured_pieces: vec![],
            fullmove_number: 1,
            moves: vec![],
            winner: None,
        };
        game.game_state();

        game
    }

    pub fn raw() -> Self {
        Game {
            board: ChessBoard::default(),
            active_player: Color::default(),
            state: GameState::default(),
            halfmove_clock: 0,
            fullmove_number: 1,
            moves: vec![],
            captured_pieces: vec![],
            winner: None,
        }
    }

    /// Generates a ChessBoard from a FEN string
    #[inline]
    pub fn with_fen(fen: &str) -> Self {
        let mut game = Game::raw();
        let parts: Vec<&str> = fen.split_whitespace().collect();
        let piece_placement = parts[0];
        let active_player = parts[1];
        let castling_rights = *parts.get(2).unwrap_or(&"-");
        let en_passant = *parts.get(3).unwrap_or(&"-");
        let halfmove_clock: &str = parts.get(4).unwrap_or(&"0");
        let fullmove_number: &str = parts.get(5).unwrap_or(&"1"); // Parse the piece placement

        for (rank_idx, rank) in piece_placement.split('/').enumerate() {
            let mut file_idx = 0;
            for c in rank.chars() {
                let square = (7 - rank_idx) * 8 + file_idx;
                let mask = 1u64 << square;

                match c {
                    'P' => game.board.bitboards[0] |= mask,
                    'N' => game.board.bitboards[1] |= mask,
                    'B' => game.board.bitboards[2] |= mask,
                    'R' => game.board.bitboards[3] |= mask,
                    'Q' => game.board.bitboards[4] |= mask,
                    'K' => game.board.bitboards[5] |= mask,
                    'p' => game.board.bitboards[6] |= mask,
                    'n' => game.board.bitboards[7] |= mask,
                    'b' => game.board.bitboards[8] |= mask,
                    'r' => game.board.bitboards[9] |= mask,
                    'q' => game.board.bitboards[10] |= mask,
                    'k' => game.board.bitboards[11] |= mask,
                    '1'..='8' => {
                        let empty_squares = c.to_digit(10).unwrap() as usize;
                        file_idx += empty_squares - 1;
                    }
                    _ => {}
                };

                if let Some(p) = Piece::from_char(c) {
                    // Update square_map simultaneously
                    game.board.square_map[square] = Some(p);
                }

                file_idx += 1;
            }
        }

        // Parse castling rights
        let mut mask = 0;
        for ch in castling_rights.chars() {
            match ch {
                'K' => mask |= 0b1000,
                'Q' => mask |= 0b0100,
                'k' => mask |= 0b0010,
                'q' => mask |= 0b0001,
                '-' => {}
                _ => panic!("Invalid castling char: {}", ch),
            }
        }

        game.board.castling_rights = mask;

        // Parse en passant
        if en_passant != "-" {
            let en_passant_square = match en_passant.chars().nth(0) {
                Some(file) => en_passant
                    .chars()
                    .nth(1)
                    .map(|rank| (rank.to_digit(10).unwrap() as u8 - 1) * 8 + (file as u8 - b'a')),
                None => None,
            };
            if let Some(square) = en_passant_square {
                game.board.en_passant = Some(Square::uint_to_square(square)); // Placing en_passant
            }
        }

        game.active_player = active_player.parse().unwrap();

        // build occupancies
        game.board.occupancies[0] = game.board.bitboards[0..6]
            .iter()
            .fold(BitBoard::EMPTY, |acc, &bb| acc | bb);
        game.board.occupancies[1] = game.board.bitboards[6..12]
            .iter()
            .fold(BitBoard::EMPTY, |acc, &bb| acc | bb);

        game.halfmove_clock = halfmove_clock.parse().unwrap();
        game.fullmove_number = fullmove_number.parse().unwrap();

        game.game_state();

        game
    }

    /// A function to generate FEN string using bitboard
    /// `TODO`(Should use halfmove_clock and fullmove_number from self)
    #[inline]
    pub fn to_fen(&self) -> String {
        let bitboards = self.board.bitboards;

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

        fen.push(self.active_player.into());

        fen.push(' '); // just to have a whitespace

        // Add placeholder values for the rest of the FEN string
        // castling rights for K(0)Q(1)k(2)q(3)
        // Castling rights for K (White Kingside), Q (White Queenside),
        // k (Black Kingside), q (Black Queenside)
        let mut castling_str = String::with_capacity(4);
        let mask = self.board.castling_rights;

        if mask & 0b1000 != 0 {
            castling_str.push('K');
        }
        if mask & 0b0100 != 0 {
            castling_str.push('Q');
        }
        if mask & 0b0010 != 0 {
            castling_str.push('k');
        }
        if mask & 0b0001 != 0 {
            castling_str.push('q');
        }

        if castling_str.is_empty() {
            castling_str.push('-');
        }

        fen.push_str(&castling_str);

        if self.board.en_passant.is_some() {
            let en_passant_square = self.board.en_passant.unwrap();
            fen.push(' '); // just to have a whitespace
            fen.push_str(&en_passant_square.to_string());
        } else {
            fen.push_str(" -");
        }

        fen.push(' '); // just to have a whitespace

        fen.push_str(&self.halfmove_clock.to_string());

        fen.push(' '); // just to have a whitespace

        fen.push_str(&self.fullmove_number.to_string());

        fen
    }

    #[inline]
    fn make_move(&mut self, mv: MoveData) -> Result<()> {
        match mv.move_type {
            MoveType::Move => {
                let chessboard = &mut self.board;
                let piece_function = PIECE_FUNCS[mv.piece.move_index()];
                piece_function(chessboard, mv) // this makes the move on the board
            }
            MoveType::Capture(c) => {
                if mv.piece.color() == c.color() {
                    return Err(ChessError::InvalidCapture);
                }
                let chessboard = &mut self.board;
                let piece_function = PIECE_FUNCS[mv.piece.move_index()];
                piece_function(chessboard, mv)
            }
            MoveType::Castle => {
                if self.is_castling_valid(&mv) {
                    self.board.exec_castle(mv)
                } else {
                    Err(ChessError::InvalidCastle)
                }
            }
            MoveType::EnPassant => self.board.exec_en_passant_capture(mv),
            MoveType::Promotion(promoted_piece) => {
                self.board.exec_pawn_promotion(promoted_piece, mv)
            }
            MoveType::PromotionCapture(promoted_to, captured_piece) => {
                self.board.exec_pawn_promotion(promoted_to, mv).map(|_| {
                    self.board.bitboards[captured_piece.index()].clear(mv.to);
                    self.board.occupancies[captured_piece.color().index()].clear(mv.to);
                })
            }
        }
    }

    /// Check if castling is valid (basic sanity checks only)
    #[inline]
    pub fn is_castling_valid(&self, mv: &MoveData) -> bool {
        let piece = mv.piece;
        let from = mv.from;
        let to = mv.to;

        // 1. Piece must be a king
        if !piece.is_king() {
            return false;
        }

        // 2. King must exist at source
        if self.board.get_piece_at(from) != Some(piece) {
            return false;
        }

        // 3. Determine castling type
        let color = piece.color();
        let is_kingside = to.file() > from.file();

        // 4. Check castling rights
        let rights_mask = match (color, is_kingside) {
            (Color::White, true) => 0b1000,  // White kingside
            (Color::White, false) => 0b0100, // White queenside
            (Color::Black, true) => 0b0010,  // Black kingside
            (Color::Black, false) => 0b0001, // Black queenside
        };

        if self.board.castling_rights & rights_mask == 0 {
            return false;
        }

        // 5. Destination must be empty
        if self.board.get_piece_at(to).is_some() {
            return false;
        }

        true
    }

    #[inline]
    pub fn is_promotion(&self, sq: Square, color: Color) -> bool {
        match color {
            Color::White => sq.rank() == 8, // 8th rank (index 7)
            Color::Black => sq.rank() == 1, // 1st rank (index 0)
        }
    }

    #[inline]
    pub fn commit_move(
        &mut self,
        from: String,
        to: String,
        piece: String,
        promoted_to: Option<String>,
    ) -> Result<CompleteMove> {
        if self.state != GameState::Ongoing && self.state != GameState::NotStarted {
            return Err(ChessError::GameOver);
        }

        let mv = MoveData::new(from, to, piece, promoted_to, &self.board);

        if self.active_player != mv.piece.color() {
            return Err(ChessError::InvalidMove);
        }

        if !self.board.get_pseudo_legal_moves(mv.from, mv.piece) {
            return Err(ChessError::InvalidMove);
        }

        let previous_castling_rights = self.board.castling_rights;
        let previous_halfmove_clock = self.halfmove_clock;
        let previous_en_passant = self.board.en_passant;

        self.board.en_passant = None;
        let previous_state = self.state;

        match self.make_move(mv) {
            Ok(_) => {
                let captured_piece = match mv.move_type {
                    MoveType::Capture(piece) => Some(piece),
                    MoveType::PromotionCapture(_, captured) => Some(captured),
                    MoveType::EnPassant => {
                        // En passant captures opponent's pawn
                        let opponent_color = self.active_player.opposite();
                        Some(opponent_color.pawn())
                    }
                    MoveType::Move | MoveType::Castle | MoveType::Promotion(_) => None,
                };

                if let Some(piece) = captured_piece {
                    self.captured_pieces.push(piece.to_string())
                };

                let hash = self.compute_hash();
                let mut save_mv = CompleteMove {
                    from: mv.from,
                    to: mv.to,
                    piece: mv.piece,
                    move_type: mv.move_type,
                    previous_castling_rights,
                    previous_en_passant,
                    previous_halfmove_clock,
                    game_hash: hash,
                    san: None,
                    game_state: previous_state,
                };

                save_mv.san = Some(save_mv.to_san());
                self.turn_change();

                self.state = self.game_state();

                Ok(save_mv)
            }
            Err(e) => Err(e),
        }
    }

    pub fn undo_move(&mut self, mv: CompleteMove) -> Result<()> {
        let move_d = mv.to_move_data();

        // Restore game state
        self.board.castling_rights = mv.previous_castling_rights;
        self.halfmove_clock = mv.previous_halfmove_clock;
        self.board.en_passant = mv.previous_en_passant;

        match mv.move_type {
            MoveType::Move => self.board.undo_move(move_d)?,
            MoveType::Capture(cap_piece) => {
                self.board.undo_piece_capture(cap_piece, move_d)?;
            }
            MoveType::Castle => self.board.undo_castle(move_d)?,
            MoveType::EnPassant => self.board.undo_en_passant_capture(move_d)?,
            MoveType::Promotion(promoted_p) => {
                self.board.undo_pawn_promotion(promoted_p, move_d)?;
            }
            MoveType::PromotionCapture(promoted_to, captured_piece) => self
                .board
                .undo_pawn_promotion(promoted_to, move_d)
                .map(|_| {
                    self.board.bitboards[captured_piece.index()].set(move_d.to);
                    self.board.occupancies[captured_piece.color().index()].set(move_d.to);
                    self.board.square_map[move_d.to.index()] = Some(captured_piece);
                })?,
        };

        self.turn_change();
        self.state = mv.game_state; // restore previous game state 

        Ok(())
    }

    #[inline]
    pub fn turn_change(&mut self) {
        self.active_player = self.active_player.opposite();
        if self.active_player == Color::White {
            self.fullmove_number += 1
        }
    }

    pub fn compute_hash(&self) -> u64 {
        let mut hasher = DefaultHasher::new();

        // Hash all piece positions
        for i in 0..12 {
            self.board.bitboards[i].0.hash(&mut hasher);
        }

        // Hash occupancies
        self.board.occupancies[0].0.hash(&mut hasher);
        self.board.occupancies[1].0.hash(&mut hasher);

        // Hash game state
        self.board.castling_rights.hash(&mut hasher);
        self.board.en_passant.hash(&mut hasher);

        hasher.finish()
    }

    /*
       /// A function to compute zobrist hashing
       pub fn compute_zobrist_hash(&self) -> u64 {
           let mut hash = 0;

           // XOR piece positions
           for square in 0..64 {
               if let Some(piece) = self.board.get_piece_at(Square::usize_to_square(square)) {
                   hash ^= PIECE_KEYS[square][piece.index()];
               }
           }

           // XOR en passant key if an en passant square is present
           if self.board.en_passant != 0 {
               let en_passant_square = self.board.en_passant.trailing_zeros() as usize;
               hash ^= EP_KEYS[en_passant_square];
           }

           // XOR castling rights
           for i in 0..4 {
               if self.board.castling_rights[i] {
                   hash ^= CASTLE_KEYS[i];
               }
           }

           // XOR turn key if it's Black's turn
           if self.active == Color::Black {
               hash ^= *BLACK_TO_MOVE;
           }

           hash
       }

       /// Check for threefold_repetition
       pub fn check_threefold_repetition(&mut self) -> bool {
           let count = self.position_count.entry(self.current_hash).or_insert(0);
           *count += 1;
           *count == 3
       }

       /// A function to insert the captured_pieces into a vec
       pub fn insert_captured_pieces(&mut self, piece: &Piece) {
           self.captured_pieces.push(*piece);
       }

       /// A function to switch player turn
       pub fn switch_player_turn(&mut self) {
           self.active = self.active.opposite();

           if self.active == Color::Black {
               self.fullmove_count += 1
           }

           update_side_hash(self.active, &mut self.current_hash);
       }

       /// A function to reset the halfmove_clock to 0,on pawn move or a piece capture
       pub fn reset_halfmove_clock(&mut self) {
           self.halfmove_clock = 0
       }

       /// A function to update the halfmove_clock by 1
       pub fn update_halfmove_clock(&mut self) {
           self.halfmove_clock += 1
       }

       /// Check if halfmove_clock is greater or equals to 100, [Draw]
       pub fn check_50_move_rule(&self) -> bool {
           self.halfmove_clock >= 100
       }
    */

    /// Get all possible moves for a piece
    #[inline]
    fn has_legal_moves(&mut self) -> bool {
        let player = self.active_player;

        let mut pieces = match player {
            Color::White => self.board.white_pieces(),
            Color::Black => self.board.black_pieces(),
        };

        while let Some(from_idx) = pieces.pop_lsb() {
            let from = Square::uint_to_square(from_idx as u8);

            if let Some(piece) = self.board.get_piece_at(from) {
                if self.board.get_pseudo_legal_moves(from, piece) {
                    return true;
                }
            };
        }

        false
    }

    /// called for active player, after a move succeed and turn is changes we call game_state,
    /// to know that the active player has moves or maybe its checkmate/stalemate.
    #[inline]
    pub fn game_state(&mut self) -> GameState {
        let color = self.active_player;
        let in_check = self.board.king_in_check(color);
        let has_moves = self.has_legal_moves();

        if !has_moves {
            if in_check {
                self.winner = Some(color.opposite());
                return GameState::Checkmate;
            } else {
                return GameState::Stalemate;
            }
        }
        GameState::Ongoing
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::board::piece::Piece;
    use crate::board::square::Square;
    use crate::moves::move_type::{MoveData, MoveType};
    use crate::pieces::Color;
    use std::str::FromStr;

    // ==================== Game Initialization Tests ====================

    #[test]
    fn test_new_game_initializes_correctly() {
        let game = Game::new();
        assert_eq!(game.active_player, Color::White);
        assert_eq!(game.halfmove_clock, 0);
        assert_eq!(game.fullmove_number, 1);
    }

    #[test]
    fn test_raw_game_creates_empty_board() {
        let game = Game::raw();
        assert_eq!(game.active_player, Color::default());
        assert_eq!(game.halfmove_clock, 0);
        assert_eq!(game.fullmove_number, 1);
    }

    // ==================== FEN Parsing Tests ====================

    #[test]
    fn test_fen_starting_position() {
        let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        let game = Game::with_fen(fen);

        assert_eq!(game.active_player, Color::White);
        assert_eq!(game.halfmove_clock, 0);
        assert_eq!(game.fullmove_number, 1);
        assert_eq!(game.board.castling_rights, 0b1111);
    }

    #[test]
    fn test_fen_mid_game_position() {
        let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
        let game = Game::with_fen(fen);

        assert_eq!(game.active_player, Color::White);
        assert_eq!(game.board.castling_rights, 0b1111);
    }

    #[test]
    fn test_fen_with_en_passant() {
        let fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
        let game = Game::with_fen(fen);

        assert_eq!(game.active_player, Color::Black);
        assert_ne!(game.board.en_passant, None);
    }

    #[test]
    fn test_fen_without_castling_rights() {
        let fen = "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1";
        let game = Game::with_fen(fen);

        assert_eq!(game.board.castling_rights, 0);
    }

    #[test]
    fn test_fen_black_to_move() {
        let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";
        let game = Game::with_fen(fen);

        assert_eq!(game.active_player, Color::Black);
    }

    // ==================== Make Move Tests ====================

    #[test]
    fn test_make_move_executes_valid_moves() {
        let mut game = Game::new();

        let test_moves = vec![
            ("e2", "e4", Piece::WhitePawn),
            ("d2", "d4", Piece::WhitePawn),
            ("g1", "f3", Piece::WhiteKnight),
        ];

        for (from, to, piece) in test_moves {
            let mv = MoveData {
                from: Square::from_str(from).unwrap(),
                to: Square::from_str(to).unwrap(),
                piece,
                move_type: MoveType::Move,
            };

            assert!(game.make_move(mv).is_ok());
        }
    }

    #[test]
    fn test_make_move_executes_captures() {
        let fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1";
        let mut game = Game::with_fen(fen);

        let captures = vec![("e4", "e5", Piece::WhitePawn, Piece::BlackPawn)];

        for (from, to, piece, captured) in captures {
            let mv = MoveData {
                from: Square::from_str(from).unwrap(),
                to: Square::from_str(to).unwrap(),
                piece,
                move_type: MoveType::Capture(captured),
            };

            assert!(game.make_move(mv).is_err());
        }
    }

    // ==================== Commit Move Tests ====================

    #[test]
    fn test_white_pawn_cannot_capture_own_pawn() {
        let fen = "rnbqkbnr/pppppppp/8/8/8/3P4/PPP1PPPP/RNBQKBNR w KQkq - 0 1";
        let mut game = Game::with_fen(fen);

        let result = game.commit_move("e2".to_string(), "d3".to_string(), "wP".to_string(), None);
        assert!(result.is_err(), "White pawn should not capture own pawn");
    }

    #[test]
    fn test_white_knight_cannot_capture_own_bishop() {
        let fen = "rnbqkbnr/pppppppp/8/8/8/2B5/PPPPPPPP/RNBQK1NR w KQkq - 0 1";
        let mut game = Game::with_fen(fen);

        let result = game.commit_move("b1".to_string(), "c3".to_string(), "wN".to_string(), None);
        assert!(
            result.is_err(),
            "White knight should not capture white bishop"
        );
    }

    #[test]
    fn test_black_bishop_move() {
        let fen = "r1bqkbnr/pppppppp/2n5/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";
        let mut game = Game::with_fen(fen);

        let result = game.commit_move("c8".to_string(), "c6".to_string(), "bB".to_string(), None);
        assert!(result.is_err(), "Black bishop should not move");
    }

    // ==================== Turn Change Tests ====================

    #[test]
    fn test_turn_change_switches_player() {
        let mut game = Game::new();

        assert_eq!(game.active_player, Color::White);
        game.turn_change();
        assert_eq!(game.active_player, Color::Black);
        game.turn_change();
        assert_eq!(game.active_player, Color::White);
    }

    // ==================== Legal Move Tests ====================

    #[test]
    fn test_has_legal_moves_at_start_position() {
        let mut game = Game::new();
        assert!(game.has_legal_moves());
    }

    #[test]
    fn test_has_legal_moves_in_checkmate_position() {
        let fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 1";
        let mut game = Game::with_fen(fen);
        assert!(!game.has_legal_moves());
    }

    #[test]
    fn test_has_legal_moves_in_stalemate_position() {
        let fen = "k7/8/1Q6/8/8/8/8/K7 b - - 0 1";
        let mut game = Game::with_fen(fen);
        assert!(!game.has_legal_moves());
    }

    // ==================== Game State Tests ====================

    #[test]
    fn test_game_state_ongoing() {
        let mut game = Game::new();
        assert_eq!(game.game_state(), GameState::Ongoing);
    }

    #[test]
    fn test_game_state_checkmate() {
        let fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 1";
        let mut game = Game::with_fen(fen);
        assert_eq!(game.game_state(), GameState::Checkmate);
    }

    #[test]
    fn test_game_state_stalemate() {
        let fen = "k7/8/1Q6/8/8/8/8/K7 b - - 0 1";
        let mut game = Game::with_fen(fen);
        assert_eq!(game.game_state(), GameState::Stalemate);
    }

    // ==================== Integration Tests ====================

    #[test]
    fn test_complete_game_sequence() {
        let mut game = Game::new();

        let moves = vec![
            ("e2", "e4", "wP", None),
            ("e7", "e5", "bP", None),
            ("g1", "f3", "wN", None),
            ("b8", "c6", "bN", None),
        ];

        for (from, to, piece, move_type) in moves {
            assert!(
                game.commit_move(
                    from.to_string(),
                    to.to_string(),
                    piece.to_string(),
                    move_type
                )
                .is_ok()
            );
        }

        assert_eq!(game.fullmove_number, 3);
    }

    #[test]
    fn test_castling_both_sides() {
        let fen = "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1";
        let mut game = Game::with_fen(fen);

        // White kingside castle
        assert!(
            game.commit_move("e1".to_string(), "g1".to_string(), "wK".to_string(), None)
                .is_ok()
        );
    }
}
