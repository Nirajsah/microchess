use std::collections::HashMap;

use chess::{
    clock::Clock,
    leaderboard::{Leaderboard, LeaderboardManager},
    matches::{MatchId, RankedMatchEntry, WagerLobby},
    notifications::Notification,
    player::{MatchHistory, PlayerHash, PlayerProfile, Players},
    tournament::{
        utils::{
            Match, Participants, SingleElimParticipants, SwissParticipants, TParticipants,
            TournamentRound,
        },
        Tournament, TournamentFormat,
    },
    ChainType, GameWrapper,
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
    pub chain_type: RegisterView<ChainType>, // we don't need this
    /* App Chain */
    /// Lobby to hold players for potential match with timestamp for expiry
    pub lobby: RegisterView<Vec<RankedMatchEntry>>,
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
    pub tournament_rounds: RegisterView<Vec<TournamentRound>>,

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
    /// for app_chain and subscribers only
    pub tournament_chains: RegisterView<Vec<ChainId>>,
    pub wager_lobbies: MapView<MatchId, WagerLobby>,
}

#[allow(dead_code)]
impl ChessState {
    /// Responsible for saving tournament in state as well as creating an empty participants list
    pub async fn save_tournament(&mut self, tournament: Tournament) {
        self.tournament.set(Some(tournament.clone()));
        self.chain_type.set(ChainType::TournamentChain);

        let max_players = tournament.max_players as usize;
        let participants: Participants = match tournament.tournament_format {
            TournamentFormat::Swiss => Participants::Swiss(SwissParticipants {
                players: Vec::with_capacity(max_players),
                participants: HashMap::new(),
                tournament_id: tournament.tournament_id,
                max_players,
            }),
            TournamentFormat::SingleElim => Participants::SingleElim(SingleElimParticipants {
                players: Vec::with_capacity(max_players),
                participants: HashMap::new(),
                tournament_id: tournament.tournament_id,
                max_players,
            }),
            _ => todo!(),
        };
        self.participants.set(Some(participants))
    }

    pub fn generate_round_pairings(
        &self,
        round: u8,
    ) -> Option<(Vec<Match>, HashMap<String, PlayerHash>)> {
        if let Some(participants) = self.participants.get() {
            match participants {
                Participants::Swiss(p) => {
                    let matches = p.generate_pairings(round);
                    Some((matches, p.participants.clone()))
                }
                Participants::SingleElim(p) => {
                    let matches = p.generate_pairings(round);
                    Some((matches, p.participants.clone()))
                }
            }
        } else {
            None
        }
    }
}
