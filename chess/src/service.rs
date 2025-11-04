#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use chess::{GameChain, Operation, PlayersTime};
use linera_sdk::{
    abi::WithServiceAbi,
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, TimeDelta},
    views::View,
    Service, ServiceRuntime,
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
    game_state: String,     // State of the Game, NotStarted, OnGoing, StaleMate or CheckMate
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

    async fn game_chain(&self) -> Option<GameChain> {
        let game_data = self.state.game_chain.get();

        let now = self.runtime.system_time();
        let expiry = game_data
            .created_at
            .saturating_add(TimeDelta::from_secs(300));

        // If expired → return None
        if now > expiry {
            None
        } else {
            Some(game_data.clone())
        }
    }

    async fn is_game_chain(&self) -> bool {
        *self.state.game_flag.get()
    }

    async fn mv_string(&self) -> &Vec<String> {
        &self.state.board.get().moves_string
    }

    async fn timer(&self) -> PlayersTime {
        let clock = self.state.clock.get();
        let board = self.state.board.get();
        let block_time = self.runtime.system_time();
        let active_player = board.active_player;

        // get correct and real time values for both the players
        clock.time_left_for_players(block_time, active_player)
    }

    async fn count(&self) -> &u64 {
        self.state.game_count.get()
    }

    async fn friend_id(&self) -> &str {
        self.state.game_token.get()
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
