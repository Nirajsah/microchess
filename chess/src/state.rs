use async_graphql::{ComplexObject, SimpleObject};
use chess::{
    leaderboard::{Leaderboard, LeaderboardManager},
    playerprofile::{PlayerHash, PlayerProfile, Players},
    tournament::Tournament,
    Clock, GameChain, GameWrapper, MatchHistory, MatchId,
};
use linera_sdk::{
    linera_base_types::AccountOwner,
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
    /// Holds Newly created game chain, only for player_chain
    pub game_chain: RegisterView<Option<GameChain>>,
    /// PlayerProfile only for player_chain
    pub profile: RegisterView<Option<PlayerProfile>>,
    /// Lobby to hold players for potential match
    pub lobby: RegisterView<Vec<PlayerHash>>, // will be updated to include ranks.
    /// Count the number of games played on microchess, only for app_chain
    pub game_count: RegisterView<u64>,
    /// Friendly game token stored only on user's chain
    pub game_token: RegisterView<String>,
    /// Holds ongoing game data, only for app_chain
    pub matches: MapView<MatchId, Players>,
    // LeaderBoard Manager only for app_chain (max 10)
    pub leaderboard_manager: RegisterView<Option<LeaderboardManager>>,
    // LeaderBoard (max 10)
    pub leaderboard: RegisterView<Vec<Leaderboard>>,
    /// Used in app_chain, player_chain and subscriber_chain(pws)
    /// App chains and subscribers stores all the match history, but player_chain stores owner matches
    pub match_history: RegisterView<Vec<MatchHistory>>,
    /// for app_chain
    pub tournaments: MapView<String, Tournament>,
    /// for subscribers
    pub all_tournaments: RegisterView<Vec<Tournament>>,
    /// for user_chain
    pub my_tournaments: RegisterView<Vec<Tournament>>,
    pub tournament_list: RegisterView<Vec<String>>,

    /// on app_chain
    pub tournament_players: MapView<AccountOwner, PlayerHash>,
    pub participants: MapView<String, Vec<AccountOwner>>,
    /*
    /// Player Stats
    pub stats: RegisterView<PlayerProfile>,
    // store the betting amount on temp chain.
    // pub bet_amount: RegisterView<Amount>,
    */
}

#[ComplexObject]
impl ChessState {}
