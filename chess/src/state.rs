use chess::{Clock, Color, Game};
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
        // let mut new_player = self.players.get();
        // new_player.push(player);
        self.players.get_mut().push(player);
    }
    pub fn opponent(&self, player: Owner) -> Option<Owner> {
        log::info!("Player: {:?}", player);
        let players = self.get_players();
        if players.len() != 2 {
            return None;
        }
        if players[0] == player {
            log::info!("Player: {:?}", players[1]);
            Some(players[1])
        } else {
            log::info!("Player: {:?}", players[0]);
            Some(players[0])
        }
    }
}
