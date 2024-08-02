#![cfg_attr(target_arch = "wasm32", no_main)]
#![allow(unused_imports)]

mod state;

use chess::{Operation, Piece};
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
    type InstantiationArgument = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = Chess::load(ViewStorageContext::from(runtime.key_value_store()))
            .await
            .expect("Failed to load state");
        ChessContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        let block_time = self.runtime.system_time();
        match operation {
            Operation::NewGame => {
                self.state.new();
            }
            Operation::MakeMove { from, to } => {
                let owner = self.runtime.authenticated_signer();
                log::info!("Called from{:?} block_time: {:?}", owner, block_time);
                let piece = Piece::WhitePawn;
                self.state
                    .board
                    .get_mut()
                    .select_piece_move(from, to, piece);

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
