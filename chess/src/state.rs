use async_graphql::{ComplexObject, SimpleObject};
use chess::{
    playerprofile::{MatchId, PlayerProfile, Players},
    Clock, GameChain, GameWrapper, Player,
};
use linera_sdk::{
    views::{
        linera_views::{self},
        MapView, RegisterView, RootView,
    },
    ViewStorageContext,
};

#[derive(RootView, SimpleObject)]
#[graphql(complex)]
#[view(context = ViewStorageContext)]
pub struct ChessState {
    /// The current game state
    pub board: RegisterView<GameWrapper>,
    /// The current game clock
    pub clock: RegisterView<Clock>,
    /// Flag, only for game_chain
    pub match_id: RegisterView<Option<MatchId>>,
    /// Holds Newly created game chain, only for player_chain
    pub game_chain: RegisterView<Option<GameChain>>,
    /// PlayerProfile only for player_chain
    pub profile: RegisterView<Option<PlayerProfile>>,
    /// Lobby to hold players for potential match
    pub lobby: RegisterView<Vec<Player>>, // will be updated to include ranks.
    /// Count the number of games played on microchess, only for app_chain
    pub game_count: RegisterView<u64>,
    /// Friendly game token stored only on user's chain
    pub game_token: RegisterView<String>,
    /// Holds ongoing game data, only for app_chain
    pub matches: MapView<MatchId, Players>,
    // LeaderBoard (max 10)
    // pub leaderboard: RegisterView<Vec<PlayerProfile>>,
    /*
    /// Player Stats
    pub stats: RegisterView<PlayerProfile>,
    // store the betting amount on temp chain.
    // pub bet_amount: RegisterView<Amount>,
    */
}

#[ComplexObject]
impl ChessState {}
/* impl Chess {
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
} */
///// A function to create and update player stats
//pub fn player_stats(&mut self, player_stats: PlayerStats) {
//    self.stats.set(player_stats);
//}
//
///// A function to get the leaderboard
//pub fn get_leaderboard(&self) -> Vec<PlayerStats> {
//    // need to have a logic to update the leaderboard status with players winning most games
//    self.leaderboard.get().to_vec()
//}
//
///// A function to get the stats of the last player in leaderboard
//pub fn bottom_player_stats(&self) -> PlayerStats {
//    self.get_leaderboard()
//        .last()
//        .expect("Last player not found, leaderboard is empty")
//        .clone()
//}
//
///// A function to add the player stats to the leaderboard
//pub fn add_player_leaderboard(&mut self, player: PlayerStats) {
//    let leaderboard = self.leaderboard.get_mut();
//    if leaderboard.len() > 10 {
//        leaderboard.pop();
//    }
//    leaderboard.push(player);
//}
// }
