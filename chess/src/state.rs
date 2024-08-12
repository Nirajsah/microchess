extern crate chess_rs;
use chess::Game;
use linera_sdk::{
    base::Owner,
    views::{linera_views, RegisterView, RootView, ViewStorageContext},
};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]

pub struct Chess {
    /// Players of the game
    pub owners: RegisterView<Option<[Owner; 2]>>,
    /// The current game state
    pub board: RegisterView<Game>,
}
