#![cfg_attr(target_arch = "wasm32", no_main)]
#![allow(unused_imports)]

mod state;

use chess::{Color, Game, InstantiationArgument, Operation, Piece};
use linera_sdk::{
    base::{TimeDelta, WithContractAbi},
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
        let players_colors = vec![
            (argument.players[0], Color::White),
            (argument.players[1], Color::Black),
        ];

        for (player, color) in players_colors {
            self.state.owners.insert(&player, color).unwrap();
        }
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        let block_time = self.runtime.system_time();
        match operation {
            Operation::NewGame => {
                let game = Game::new();
                self.state.board.set(game);
            }
            Operation::MakeMove { from, to, piece } => {
                let active = self.state.board.get().active_player();
                let owner = self.runtime.authenticated_signer();
                log::info!("Called from{:?} block_time: {:?}", owner, block_time);

                let piece = match piece.as_str() {
                    "wP" => Piece::WhitePawn,
                    "wN" => Piece::WhiteKnight,
                    "wB" => Piece::WhiteBishop,
                    "wR" => Piece::WhiteRook,
                    "wQ" => Piece::WhiteQueen,
                    "bP" => Piece::BlackPawn,
                    "bN" => Piece::BlackKnight,
                    "bB" => Piece::BlackBishop,
                    "bR" => Piece::BlackRook,
                    "bQ" => Piece::BlackQueen,
                    _ => Piece::WhitePawn,
                };
                // assert_eq!(owner.unwrap(), "Only the active player can make a move.");

                let success = self
                    .state
                    .board
                    .get_mut()
                    .board
                    .select_piece_move(&from, &to, piece);

                if success {
                    self.state.board.get_mut().switch_player_turn();
                } else {
                    log::info!("Invalid move");
                }

                // clock.make_move(block_time, active);
                // self.state.board.get_mut().board;

                // self.state.board.get_mut().board;
                // .move_piece(13, 23, bitboard);
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}
