use chess::{piece::Color, Clock, Game};
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
    /// The current game clock
    pub clock: RegisterView<Clock>,
    /// The current game players
    pub players: RegisterView<Vec<Owner>>,
}

#[allow(dead_code)]
impl Chess {
    pub fn get_players(&self) -> &Vec<Owner> {
        self.players.get()
    }
    pub fn add_player(&mut self, player: Owner) {
        self.players.get_mut().push(player);
    }
    pub fn opponent(&self, player: Owner) -> Option<Owner> {
        log::info!("Player: {:?}", player);
        let players = self.players.get();

        if players.len() != 2 {
            log::warn!("Expected 2 players, found {}", players.len());
            return None;
        }

        players.iter().find(|&p| *p != player).cloned()
    }
}
