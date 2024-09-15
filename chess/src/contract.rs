#![cfg_attr(target_arch = "wasm32", no_main)]
#![allow(unused_imports)]

mod state;

use std::str::FromStr;

use chess::{
    chessboard::ChessBoard,
    piece::{Color, Piece},
    square::Square,
    CastleType, ChessError, Clock, Game, GameState, InstantiationArgument, MoveType, Operation,
};
use linera_sdk::{
    base::{Owner, TimeDelta, WithContractAbi},
    util::BlockingWait,
    views::{RootView, View, ViewStorageContext},
    Contract, ContractRuntime,
};
use log;

use self::state::Chess;

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
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::NewGame { player } => {
                let players = self.state.get_players();
                if players.len() == 2 {
                    return;
                }
                if players.len() == 1 {
                    if player == players[0] {
                        return;
                    }
                    let game = Game::new();
                    // let game = Game::with_fen(
                    //     "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -",
                    // );
                    self.state.add_player(player);
                    self.state.board.set(game);
                } else {
                    log::info!("No players found: Adding new Player: {:?}", player);
                    self.state.add_player(player);
                }
            }

            Operation::CapturePiece {
                from,
                to,
                piece,
                captured_piece,
            } => {
                // check if the game is still ongoing
                match self.state.board.get().state {
                    GameState::Checkmate => {
                        log::info!("Game is over: Checkmate");
                        return;
                    }
                    GameState::Stalemate => {
                        log::info!("Game is over: Stalemate");
                        return;
                    }
                    _ => {}
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

                if piece.starts_with("w")
                    && active_player != Color::White
                    && captured_piece.starts_with("w")
                {
                    return;
                }
                if piece.starts_with("b")
                    && active_player != Color::Black
                    && captured_piece.starts_with("b")
                {
                    return;
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

                        self.state.board.get_mut().is_checkmate(); // check if the current player is checkmate, i.e if white makes a move after switch turn black is active player and we check if active player is in checkmate
                    }
                    Err(e) => {
                        log::info!("Invalid move: {:?}", e);
                    }
                }
            }

            Operation::MakeMove { from, to, piece } => {
                // check if the game is still ongoing
                match self.state.board.get().state {
                    GameState::Checkmate => {
                        log::info!("Game is over: Checkmate");
                        return;
                    }
                    GameState::Stalemate => {
                        log::info!("Game is over: Stalemate");
                        return;
                    }
                    _ => {}
                }

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
                    return;
                }

                // Early return if the piece is not owned by the active player
                if piece.starts_with("b") && active_player != Color::Black {
                    return;
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
                        if from_sq == Square::E1 && to_sq == Square::G1 {
                            m = MoveType::Castle(CastleType::KingSide);
                        } else if from_sq == Square::E1 && to_sq == Square::C1 {
                            m = MoveType::Castle(CastleType::QueenSide);
                        }
                    }
                    Piece::BlackKing => {
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
                        self.state.board.get_mut().switch_player_turn();
                        self.state.board.get_mut().create_move_string(active, to);

                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        self.state.board.get_mut().is_checkmate();
                    }
                    Err(e) => {
                        log::info!("Invalid move: {:?}", e);
                    }
                }
            }
            Operation::PawnPromotion {
                from,
                to,
                piece,
                promotion,
            } => {
                let from_sq = Square::from_str(&from).expect("Invalid square");
                let to_sq = Square::from_str(&to).expect("Invalid square");
                let p = ChessBoard::get_piece(&piece).expect("Invalid piece");

                if p != Piece::WhitePawn && p != Piece::BlackPawn {
                    return;
                }

                if to_sq / 8 != 0 && to_sq / 8 != 7 {
                    return;
                }

                let promoting_to = Piece::from_str(&promotion).expect("Invalid piece");

                let m: MoveType = MoveType::Promotion(promoting_to);

                self.state.board.get_mut().make_move(from_sq, to_sq, p, m);
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}
