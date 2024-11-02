use std::collections::BTreeSet;

use chess::{piece::Color, Clock, Game, GameChain, PlayerStats};
use linera_sdk::{
    base::{Amount, Owner, PublicKey},
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
    /// LeaderBoard (max 10)
    pub leaderboard: RegisterView<Vec<PlayerStats>>,
    /// Player Stats
    pub stats: RegisterView<PlayerStats>,
    /// Temporary chains for individual games, by player.
    pub game_chains: MapView<PublicKey, BTreeSet<GameChain>>,
    /// store the betting amount on temp chain.
    pub bet_amount: RegisterView<Amount>,
}

#[allow(dead_code)]
impl Chess {
    /// A function to get all the players
    pub fn get_players(&self) -> &Vec<Owner> {
        self.players.get()
    }
    /// A function to add player to a game
    pub fn add_player(&mut self, player: Owner) {
        self.players.get_mut().push(player);
    }
    /// A function to validate both players are differnt owners
    pub fn opponent(&self, player: Owner) -> Option<Owner> {
        let players = self.players.get();

        if players.len() != 2 {
            log::warn!("Expected 2 players, found {}", players.len());
            return None;
        }

        players.iter().find(|&p| *p != player).cloned()
    }
    /// A function to create and update player stats
    pub fn player_stats(&mut self, player_stats: PlayerStats) {
        self.stats.set(player_stats);
    }

    /// A function to get the leaderboard
    pub fn get_leaderboard(&self) -> Vec<PlayerStats> {
        // need to have a logic to update the leaderboard status with players winning most games
        self.leaderboard.get().to_vec()
    }

    /// A function to get the stats of the last player in leaderboard
    pub fn bottom_player_stats(&self) -> PlayerStats {
        self.get_leaderboard()
            .last()
            .expect("Last player not found, leaderboard is empty")
            .clone()
    }

    /// A function to add the player stats to the leaderboard
    pub fn add_player_leaderboard(&mut self, player: PlayerStats) {
        let leaderboard = self.leaderboard.get_mut();
        if leaderboard.len() > 10 {
            leaderboard.pop();
        }
        leaderboard.push(player);
    }
}
