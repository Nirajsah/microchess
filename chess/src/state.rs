use chess::{
    clock::Clock,
    leaderboard::{Leaderboard, LeaderboardManager},
    matches::MatchId,
    notifications::Notification,
    player::{MatchHistory, PlayerHash, PlayerProfile, Players},
    tournament::{
        utils::{Match, Participants, SingleElimParticipants, SwissParticipants},
        Tournament, TournamentFormat,
    },
    GameWrapper,
};
use linera_sdk::{
    linera_base_types::{AccountOwner, ChainId},
    views::{
        linera_views::{self},
        MapView, RegisterView, RootView,
    },
    ViewStorageContext,
};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct ChessState {
    /* App Chain */
    /// Lobby to hold players for potential match
    pub lobby: RegisterView<Vec<PlayerHash>>, // will be updated to include ranks.
    /// Count the number of games played on microchess, only for app_chain
    pub game_count: RegisterView<u64>,
    /// Holds ongoing game data, only for app_chain
    pub matches: MapView<MatchId, Players>,
    // LeaderBoard Manager only for app_chain (max 10)
    pub leaderboard_manager: RegisterView<Option<LeaderboardManager>>,
    // LeaderBoard (max 10)
    pub leaderboard: RegisterView<Vec<Leaderboard>>,
    /// for app_chain
    pub tournaments: MapView<String, Tournament>, // we don't need this
    /// tournament matches

    /* Player Chain */
    /// Holds Newly created game chain, only for player_chain
    pub game_chain: RegisterView<Option<ChainId>>,
    /// PlayerProfile only for player_chain
    pub profile: RegisterView<Option<PlayerProfile>>,
    /// Friendly game token stored only on user's chain
    pub game_token: RegisterView<String>,
    /// notifications for player
    pub notifications: RegisterView<Vec<Notification>>,
    /// for user_chain
    pub my_tournaments: RegisterView<Vec<Tournament>>, // holds all the tournaments the player has created, DRAFT or PUBLISHED

    /* Tournament Chain */
    pub tournament: RegisterView<Option<Tournament>>,
    pub participants: RegisterView<Option<Participants>>,
    /// store player metadata for match making in tournaments
    pub players_data: MapView<AccountOwner, PlayerHash>,
    pub tournament_matches: MapView<String, Vec<Match>>,

    /* Game Chain */
    /// The current game state
    pub board: RegisterView<GameWrapper>,
    /// The current game clock
    pub clock: RegisterView<Clock>,

    /// Used in app_chain, player_chain and subscriber_chain(pws)
    /// App chains and subscribers stores all the match history, but player_chain stores owner matches
    pub match_history: RegisterView<Vec<MatchHistory>>,
    /// for subscribers
    pub all_tournaments: RegisterView<Vec<Tournament>>, // we don't be needing this, Once we setup pws to update supabase from tournament_chains
    // on app_chain
    // pub participants: MapView<String, Participants>,
    /*
    /// Player Stats
    pub stats: RegisterView<PlayerProfile>,
    // store the betting amount on temp chain.
    // pub bet_amount: RegisterView<Amount>,
    */
    /// for subscribers only
    pub tournament_chains: RegisterView<Vec<ChainId>>,
}

#[allow(dead_code)]
impl ChessState {
    /// Responsible for saving tournament in state as well as creating an empty participants list
    pub async fn save_tournament(&mut self, tournament: Tournament) {
        self.tournament.set(Some(tournament.clone()));

        let max_players = tournament.max_players as usize;
        let participants: Participants = match tournament.tournament_format {
            TournamentFormat::Swiss => Participants::Swiss(SwissParticipants {
                players: Vec::with_capacity(max_players),
                max_players,
            }),
            TournamentFormat::SingleElim => Participants::SingleElim(SingleElimParticipants {
                players: Vec::with_capacity(max_players),
                max_players,
            }),
            _ => todo!(),
        };
        self.participants.set(Some(participants))
    }

    /// Used on tournament_chain for starting a tournament
    pub async fn start_tournament_and_persist(
        &mut self,
        _tournament_id: &str,
    ) -> Option<Vec<Match>> {
        todo!()
        // let Some(participants) = self.participants.get(tournament_id).await.ok().flatten() else {
        //     return None;
        // };

        // let matches = match participants {
        //     Participants::Swiss(p) => p.generate_pairings(tournament_id, 1),
        //     Participants::SingleElim(p) => p.generate_pairings(tournament_id, 1),
        // };

        // let _ = self
        //     .tournament_matches
        //     .insert(tournament_id, matches.clone());

        // Some(matches)
    }
}
