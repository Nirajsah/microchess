#![cfg_attr(target_arch = "wasm32", no_main)]
#![allow(unused_imports)]

mod state;

use chess::{ChessBoard, Clock, Color, Game, InstantiationArgument, Operation, Piece};
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
                if players.len() == 1 {
                    let game = Game::new();
                    self.state.add_player(player);
                    self.state.board.set(game);
                    log::info!("Adding new Player and strating game: {:?}", player);
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

                log::info!(
                    "Capture piece: {} {} {} {}",
                    from,
                    to,
                    piece,
                    captured_piece
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

                let success = self.state.board.get_mut().board.capture_piece(
                    &from,
                    &to,
                    piece,
                    captured_piece,
                );

                if success {
                    self.state.board.get_mut().switch_player_turn();
                    let moves = ChessBoard::create_capture_string(&from, &to);
                    self.state.board.get_mut().create_move_string(active, moves);
                    self.state
                        .board
                        .get_mut()
                        .board
                        .captured_pieces
                        .push(captured_piece);

                    self.runtime
                        .assert_before(block_time.saturating_add(clock.block_delay));
                    // self.state
                    //     .clock
                    //     .get_mut()
                    //     .make_move(block_time, active_player);
                } else {
                    log::info!("Invalid move");
                }
            }

            Operation::MakeMove { from, to, piece } => {
                let block_time = self.runtime.system_time();
                let clock = self.state.clock.get_mut();

                self.runtime
                    .assert_before(block_time.saturating_add(clock.block_delay));

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

                if piece.starts_with("w") && active_player != Color::White {
                    return;
                }
                if piece.starts_with("b") && active_player != Color::Black {
                    return;
                }

                let piece = ChessBoard::get_piece(&piece).expect("Invalid piece");

                let success = self
                    .state
                    .board
                    .get_mut()
                    .board
                    .select_piece_to_move(&from, &to, piece);

                match success {
                    Ok(true) => {
                        self.state.board.get_mut().switch_player_turn();
                        self.state.board.get_mut().create_move_string(active, to);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        // self.state
                        //     .clock
                        //     .get_mut()
                        //     .make_move(block_time, active_player);
                    }
                    _ => {
                        log::info!("Invalid move");
                    }
                }
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}
