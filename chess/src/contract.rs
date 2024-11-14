#![cfg_attr(target_arch = "wasm32", no_main)]
#![allow(unused_imports)]

mod state;

use std::str::FromStr;

use self::state::Chess;
use chess::{
    chessboard::ChessBoard,
    piece::{Color, Piece},
    square::Square,
    zobrist::PIECE_KEYS,
    CastleType, ChessError, ChessResponse, Clock, Game, GameChain, GameState,
    InstantiationArgument, MoveType, Operation, PlayerStats,
};
use linera_sdk::{
    base::{
        Account, Amount, ApplicationId, ApplicationPermissions, ChainId, Destination, Owner,
        PublicKey, TimeDelta, WithContractAbi,
    },
    util::BlockingWait,
    views::{RootView, View, ViewStorageContext},
    Contract, ContractRuntime,
};
use log;

#[allow(dead_code)]
pub struct ChessContract {
    state: Chess,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(ChessContract);

impl WithContractAbi for ChessContract {
    type Abi = chess::ChessAbi;
}

impl Contract for ChessContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = Chess::load(ViewStorageContext::from(runtime.key_value_store()))
            .await
            .expect("Failed to load state");
        ChessContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
        self.state
            .clock
            .set(Clock::new(self.runtime.system_time(), &argument));

        let players_colors = vec![
            (argument.players[0], Color::White),
            (argument.players[1], Color::Black),
        ];

        for (player, color) in players_colors {
            self.state.owners.insert(&player, color).unwrap();
        }

        for (i, row) in PIECE_KEYS.iter().enumerate() {
            for (j, key) in row.iter().enumerate() {
                log::info!("PIECE_KEYS[{}][{}] = {:x}", i, j, key);
            }
        }
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> ChessResponse {
        match operation {
            Operation::NewGame { player } => {
                let players = self.state.get_players();
                if players.len() == 2 {
                    return ChessResponse::Err(ChessError::InvalidRequest);
                }
                if players.len() == 1 {
                    if player == players[0] {
                        return ChessResponse::Err(ChessError::InvalidRequest);
                    }
                    let game = self.state.board.get().new();
                    // let game = self.state.board.get().with_fen("8/7P/7P/8/8/8/8/7r w - - 0 1");
                    self.state.add_player(player);
                    self.state.board.set(game);
                    return ChessResponse::Ok;
                } else {
                    self.state.add_player(player);
                    return ChessResponse::Ok;
                }
            }

            Operation::CapturePiece {
                from,
                to,
                piece,
                captured_piece,
            } => {
                // check if the game is still ongoing
                self.is_game_over();

                let block_time = self.runtime.system_time();
                let clock = self.state.clock.get_mut();
                let owner = self.runtime.authenticated_signer().unwrap();
                let active_player = self.state.board.get().active;
                let active = self
                    .state
                    .owners
                    .get(&owner)
                    .await
                    .expect("Failed to get active player")
                    .expect("Active player not found");
                assert_eq!(
                    active_player, active,
                    "Only the active player can make a move."
                );

                if piece.starts_with("w")
                    && active_player != Color::White
                    && captured_piece.starts_with("w")
                {
                    return ChessResponse::Err(ChessError::InvalidCapture);
                }
                if piece.starts_with("b")
                    && active_player != Color::Black
                    && captured_piece.starts_with("b")
                {
                    return ChessResponse::Err(ChessError::InvalidCapture);
                }

                let piece = ChessBoard::get_piece(&piece).expect("Invalid piece");
                let captured_piece = ChessBoard::get_piece(&captured_piece).expect("Invalid piece");
                let from_sq = Square::from_str(&from).expect("Invalid square");
                let to_sq = Square::from_str(&to).expect("Invalid square");
                let m: MoveType = MoveType::Capture(captured_piece);

                let success = self
                    .state
                    .board
                    .get_mut()
                    .make_move(from_sq, to_sq, piece, m);

                match success {
                    Ok(_) => {
                        self.state.board.get_mut().switch_player_turn();
                        let moves = ChessBoard::create_capture_string(&from, &to);
                        self.state.board.get_mut().create_move_string(active, moves);

                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));
                        clock.make_move(block_time, active_player);

                        // check for threefold repetition and 50 Move rule, update the game state
                        if self.state.board.get_mut().check_threefold_repetition()
                            || self.state.board.get().check_50_move_rule()
                        {
                            self.state.board.get_mut().state = GameState::Draw;
                        }

                        // check if the current player is checkmate, i.e if white makes a move after switch turn black is active player and we check if active player is in checkmate
                        if self.state.board.get_mut().is_checkmate() {
                            // returns false, if not checkmate
                            self.state.board.get_mut().state = GameState::Checkmate;
                        };

                        ChessResponse::Ok
                    }
                    Err(_) => panic!("Operation Failed"),
                }
            }

