extern crate chess_rs;
use chess::{ChessBoard, Game};
use linera_sdk::views::{linera_views, RegisterView, RootView, ViewStorageContext};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]

pub struct Chess {
    pub board: RegisterView<Game>,
}

#[allow(dead_code)]
impl Chess {
    pub fn new(&mut self) {
        let board: ChessBoard = ChessBoard::new();
        self.board.set(Game { board });
    }
}
