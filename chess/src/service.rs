#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use self::state::Chess;
use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use chess::{Clock, Color, Move, Operation, Piece};
use linera_sdk::{
    base::{Owner, WithServiceAbi},
    graphql::GraphQLMutationRoot,
    views::{View, ViewStorageContext},
    Service, ServiceRuntime,
};

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
        let state = Chess::load(ViewStorageContext::from(runtime.key_value_store()))
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

#[Object]
impl ChessService {
    async fn board(&self) -> String {
        self.state.board.get().board.to_fen()
    }
    async fn player_turn(&self) -> &Color {
        &self.state.board.get().active
    }
    async fn player(&self, player: Owner) -> Color {
        let color = self.state.owners.get(&player).await.unwrap();
        color.unwrap()
    }
    async fn get_moves(&self) -> &Vec<Move> {
        &self.state.board.get().moves
    }
    async fn captured_pieces(&self) -> &Vec<Piece> {
        &self.state.board.get().board.captured_pieces
    }
    async fn timer(&self) -> &Clock {
        &self.state.clock.get()
    }
    async fn get_opponent(&self, player: Owner) -> Option<Owner> {
        log::info!("Getting opponent for player {:?}", player);
        self.state.opponent(player)
    }
}
