extern crate chess_rs;
use chess::Board;
use linera_sdk::views::{linera_views, MapView, RootView, ViewStorageContext};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]

pub struct Chess {
    pub value: MapView<i32, Board>,
}