            Operation::MakeMove { from, to, piece } => {
                // check if the game is still ongoing
                self.is_game_over();

                let owner = self.runtime.authenticated_signer().unwrap();
                let active_player = self.state.board.get().active;
                let active = self
                    .state
                    .owners
                    .get(&owner)
                    .await
                    .expect("Failed to get active player")
                    .expect("Active player not found");
                assert_eq!(
                    active_player, active,
                    "Only the active player can make a move."
                );

                // Early return if the piece is not owned by the active player
                if piece.starts_with("w") && active_player != Color::White {
                    return ChessResponse::Err(ChessError::InvalidMove);
                }

                // Early return if the piece is not owned by the active player
                if piece.starts_with("b") && active_player != Color::Black {
                    return ChessResponse::Err(ChessError::InvalidMove);
                }

                let p = ChessBoard::get_piece(&piece).expect("Invalid piece");
                let from_sq = Square::from_str(&from).expect("Invalid square");
                let to_sq = Square::from_str(&to).expect("Invalid square");
                let mut m: MoveType = MoveType::Move;

                if self.state.board.get().board.en_passant & (1u64 << to_sq as usize) != 0
                    && piece.ends_with("P")
                {
                    m = MoveType::EnPassant;
                }

                match p {
                    Piece::WhiteKing => {
                        // if the player is in check, return
                        if self.state.board.get().board.in_check(active_player) {
                            return ChessResponse::Err(ChessError::InvalidMove);
                        }

                        if from_sq == Square::E1 && to_sq == Square::G1 {
                            m = MoveType::Castle(CastleType::KingSide);
                        } else if from_sq == Square::E1 && to_sq == Square::C1 {
                            m = MoveType::Castle(CastleType::QueenSide);
                        }
                    }
                    Piece::BlackKing => {
                        // if the player is in check, return
                        if self.state.board.get().board.in_check(active_player) {
                            return ChessResponse::Err(ChessError::InvalidMove);
                        }

                        if from_sq == Square::E8 && to_sq == Square::G8 {
                            m = MoveType::Castle(CastleType::KingSide);
                        } else if from_sq == Square::E8 && to_sq == Square::C8 {
                            m = MoveType::Castle(CastleType::QueenSide);
                        }
                    }
                    _ => {}
                }

                let clock = self.state.clock.get_mut();
                let block_time = self.runtime.system_time();

                let success = self.state.board.get_mut().make_move(from_sq, to_sq, p, m);

                match success {
                    Ok(_) => {
                        log::info!("Move successful");
                        self.state.board.get_mut().switch_player_turn();
                        self.state.board.get_mut().create_move_string(active, to);

                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        // check for threefold repetition and 50 Move rule, update the game state
                        if self.state.board.get_mut().check_threefold_repetition()
                            || self.state.board.get().check_50_move_rule()
                        {
                            self.state.board.get_mut().state = GameState::Draw;
                        }

                        if self.state.board.get_mut().is_checkmate() {
                            // returns false, if not checkmate
                            self.state.board.get_mut().state = GameState::Checkmate;
                        };

                        ChessResponse::Ok
                    }
                    Err(_) => panic!("Operation Failed"),
                }
            }
            Operation::PawnPromotion {
                from,
                to,
                piece,
                promoted_piece,
            } => {
                // check if the game is still ongoing
                self.is_game_over();

                let from_sq = Square::from_str(&from).expect("Invalid square");
                let piece = Piece::from_str(&piece).expect("Invalid piece");

                if piece != Piece::WhitePawn && piece != Piece::BlackPawn {
                    return ChessResponse::Err(ChessError::InvalidPromotion);
                }

                if piece == Piece::WhitePawn {
                    if from_sq.rank() != 7 {
                        return ChessResponse::Err(ChessError::InvalidPromotion);
                    }
                } else if piece == Piece::BlackPawn {
                    if from_sq.rank() != 2 {
                        return ChessResponse::Err(ChessError::InvalidPromotion);
                    }
                }

                let block_time = self.runtime.system_time();

                let clock = self.state.clock.get_mut();
                let owner = self.runtime.authenticated_signer().unwrap();
                let active_player = self.state.board.get().active;
                let active = self
                    .state
                    .owners
                    .get(&owner)
                    .await
                    .expect("Failed to get active player")
                    .expect("Active player not found");
                assert_eq!(
                    active_player, active,
                    "Only the active player can make a move."
                );

                let to_sq = Square::from_str(&to).expect("Invalid square");
                let promoting_to = Piece::from_str(&promoted_piece).expect("Invalid piece");

                let success = self.state.board.get_mut().make_move(
                    from_sq,
                    to_sq,
                    piece,
                    MoveType::Promotion(promoting_to),
                );

                match success {
                    Ok(_) => {
                        self.state.board.get_mut().switch_player_turn();
                        self.state.board.get_mut().create_move_string(active, to);

                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        self.state.board.get_mut().is_checkmate();
                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        // check for threefold repetition and 50 Move rule, update the game state
                        if self.state.board.get_mut().check_threefold_repetition()
                            || self.state.board.get().check_50_move_rule()
                        {
                            self.state.board.get_mut().state = GameState::Draw;
                        }

                        if self.state.board.get_mut().is_checkmate() {
                            // returns false, if not checkmate
                            self.state.board.get_mut().state = GameState::Checkmate;
                        };

                        ChessResponse::Ok
                    }
                    Err(_) => panic!("Operation Failed"),
                }
            }
            Operation::Resign => {
                self.is_game_over();
                let owner = self.runtime.authenticated_signer().unwrap();
                let active_player = self.state.board.get().active;
                let active = self
                    .state
                    .owners
                    .get(&owner)
                    .await
                    .expect("Failed to get active player")
                    .expect("Active player not found");
                assert_eq!(
                    active_player, active,
                    "Only the active player can make a move."
                );

                self.handle_winner().await;

                self.state.board.get_mut().state = GameState::Resign;
                return ChessResponse::Ok;
            }
            Operation::StartGame {
                players,
                amount,
                match_time,
            } => self.start_game(players, amount, match_time).await,
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl ChessContract {
    pub fn is_game_over(&self) -> ChessResponse {
        match self.state.board.get().state {
            GameState::Checkmate => {
                return ChessResponse::Err(ChessError::InvalidRequest);
            }
            GameState::Stalemate => {
                return ChessResponse::Err(ChessError::InvalidRequest);
            }
            GameState::Draw => {
                return ChessResponse::Err(ChessError::InvalidRequest);
            }
            GameState::InPlay => {
                return ChessResponse::Ok;
            }
            GameState::Resign => return ChessResponse::Err(ChessError::InvalidRequest),
        }
    }

    /// Start a new game on new chain, requires two players and the amount to cover the chain fees
    /// (Todo!) Add the ability to bet on the game, requires optional betting amount
    pub async fn start_game(
        &self,
        players: [PublicKey; 2],
        amount: Amount,
        match_time: TimeDelta,
    ) -> ChessResponse {
        // assert_eq!(self.runtime.chain_id(), self.main_chain_id());
        // let ownership = ChainOwnership::multiple(
        //     [(players[0], 100), (players[1], 100)],
        //     100,
        //     TimeoutConfig::default(),
        // );
        // let app_id = self.runtime.application_id();
        // let permissions = ApplicationPermissions::new_single(app_id.forget_abi());
        // let (message_id, chain_id) = self.runtime.open_chain(ownership, permissions, fee_budget);
        // for public_key in &players {
        //     self.state
        //         .game_chains
        //         .get_mut_or_default(public_key)
        //         .await
        //         .unwrap()
        //         .insert(GameChain {
        //             message_id,
        //             chain_id,
        //         });
        // }
        // self.runtime.send_message(
        //     chain_id,
        //     Message::Start {
        //         players,
        //         board_size,
        //         timeouts: timeouts.unwrap_or_else(|| self.state.timeouts.get().clone()),
        //     },
        // );
        ChessResponse::Ok
    }

    /// Handles the winner stats, when a match is over, this function is called to update the
    /// leaderboard.
    /// Can only be update by the creation chain(Todo!)
    pub fn handle_match_over(&mut self, winner: PlayerStats) {
        let last_player = self.state.bottom_player_stats();
        if last_player.wins > winner.wins {
            return;
        }

        self.state.add_player_leaderboard(winner);
    }

    /// Handles the winner of the game, when a match is over
    pub async fn handle_winner(&mut self) {
        // self.send_reward_nft().await;
        // if players were betting on the game. send the amount to the winner(Todo!)
        // it will require punk records
    }
}
