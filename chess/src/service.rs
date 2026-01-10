#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use chess::{
    leaderboard::Leaderboard,
    matches::TimedToken,
    notifications::Notification,
    player::{MatchHistory, PlayerInfo, PlayerProfile, PlayersTime},
    tournament::{utils::Match, Tournament},
    ChainType, LastMove, Operation,
};
use linera_sdk::{
    abi::WithServiceAbi,
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, ChainId, DataBlobHash},
    views::View,
    Service, ServiceRuntime,
};
use serde::{Deserialize, Serialize};

use crate::state::ChessState;

#[derive(Clone)]
pub struct ChessService {
    state: Arc<ChessState>,
    runtime: Arc<ServiceRuntime<ChessService>>,
}

linera_sdk::service!(ChessService);

impl WithServiceAbi for ChessService {
    type Abi = chess::ChessAbi;
}

impl Service for ChessService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = ChessState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ChessService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Request) -> Response {
        let schema = Schema::build(
            self.clone(),
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish();
        schema.execute(query).await
    }
}

#[derive(Deserialize, Serialize, SimpleObject)]
struct GameData {
    fen: String,            // FEN
    color: String,          // players color
    opponent: AccountOwner, // opponent player id
    game_state: String,     // State of the Game, NotStarted, OnGoing, StaleMate or CheckMate
    winner: Option<AccountOwner>,
    last_move: Option<LastMove>,
}

#[Object]
impl ChessService {
    async fn game_data(&self, player: AccountOwner) -> GameData {
        let game = self.state.board.get();
        let color = game.get_color_by_account(&player).unwrap();
        let fen = game.to_fen();
        let opponent = game.players[color.opposite().index()].unwrap();
        let game_state = game.state.to_string();
        let winner = game.winner;
        let last_move = game.last_move.clone();

        GameData {
            fen,
            color: color.to_string(),
            opponent,
            game_state,
            winner,
            last_move,
        }
    }

    async fn game_chain(&self) -> &Option<ChainId> {
        self.state.game_chain.get()
    }

    async fn opponent_profile(&self, opponent: AccountOwner) -> Option<PlayerInfo> {
        let game = self.state.board.get();
        let color = game.get_color_by_account(&opponent).unwrap();
        self.state.board.get().get_profile_info_by_color(color)
    }

    async fn is_game_chain(&self) -> bool {
        self.state.board.get().match_id.is_some()
    }

    async fn mv_string(&self) -> &Vec<String> {
        &self.state.board.get().moves_string
    }

    async fn timer(&self) -> PlayersTime {
        let clock = self.state.clock.get();
        let board = self.state.board.get();
        let block_time = self.runtime.system_time();
        let active_player = board.active_player;

        // get correct and real time values for both the players
        clock.time_left_for_players(block_time, active_player)
    }

    async fn count(&self) -> &u64 {
        self.state.game_count.get()
    }

    // we need to encode the profile here, with timedToken
    async fn friend_id(&self) -> Option<String> {
        if let Some(profile) = self.state.profile.get() {
            let mut profile = profile.clone();
            let now = self.runtime.system_time();
            if let Some(hash) = profile.encode() {
                let token = TimedToken::new(now, hash).encode_token();
                return Some(token);
            } else {
                None
            }
        } else {
            None
        }
    }

    async fn leaderboard(&self) -> &Vec<Leaderboard> {
        self.state.leaderboard.get()
    }

    async fn profile(&self) -> Option<&PlayerProfile> {
        if let Some(profile) = self.state.profile.get() {
            Some(profile)
        } else {
            None
        }
    }

    async fn captured_pieces(&self) -> &Vec<String> {
        &self.state.board.get().captured_pieces
    }

    /// called by the user/player_chain
    async fn match_history_all(&self) -> &Vec<MatchHistory> {
        &self.state.match_history.get()
    }

    /// called by the subscriber chain to update the db
    async fn match_history_last(&self) -> Option<&MatchHistory> {
        self.state.match_history.get().last()
    }

    /// Read moves from datablob
    async fn read_moves(&self, hash: DataBlobHash) -> Vec<String> {
        postcard::from_bytes::<Vec<String>>(&self.runtime.read_data_blob(hash)).unwrap_or_default()
    }

    async fn my_tournaments(&self) -> Vec<Tournament> {
        if self.state.chain_type.get() == &ChainType::TournamentChain {
            if let Some(tournament) = self.state.tournament.get() {
                vec![tournament.clone()]
            } else {
                Vec::new()
            }
        } else {
            self.state.my_tournaments.get().clone()
        }
    }

    async fn my_tournament(&self, tournament_id: String) -> Option<&Tournament> {
        if self.state.chain_type.get() == &ChainType::TournamentChain {
            self.state.tournament.get().as_ref()
        } else {
            return self
                .state
                .my_tournaments
                .get()
                .iter()
                .find(|t| t.tournament_id.clone() == tournament_id);
        }
    }

    async fn tournament(&self) -> &Option<Tournament> {
        self.state.tournament.get()
    }

    async fn participants(&self) -> Option<String> {
        let p = self.state.participants.get();
        match p {
            Some(p) => Some(p.encode()),
            None => None,
        }
    }

    async fn tournament_matches(&self, id: String) -> Option<Vec<Match>> {
        let matches = self
            .state
            .tournament_matches
            .get(&id)
            .await
            .ok()
            .flatten()?;

        Some(matches)
    }

    async fn notifications(&self) -> &Vec<Notification> {
        self.state.notifications.get()
    }

    async fn notification_count(&self) -> usize {
        self.state
            .notifications
            .get()
            .iter()
            .filter(|n| n.read == false)
            .count()
    }

    async fn tournament_chains(&self) -> &Vec<ChainId> {
        self.state.tournament_chains.get()
    }
}
