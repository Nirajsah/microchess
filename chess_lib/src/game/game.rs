use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

use crate::{
    ChessError, Result,
    board::{chessboard::ChessBoard, piece::Piece},
    moves::move_type::{MoveData, MoveType},
};

/// The state of a Chess game.
#[derive(Clone, Default, Serialize, Deserialize)]
pub struct Game {
    /// The current state of the board.
    pub board: ChessBoard,
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
    /// 50-Move Rule Counter
    pub halfmove_clock: u32,
    // represents full moves(increments when black makes a move)
    pub fullmove_count: u32,
    */
}

type PieceFn = fn(&mut ChessBoard, MoveData);

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
        log::info!("Game is starting....");
        Game {
            board: ChessBoard::new(),
        }
    }

    pub fn is_move_valid(&self, mv: MoveData) -> Result<()> {
        //piece's bitboard
        let moving_piece_board = self.board.get_board(&mv.piece);
        if !moving_piece_board.is_set(mv.from) || self.board.all_pieces().is_set(mv.to) {
            println!(
                "pieces not present at :{:?}, and present at :{:?}",
                mv.from, mv.to
            );
            return Err(ChessError::InvalidMove);
        }

        Ok(())
    }

    pub fn is_capture_valid(&self, capture_piece: Piece, mv: MoveData) -> Result<()> {
        let moving_piece_board = self.board.get_board(&mv.piece);
        let capture_piece_board = self.board.get_board(&capture_piece);
        if !moving_piece_board.is_set(mv.from) || !capture_piece_board.is_set(mv.to) {
            println!(
                "pieces not present at :{:?}, capture piece not present at :{:?}",
                mv.from, mv.to
            );
            return Err(ChessError::InvalidCapture);
        }

        Ok(())
    }

    pub fn make_move(&mut self, mv: MoveData) -> Result<()> {
        match mv.move_type {
            MoveType::Move => self.is_move_valid(mv).and_then(|_| {
                let chessboard = &mut self.board;
                let piece_function = PIECE_FUNCS[mv.piece.move_index()];
                piece_function(chessboard, mv); // this makes the move on the board
                Ok(())
            }),
            MoveType::Capture(piece) => self.is_capture_valid(piece, mv).and_then(|_| {
                let chessboard = &mut self.board;
                let piece_function = PIECE_FUNCS[mv.piece.move_index()];
                piece_function(chessboard, mv);

                Ok(())
            }),
            MoveType::Castle(_) => Ok(()),
            MoveType::EnPassant => Ok(()),
            MoveType::Promotion(_) => Ok(()),
        }
    }

    // This should be a part of the game struct
    /* /// Generates a ChessBoard from a FEN string
    pub fn with_fen(fen: &str) -> Self {
        let mut board = ChessBoard::default();

        let parts: Vec<&str> = fen.split_whitespace().collect();
        let piece_placement = parts[0];
        let castling_rights = parts.get(2).unwrap_or(&"-");
        let en_passant = parts.get(3).unwrap_or(&"-");
        let halfmove_clock = parts.get(4).unwrap_or(&"0");
        let fullmove_number = parts.get(5).unwrap_or(&"1");        // Parse the piece placement

        for (rank_idx, rank) in piece_placement.split('/').enumerate() {
            let mut file_idx = 0;
            for c in rank.chars() {
                let square = (7 - rank_idx) * 8 + file_idx;
                let mask = 1u64 << square;

                match c {
                    'P' => board.wp |= mask,
                    'N' => board.wn |= mask,
                    'B' => board.wb |= mask,
                    'R' => board.wr |= mask,
                    'Q' => board.wq |= mask,
                    'K' => board.wk |= mask,
                    'p' => board.bp |= mask,
                    'n' => board.bn |= mask,
                    'b' => board.bb |= mask,
                    'r' => board.br |= mask,
                    'q' => board.bq |= mask,
                    'k' => board.bk |= mask,
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
                '-' => {},
                _   => panic!("Invalid castling char: {}", ch),
            }
        }
        board.castling_rights = mask;

        // Parse en passant
        if *en_passant != "-" {
            let en_passant_square = match en_passant.chars().nth(0) {
                Some(file) => en_passant.chars().nth(1).map(|rank| {
                    (rank.to_digit(10).unwrap() as u64 - 1) * 8 + (file as u64 - 'a' as u64)
                }),
                None => None,
            };
            if let Some(square) = en_passant_square {
                board.en_passant = BitBoard(1u64 << square); // Placing en_passant
            }
        }

        halfmove_clock = halfmove_clock.parse().unwrap();
        fullmove_number = fullmove_number.parse().unwrap();

        board
    } */

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

    /// A function to make move
    pub fn make_move(&mut self, from: Square, to: Square, piece: Piece, m: MoveType) -> Result<()> {
        let color = piece.color().opposite();
        match m {
            MoveType::Move => match self.move_piece(from, to, piece) {
                Ok(_) => {
                    // Revoke castling rights for a ColorSide permanently
                    if piece == Piece::WhiteRook || piece == Piece::BlackRook {
                        self.board.revoke_castling_rights(color, from);
                        update_castle_hash(self.board.castling_rights, &mut self.current_hash);
                    }

                    // update halfmove_clock based on piece(halfmove_clock's reset is done whenever pawn moves or a piece is captured)
                    if piece == Piece::WhitePawn || piece == Piece::BlackPawn {
                        self.reset_halfmove_clock();
                    } else {
                        self.update_halfmove_clock();
                    }

                    update_piece_hash(from, piece, &mut self.current_hash);
                    update_piece_hash(to, piece, &mut self.current_hash);

                    Ok(())
                }
                Err(e) => Err(e),
            },
            MoveType::Capture(Piece) => match self.capture_piece(from, to, piece, Piece) {
                Ok(_) => {
                    // Revoke castling rights for a ColorSide permanently(K,Q,k,q), when a rook is caputred at the starting position
                    if Piece == Piece::WhiteRook || Piece == Piece::BlackRook {
                        self.board.revoke_castling_rights(color, to);
                        update_castle_hash(self.board.castling_rights, &mut self.current_hash);
                    }

                    update_piece_hash(from, piece, &mut self.current_hash); // XOR out from the starting square
                    update_piece_hash(to, Piece, &mut self.current_hash); // XOR out captured piece
                    update_piece_hash(to, piece, &mut self.current_hash); // XOR in moving piece to new square

                    self.insert_captured_pieces(&Piece);
                    self.reset_halfmove_clock();
                    Ok(())
                }
                Err(e) => Err(e),
            },
            MoveType::Castle(CastleType::KingSide) => {
                match self.castle(&piece, CastleType::KingSide) {
                    Ok(_) => {
                        self.board.update_castling_rights(color); // revoke castling rights after castling
                        update_castle_hash(self.board.castling_rights, &mut self.current_hash);
                        self.update_halfmove_clock();
                        Ok(())
                    }
                    Err(e) => Err(e),
                }
            }
            MoveType::Castle(CastleType::QueenSide) => {
                match self.castle(&piece, CastleType::QueenSide) {
                    Ok(_) => {
                        self.board.update_castling_rights(color); // revoke castling rights after castling
                        update_castle_hash(self.board.castling_rights, &mut self.current_hash);
                        self.update_halfmove_clock();
                        Ok(())
                    }
                    Err(e) => Err(e),
                }
            }
            MoveType::EnPassant => match self.board.en_passant_capture(from, to, &piece) {
                Ok(_) => {
                    self.insert_captured_pieces(&piece.opp_piece()); // In case of en passant, only pawns can be captured
                    update_ep_hash(to, &mut self.current_hash);
                    self.reset_halfmove_clock();
                    Ok(())
                }

                Err(e) => Err(e),
            },
            MoveType::Promotion(Piece) => {
                update_piece_hash(from, piece, &mut self.current_hash);

                if let Some(captured_piece) = self.board.get_piece_at(to) {
                    log::info!("Promotion and Capture: {:?}", captured_piece);
                    update_piece_hash(to, captured_piece, &mut self.current_hash); // Remove captured piece
                    self.capture_piece(from, to, piece, captured_piece)?;
                } else {
                    log::info!("Promotion without Capture");
                    self.move_piece(from, to, piece)?; // Move without capture
                }

                update_piece_hash(to, Piece, &mut self.current_hash);
                self.update_halfmove_clock();

                self.board.add_piece(to, piece, Piece)
            }
        }
    }

    /// A function to castle
    pub fn castle(&mut self, piece: &Piece, castle_type: CastleType) -> Result<()> {
        match piece {
            Piece::WhiteKing => {
                if !self.board.castling_rights[0] {
                    return Err(ChessError::CastleRights);
                }
                match castle_type {
                    CastleType::KingSide => self.board.wK_castle_king_side(),
                    CastleType::QueenSide => self.board.wK_castle_queen_side(),
                }
            }
            Piece::BlackKing => {
                if !self.board.castling_rights[1] {
                    return Err(ChessError::CastleRights);
                }
                match castle_type {
                    CastleType::KingSide => self.board.bK_castle_king_side(),
                    CastleType::QueenSide => self.board.bK_castle_queen_side(),
                }
            }
            _ => Err(ChessError::InvalidPiece),
        }
    }

    /// A function to move piece
    pub fn move_piece(&mut self, from: Square, to: Square, piece: Piece) -> Result<()> {
        match piece {
            Piece::WhitePawn => self.board.wP_moves(from, to, &piece),
            Piece::BlackPawn => self.board.bP_moves(from, to, &piece),
            Piece::WhiteKnight | Piece::BlackKnight => self.board.knight_moves(from, to, &piece),
            Piece::WhiteKing | Piece::BlackKing => self.board.king_moves(from, to, &piece),
            Piece::WhiteBishop | Piece::BlackBishop => self.board.bishop_moves(from, to, &piece),
            Piece::WhiteRook | Piece::BlackRook => self.board.rook_moves(from, to, &piece),
            Piece::WhiteQueen | Piece::BlackQueen => self.board.queen_moves(from, to, &piece),
        }
    }

    /// a function to capture piece
    pub fn capture_piece(
        &mut self,
        from: Square,
        to: Square,
        piece: Piece,
        captured_piece: Piece,
    ) -> Result<()> {
        if piece.color() == captured_piece.color() {
            return Err(ChessError::InvalidCapture);
        }

        if self.board.get_piece_at(to).is_none() {
            return Err(ChessError::InvalidCapture);
        }
        match piece {
            Piece::WhitePawn => self.board.wP_captures(from, to, &piece, &captured_piece),
            Piece::BlackPawn => self.board.bP_captures(from, to, &piece, &captured_piece),
            Piece::WhiteKnight | Piece::BlackKnight => {
                self.board
                    .knight_captures(from, to, &piece, &captured_piece)
            }
            Piece::WhiteKing | Piece::BlackKing => {
                self.board.king_captures(from, to, &piece, &captured_piece)
            }
            Piece::WhiteRook | Piece::BlackRook => {
                self.board.rook_captures(from, to, &piece, &captured_piece)
            }
            Piece::WhiteBishop | Piece::BlackBishop => {
                self.board
                    .bishop_captures(from, to, &piece, &captured_piece)
            }
            Piece::WhiteQueen | Piece::BlackQueen => {
                self.board.queen_captures(from, to, &piece, &captured_piece)
            }
        }
    }

    /// A function to check stalemate, returns true if stalemate(this checks for a possible legal
    /// move)
    pub fn is_stalemate(&mut self, total_pieces: Bitboard) -> bool {
        let mut pieces = total_pieces;
        while pieces != 0 {
            let from: usize = pieces.trailing_zeros() as usize;
            let square = Square::usize_to_square(from);
            if let Some(piece) = self.board.get_piece_at(square) {
                if let Some(_possible_moves) = self.get_possible_moves(square, piece) {
                    return false;
                }
            }

            pieces &= pieces - 1;
        }
        true
    }

    /// Check if the current player is in checkmate
    pub fn is_checkmate(&mut self) -> bool {
        let color = self.active;

        let mut pieces = match color {
            Color::White => self.board.white_pieces(),
            Color::Black => self.board.black_pieces(),
        };

        // if not in check return false
        if !self.board.in_check(color) && self.is_stalemate(pieces) {
            self.state = GameState::Stalemate;
            return false;
        }

        // Try all possible moves for all pieces of the current player
        while pieces != 0 {
            let from: usize = pieces.trailing_zeros() as usize;
            let square = Square::usize_to_square(from);
            if let Some(piece) = self.board.get_piece_at(square) {
                if let Some(possible_moves) = self.get_possible_moves(square, piece) {
                    for mv in possible_moves {
                        // Create a copy of the board to test moves
                        let mut temp_board = self.clone();
                        match temp_board.make_move(mv.from, mv.to, mv.piece, mv.move_type) {
                            Ok(_) => {
                                if !temp_board.board.in_check(color) {
                                    return false;
                                }
                            }
                            Err(e) => {
                                log::trace!("Error: {:?}", e);
                            }
                        }
                    }
                }
            }

            pieces &= pieces - 1;
        }
        true
    }

    /// Get all possible moves for a piece
    fn get_possible_moves(&self, from: Square, piece: Piece) -> Option<Vec<MoveData>> {
        let color = piece.color();
        let moves = match piece {
            Piece::WhitePawn | Piece::BlackPawn => self.board.get_pawn_moves(from, color),
            Piece::WhiteKnight | Piece::BlackKnight => self.board.get_knight_moves(from, color),
            Piece::WhiteKing | Piece::BlackKing => self.board.get_king_moves(from, color),
            Piece::WhiteBishop | Piece::BlackBishop => self.board.get_bishop_moves(from, color),
            Piece::WhiteRook | Piece::BlackRook => self.board.get_rook_moves(from, color),
            Piece::WhiteQueen | Piece::BlackQueen => self.board.get_queen_moves(from, color),
        };

        let move_data: Option<Vec<MoveData>> = moves.map(|moves_vec| {
            moves_vec
                .into_iter()
                .map(|to| MoveData::new(from, to, piece, &self.board))
                .collect()
        });

        move_data
    } */
}
