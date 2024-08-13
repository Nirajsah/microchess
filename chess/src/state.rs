use chess::{Color, Game};
use linera_sdk::{
    base::Owner,
    views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext},
};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]

pub struct Chess {
    /// Players of the game
    pub owners: MapView<Owner, Color>,
    /// The current game state
    pub board: RegisterView<Game>,
}
