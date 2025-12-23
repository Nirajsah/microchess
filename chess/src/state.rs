use chess::{
    clock::Clock,
    leaderboard::{Leaderboard, LeaderboardManager},
    matches::MatchId,
    player::{MatchHistory, PlayerHash, PlayerProfile, Players},
    tournament::{
        utils::{Participants, SingleElimParticipants, SwissParticipants, TParticipants},
        {Tournament, TournamentFormat},
    },
    GameChain, GameWrapper,
};
use linera_sdk::{
    linera_base_types::AccountOwner,
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
    pub tournaments: MapView<String, Tournament>,

    /* Player Chain */
    /// Holds Newly created game chain, only for player_chain
    pub game_chain: RegisterView<Option<GameChain>>,
    /// PlayerProfile only for player_chain
    pub profile: RegisterView<Option<PlayerProfile>>,
    /// Friendly game token stored only on user's chain
    pub game_token: RegisterView<String>,
    /// for user_chain
    pub my_tournaments: RegisterView<Vec<Tournament>>,
    pub tournament_list: RegisterView<Vec<String>>,

    /* Game Chain */
    /// The current game state
    pub board: RegisterView<GameWrapper>,
    /// The current game clock
    pub clock: RegisterView<Clock>,

    /// Used in app_chain, player_chain and subscriber_chain(pws)
    /// App chains and subscribers stores all the match history, but player_chain stores owner matches
    pub match_history: RegisterView<Vec<MatchHistory>>,
    /// for subscribers
    pub all_tournaments: RegisterView<Vec<Tournament>>,
    /// on app_chain
    pub t_players: MapView<AccountOwner, PlayerHash>, // store player metadata for match making in tournaments
    pub participants: MapView<String, Participants>,
    /*
    /// Player Stats
    pub stats: RegisterView<PlayerProfile>,
    // store the betting amount on temp chain.
    // pub bet_amount: RegisterView<Amount>,
    */
}

#[allow(dead_code)]
impl ChessState {
    /// Responsible for saving tournament in state as well as creating an empty participants list
    pub async fn save_tournament(&mut self, tournament: Tournament) {
        let max_players = tournament.max_players;
        let tournament_id = tournament.tournament_id.clone();
        let _ = self.tournaments.insert(&tournament_id, tournament.clone());

        let participants: Participants = match tournament.tournament_format {
            TournamentFormat::Swiss => Participants::Swiss(SwissParticipants {
                players: Vec::with_capacity(max_players as usize),
            }),
            TournamentFormat::SingleElim => Participants::SingleElim(SingleElimParticipants {
                players: Vec::with_capacity(max_players as usize),
            }),
            _ => todo!(),
        };
        self.participants
            .insert(&tournament_id, participants)
            .expect("failed to add participants");
    }

    pub async fn start_tournament(&self, tournament_id: &str) {
        let Some(participants) = self.participants.get(tournament_id).await.ok().flatten() else {
            return;
        };

        match participants {
            Participants::Swiss(p) => p.generate_pairings(tournament_id, 1),
            Participants::SingleElim(p) => p.generate_pairings(tournament_id, 1),
        };
    }
}
