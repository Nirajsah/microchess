use std::str::FromStr;

use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

use crate::{
    ChessError, Result,
    board::{bitboard::BitBoard, chessboard::ChessBoard, piece::Piece, square::Square},
    moves::move_type::{MoveData, MoveType},
    pieces::Color,
};

/// The state of a Chess game.
#[derive(Clone, Default, Serialize, Deserialize)]
pub struct Game {
    /// The current state of the board.
    pub board: ChessBoard,
    pub active_player: Color,
    /* /// Moves Table
    pub moves: Vec<Move>,
    /// Captured Pieces Table
    pub captured_pieces: Vec<Piece>,
    /// Game State
    pub state: GameState,
    /// current zobrist hashing
    pub current_hash: u64,
    /// position_count
    pub position_count: HashMap<u64, u32>,
    */
    /// 50-Move Rule Counter
    pub halfmove_clock: u8,
    // represents full moves(increments when black makes a move)
    pub fullmove_number: u8,
}

#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum GameState {
    #[default]
    Ongoing,
    Checkmate,
    Stalemate,
    Resign,
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
        Game {
            board: ChessBoard::new(),
            active_player: Color::White,
            halfmove_clock: 0,
            fullmove_number: 1,
        }
    }

    pub fn raw() -> Self {
        Game {
            board: ChessBoard::default(),
            active_player: Color::default(),
            halfmove_clock: 0,
            fullmove_number: 1,
        }
    }

    pub fn is_move_valid(&self, mv: &MoveData) -> Result<()> {
        //piece's bitboard
        let moving_piece_board = self.board.get_board(&mv.piece);
        if !moving_piece_board.is_set(mv.from) || self.board.all_pieces().is_set(mv.to) {
            return Err(ChessError::InvalidMove);
        }

        Ok(())
    }

    pub fn is_capture_valid(&self, capture_piece: Piece, mv: &MoveData) -> Result<()> {
        let moving_piece_board = self.board.get_board(&mv.piece);
        let capture_piece_board = self.board.get_board(&capture_piece);
        if !moving_piece_board.is_set(mv.from)
            || !capture_piece_board.is_set(mv.to)
            || mv.piece.color() == capture_piece.color()
        {
            return Err(ChessError::InvalidCapture);
        }

        Ok(())
    }

    pub fn is_castle_valid(&self, mv: &MoveData) -> Result<()> {
        // Must be king
        if self.board.king_in_check(mv.piece.color()) && !self.board.can_castle(mv.from, mv.to) {
            return Err(ChessError::InvalidCastle);
        };

        Ok(())
    }

    pub fn is_promotion_valid(&self, mv: &MoveData) -> Result<()> {
        if mv.piece.is_pawn()
            && ((mv.piece.is_white() && mv.to.rank() == 8)
                || (mv.piece.is_black() && mv.to.rank() == 1))
        {
            Ok(())
        } else {
            Err(ChessError::InvalidPromotion)
        }
    }

    pub fn make_move(&mut self, mv: MoveData) -> Result<()> {
        match mv.move_type {
            MoveType::Move => self.is_move_valid(&mv).and_then(|_| {
                let chessboard = &mut self.board;
                let piece_function = PIECE_FUNCS[mv.piece.move_index()];
                piece_function(chessboard, mv) // this makes the move on the board
            }),
            MoveType::Capture(piece) => self.is_capture_valid(piece, &mv).and_then(|_| {
                let chessboard = &mut self.board;
                let piece_function = PIECE_FUNCS[mv.piece.move_index()];
                piece_function(chessboard, mv)
            }),
            MoveType::Castle => self
                .is_castle_valid(&mv)
                .and_then(|_| self.board.exec_castle(mv)),
            MoveType::EnPassant => self.board.exec_en_passant_capture(mv),
            MoveType::Promotion(promoted_piece) => self
                .is_promotion_valid(&mv)
                .and_then(|_| self.board.exec_pawn_promotion(promoted_piece, mv)),
        }
    }

    pub fn commit_move(
        &mut self,
        from: &str,
        to: &str,
        piece: &str,
        move_type: MoveType,
    ) -> Result<()> {
        let from = Square::from_str(from).unwrap();
        let to = Square::from_str(to).unwrap();
        let piece = Piece::from_str(piece).unwrap();

        if self.active_player != piece.color() {
            return Err(ChessError::InvalidMove);
        }
        let mut mv = MoveData {
            from,
            to,
            piece,
            move_type,
        };

        // This validates and updates the move_type, no further validation needed for en_passant capture
        if piece.is_pawn() && self.board.is_square_empty(to) {
            if let Some(sq) = self.board.en_passant_square(to, piece.color()) {
                if self.board.en_passant.is_set(sq) {
                    mv.move_type = MoveType::EnPassant;
                }
            };
        }

        // This updates the move_type based on checks, same checks not needed in validation
        if piece.is_king() && self.board.is_castling_move(mv.from, mv.to) {
            mv.move_type = MoveType::Castle
        }

        self.make_move(mv).and_then(|_| {
            self.turn_change();
            self.game_state();
            Ok(())
        })
    }

    pub fn turn_change(&mut self) {
        self.active_player = self.active_player.opposite()
    }

    /// Generates a ChessBoard from a FEN string
    pub fn with_fen(fen: &str) -> Self {
        let mut game = Game::raw();
        let mut boards = game.board.bitboards;

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
                    'P' => boards[0] |= mask,
                    'N' => boards[1] |= mask,
                    'B' => boards[2] |= mask,
                    'R' => boards[3] |= mask,
                    'Q' => boards[4] |= mask,
                    'K' => boards[5] |= mask,
                    'p' => boards[6] |= mask,
                    'n' => boards[7] |= mask,
                    'b' => boards[8] |= mask,
                    'r' => boards[9] |= mask,
                    'q' => boards[10] |= mask,
                    'k' => boards[11] |= mask,
                    '1'..='8' => {
                        let empty_squares = c.to_digit(10).unwrap() as usize;
                        file_idx += empty_squares - 1;
                    }
                    _ => {}
                }
                file_idx += 1;
            }
        }

        // Parse castling rights
        let mut mask = 0;
        for ch in castling_rights.chars() {
            match ch {
                'K' => mask |= 0b0001,
                'Q' => mask |= 0b0010,
                'k' => mask |= 0b0100,
                'q' => mask |= 0b1000,
                '-' => {}
                _ => panic!("Invalid castling char: {}", ch),
            }
        }

        game.board.castling_rights = mask;

        // Parse en passant
        if en_passant != "-" {
            let en_passant_square = match en_passant.chars().nth(0) {
                Some(file) => en_passant.chars().nth(1).map(|rank| {
                    (rank.to_digit(10).unwrap() as u64 - 1) * 8 + (file as u64 - 'a' as u64)
                }),
                None => None,
            };
            if let Some(square) = en_passant_square {
                game.board.en_passant = BitBoard(1u64 << square); // Placing en_passant
            }
        }

        game.active_player = active_player.parse().unwrap();

        // build occupancies
        game.board.occupancies[0] = boards[0..6]
            .iter()
            .fold(BitBoard::EMPTY, |acc, &bb| acc | bb);
        game.board.occupancies[1] = boards[6..12]
            .iter()
            .fold(BitBoard::EMPTY, |acc, &bb| acc | bb);

        game.halfmove_clock = halfmove_clock.parse().unwrap();
        game.fullmove_number = fullmove_number.parse().unwrap();

        game
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

       /// A function to create a move string
       pub fn create_move_string(&mut self, color: Color, chess_move: String) {
           match color {
               Color::White => {
                   if self.moves.is_empty() || self.moves.last().unwrap().black.is_some() {
                       self.moves.push(Move {
                           white: Some(chess_move),
                           black: None,
                       });
                   } else {
                       self.moves.last_mut().unwrap().white = Some(chess_move);
                   }
               }
               Color::Black => {
                   if let Some(last_move) = self.moves.last_mut() {
                       if last_move.black.is_none() {
                           last_move.black = Some(chess_move);
                       } else {
                           self.moves.push(Move {
                               white: None,
                               black: Some(chess_move),
                           });
                       }
                   } else {
                       self.moves.push(Move {
                           white: None,
                           black: Some(chess_move),
                       });
                   }
               }
           }
       }

       /// A function to get active player
       pub fn active_player(&self) -> Color {
           self.active
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
    pub fn has_legal_moves(&self) -> bool {
        let player = self.active_player;

        let mut pieces = match player {
            Color::White => self.board.white_pieces(),
            Color::Black => self.board.black_pieces(),
        };

        while let Some(from_idx) = pieces.pop_lsb() {
            let from = Square::uint_to_square(from_idx as u8);

            if let Some(piece) = self.board.get_piece_at(from) {
                let color = piece.color();
                let moves: BitBoard = match piece {
                    Piece::WhitePawn | Piece::BlackPawn => {
                        // self.board.get_pawn_moves(from, piece.color())
                        todo!()
                    }
                    Piece::WhiteKnight | Piece::BlackKnight => {
                        self.board.get_knight_moves(from, color)
                    }
                    Piece::WhiteBishop | Piece::BlackBishop => {
                        self.board.get_bishop_moves(from, color)
                    }
                    Piece::WhiteRook | Piece::BlackRook => self.board.get_rook_moves(from, color),
                    Piece::WhiteQueen | Piece::BlackQueen => {
                        self.board.get_bishop_moves(from, color)
                            | self.board.get_rook_moves(from, color)
                    }
                    Piece::WhiteKing | Piece::BlackKing => self.board.get_king_moves(from, color),
                };

                let mut targets = moves;
                while let Some(to_idx) = targets.pop_lsb() {
                    let to = Square::uint_to_square(to_idx as u8);

                    if self.is_move_legal_simple(from, to, piece) {
                        return true;
                    }
                }
            }
        }

        false
    }

    pub fn is_move_legal_simple(&self, from: Square, to: Square, piece: Piece) -> bool {
        let mut new_occupied = self.board.all_pieces();
        let mut square_map = self.board.square_map.clone();
        let opponent = piece.color().opposite();

        // Direct legality check:
        if piece.is_king() {
            !self.board.is_under_attack(to, opponent)
        }
        // En_Passant legality check
        else if piece.is_pawn() && self.board.en_passant.is_set(to) {
            let captured_sq = self
                .board
                .en_passant_square(to, piece.color())
                .expect("Square Index is not correct");

            new_occupied.clear(from);
            new_occupied.clear(captured_sq);
            new_occupied.set(to);

            square_map[from.index()] = None;
            square_map[captured_sq.index()] = None;
            square_map[to.index()] = Some(piece);

            let mut opponent_pieces = self.board.get_opponent_pieces(piece) & new_occupied;

            let king_sq = self.board.get_king_square(piece.color());

            !self.is_king_attacked(king_sq, &square_map, &new_occupied, &mut opponent_pieces)
        } else if self
            .is_castle_valid(&MoveData {
                from,
                to,
                piece,
                move_type: MoveType::Move, // Here it does not matter what the move_type is.
            })
            .is_ok()
        {
            // Determine rook's source and destination squares
            let rank = from.rank() - 1; // This is 0 for White and 7 for Black
            let file_dest = to.file() - 1;
            let rook_from =
                Square::uint_to_square((rank * 8 + if file_dest == 6 { 7 } else { 0 }) as u8);
            let rook_to =
                Square::uint_to_square((rank * 8 + if file_dest == 6 { 5 } else { 3 }) as u8);

            let rook = if piece.color() == Color::White {
                Piece::WhiteRook
            } else {
                Piece::BlackRook
            };

            // Move king
            new_occupied.clear(from);
            new_occupied.set(to);
            square_map[from.index()] = None;
            square_map[to.index()] = Some(piece);

            // Move rook
            new_occupied.clear(rook_from);
            new_occupied.set(rook_to);
            square_map[rook_from.index()] = None;
            square_map[rook_to.index()] = Some(rook);

            let mut opponent_pieces = self.board.get_opponent_pieces(piece) & new_occupied;

            let king_sq = to; // King’s new square
            !self.is_king_attacked(king_sq, &square_map, &new_occupied, &mut opponent_pieces)
        }
        // Normal move legality check
        else {
            new_occupied.clear(from); // Remove from source
            new_occupied.set(to); // Add to destination
            square_map[from.index()] = None;
            square_map[to.index()] = Some(piece);
            let mut opponent_pieces = self.board.get_opponent_pieces(piece) & new_occupied;

            let king_sq = self.board.get_king_square(piece.color());

            // Check if king would be safe with this new occupancy
            !self.is_king_attacked(king_sq, &square_map, &new_occupied, &mut opponent_pieces)
        }
    }

    pub fn is_king_attacked(
        &self,
        king_sq: Square,
        square_map: &Vec<Option<Piece>>,
        occupancy: &BitBoard,
        opponent_board: &mut BitBoard,
    ) -> bool {
        self.board
            .compute_attack_mask_on_the_fly(square_map, occupancy, opponent_board)
            .is_set(king_sq)
    }

    pub fn game_state(&self) -> GameState {
        let color = self.active_player;

        if self.has_legal_moves() {
            if self.board.king_in_check(color) {
                return GameState::Checkmate;
            } else {
                return GameState::Stalemate;
            }
        }

        GameState::Ongoing
    }
}
