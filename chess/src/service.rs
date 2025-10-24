#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use chess::{GameChain, Operation};
use linera_sdk::{
    abi::WithServiceAbi, graphql::GraphQLMutationRoot, linera_base_types::AccountOwner,
    views::View, Service, ServiceRuntime,
};
use serde::{Deserialize, Serialize};

use crate::state::ChessState;

#[derive(Clone)]
pub struct ChessService {
    state: Arc<ChessState>,
    runtime: Arc<ServiceRuntime<ChessService>>,
}

linera_sdk::service!(ChessService);

impl WithServiceAbi for ChessService {
    type Abi = chess::ChessAbi;
}

impl Service for ChessService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = ChessState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ChessService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Request) -> Response {
        let schema = Schema::build(
            self.clone(),
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish();
        schema.execute(query).await
    }
}

#[derive(Deserialize, Serialize, SimpleObject)]
struct GameData {
    fen: String,            // FEN
    color: String,          // players color
    opponent: AccountOwner, // opponent player id
    game_state: String,     // State of the Game, Play, StaleMate or CheckMate
    winner: Option<AccountOwner>,
}

#[Object]
impl ChessService {
    async fn game_data(&self, player: AccountOwner) -> GameData {
        let game = self.state.board.get();
        let color = game.get_color_by_account(&player).unwrap();
        let fen = game.to_fen();
        let opponent = game.players[color.opposite().index()].unwrap();
        let game_state = game.state.to_string();
        let winner = game.winner;

        GameData {
            fen,
            color: color.to_string(),
            opponent,
            game_state,
            winner,
        }
    }

    async fn game_chain(&self) -> &GameChain {
        self.state.game_chain.get()
    }

    async fn is_game_chain(&self) -> bool {
        *self.state.game_flag.get()
    }
    /*
    async fn captured_pieces(&self) -> &Vec<Piece> {
        &self.state.board.get().captured_pieces
    }
    async fn timer(&self) -> &Clock {
        &self.state.clock.get()
    }
    async fn time_left(&self) -> PlayerTime {
        self.state.clock.get().time_left_for_player()
    }
    async fn get_leaderboard(&self) -> Vec<PlayerStats> {
        self.state.get_leaderboard()
    }
    */
}
