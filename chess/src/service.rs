#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use self::state::Chess;
use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use chess::{
    piece::{Color, Piece},
    Clock, GameState, Move, Operation, PlayerStats, PlayerTime,
};

use linera_sdk::{
    base::{Owner, WithServiceAbi},
    graphql::GraphQLMutationRoot,
    views::{View, ViewStorageContext},
    Service, ServiceRuntime,
};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct ChessService {
    state: Arc<Chess>,
}

linera_sdk::service!(ChessService);

impl WithServiceAbi for ChessService {
    type Abi = chess::ChessAbi;
}

impl Service for ChessService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = Chess::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ChessService {
            state: Arc::new(state),
        }
    }

    async fn handle_query(&self, query: Request) -> Response {
        let schema =
            Schema::build(self.clone(), Operation::mutation_root(), EmptySubscription).finish();
        schema.execute(query).await
    }
}

#[derive(Deserialize, Serialize, SimpleObject)]
struct GameData {
    board: String,         // ChessBoard
    player_turn: Color,    // player's color to move
    player: Color,         // players color
    moves: Vec<Move>,      // moves made till now
    opponent: Owner,       // opponent player id(Owner)
    game_state: GameState, // State of the Game, Play, StaleMate or CheckMate
}

#[Object]
impl ChessService {
    async fn game_data(&self, player: Owner) -> GameData {
        let game_data = GameData {
            board: self.state.board.get().board.to_fen(),
            player_turn: self.state.board.get().active,
            player: self.state.owners.get(&player).await.unwrap().unwrap(),
            moves: self.state.board.get().moves.clone(),
            opponent: self.state.opponent(player).unwrap(),
            game_state: self.state.board.get().state,
        };
        game_data
    }
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
}
