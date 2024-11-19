#![allow(non_snake_case)]

use std::collections::HashMap;

use async_graphql::{Enum, Request, Response, SimpleObject};
use chessboard::ChessBoard;
use lazy_static::lazy_static;
use linera_sdk::base::{
    Amount, ChainId, ContractAbi, MessageId, Owner, PublicKey, ServiceAbi, TimeDelta, Timestamp,
};
use piece::{Color, Piece};
use serde::{Deserialize, Serialize};
pub struct ChessAbi;
use linera_sdk::graphql::GraphQLMutationRoot;
pub mod moves;
use moves::*;
pub mod chessboard;
pub mod piece;
pub mod square;
use square::Square;
use thiserror::Error;
use zobrist::{
    update_castle_hash, update_ep_hash, update_piece_hash, update_side_hash, BLACK_TO_MOVE,
    CASTLE_KEYS, EP_KEYS, PIECE_KEYS,
};
pub mod magic;
pub mod prng;
pub mod zobrist;

impl ContractAbi for ChessAbi {
    type Operation = Operation;
    type Response = ChessResponse;
}

impl ServiceAbi for ChessAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct InstantiationArgument {
    /// The `Owner` controlling player 1 and 2, respectively.
    pub players: [Owner; 2],
    /// The initial time each player has to think about their turns.
    pub start_time: TimeDelta,
    /// The duration that is added to the clock after each turn.
    pub increment: TimeDelta,
    /// The maximum time that is allowed to pass between a block proposal and validation.
    /// This should be long enough to confirm a block, but short enough for the block timestamp
    /// to accurately reflect the current time.
    pub block_delay: TimeDelta,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize, SimpleObject)]
pub struct PlayerStats {
    pub player_id: String,
    pub games_played: u32,
    pub wins: u32,
    pub losses: u32,
    pub draws: u32,
    pub win_rate: f32,
}

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChessResponse {
    Ok,
    Err(ChessError),
}

#[derive(Debug, Deserialize, Serialize, Clone, GraphQLMutationRoot)]
#[serde(rename_all = "camelCase")]
pub enum Operation {
    NewGame {
        player: Owner,
    },
    MakeMove {
        from: String,
        to: String,
        piece: String,
    },
    CapturePiece {
        // square which captures
        from: String,
        // square which is being captured
        to: String,
        // piece which captures
        piece: String,
        // piece which is being captured
        captured_piece: String,
    },
    PawnPromotion {
        from: String,
        to: String,
        piece: String,
        promoted_piece: String,
    },
    Resign,
    /// Start the game on a temporary chain
    StartGame {
        /// The `Owner` controlling player 1 and 2, respectively.
        players: [PublicKey; 2],
        /// A small amount to cover the fees for the game, on the new chain
        amount: Amount,
        /// Game's total time (~15 mins)
        match_time: TimeDelta,
    },
}
//     /// The `Owner` controlling player 1 and 2, respectively.
//     pub players: [Owner; 2],
//     /// The initial time each player has to think about their turns.
//     pub start_time: TimeDelta,
//

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum Message {
    Start {
        players: [PublicKey; 2],
        /// Represents the total amount of time for each player
        timer: TimeDelta,
    },
}

/// The IDs of a temporary chain for a single game.
#[derive(Clone, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize, SimpleObject)]
pub struct GameChain {
    /// The ID of the `OpenChain` message that created the chain.
    pub message_id: MessageId,
    /// The ID of the temporary game chain itself.
    pub chain_id: ChainId,
}

#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize, Enum)]
#[serde(rename_all = "PascalCase")]
pub enum GameState {
    #[default]
    InPlay,
    Checkmate,
    Stalemate,
    Draw,
    Resign,
}

#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize, SimpleObject)]
pub struct PlayerTime {
    pub white: TimeDelta,
    pub black: TimeDelta,
}

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

/// A type alias for a bitboard
pub type Bitboard = u64;

/// A struct to represent a Clock
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, SimpleObject)]
pub struct Clock {
    pub time_left: [TimeDelta; 2],
    pub current_turn_start: Timestamp,
    pub block_delay: TimeDelta,
}

impl Clock {
    /// Initializes the clock.
    pub fn new(block_time: Timestamp, arg: &InstantiationArgument) -> Self {
        let total_time = TimeDelta::from_secs(900); // 15 mins
        Self {
            time_left: [total_time, total_time],
            // increment: arg.increment, // todo!(increment is not required at the moment)
            current_turn_start: block_time,
            block_delay: arg.block_delay,
        }
    }

    /// Records a player making a move in the current block.
    pub fn make_move(&mut self, block_time: Timestamp, player: Color) {
        let duration = block_time.delta_since(self.current_turn_start);
        let i = player.index();
        self.time_left[i] = self.time_left[i].saturating_sub(duration);
        self.current_turn_start = block_time;
    }

    /// Returns the time left for a given player.
    pub fn time_left_for_player(&self) -> PlayerTime {
        PlayerTime {
            white: self.time_left[Color::White.index()],
            black: self.time_left[Color::Black.index()],
        }
    }

    /// Returns whether the given player has timed out.
    pub fn timed_out(&self, block_time: Timestamp, player: Color) -> bool {
        self.time_left[player.index()] < block_time.delta_since(self.current_turn_start)
    }
}

#[derive(Clone, Default, Debug, Serialize, Deserialize, SimpleObject)]
pub struct Move {
    white: Option<String>,
    black: Option<String>,
}

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

/// The state of a Chess game.
#[derive(Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct Game {
    /// The current state of the board.
    pub board: ChessBoard,
    /// The player whose turn it is. If the game has ended, this player loses.
    pub active: Color,
    /// Moves Table
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
}

impl Game {
    /// A function to create a new game using defaults
    pub fn new(&self) -> Self {
        Game {
            board: ChessBoard::new(),
            active: Color::White,
            moves: vec![],
            captured_pieces: vec![],
            state: GameState::InPlay,
            current_hash: self.compute_zobrist_hash(),
            position_count: HashMap::new(),
            halfmove_clock: 0,
            fullmove_count: 1,
        }
    }

    /// A function to create a new game using FEN
    pub fn with_fen(&self, fen: &str) -> Self {
        Game {
            board: ChessBoard::with_fen(fen),
            active: Color::White,
            moves: vec![],
            captured_pieces: vec![],
            state: GameState::InPlay,
            current_hash: self.compute_zobrist_hash(),
            position_count: HashMap::new(),
            halfmove_clock: 0,
            fullmove_count: 1,
        }
    }

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
    }
}
