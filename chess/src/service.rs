#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use chess::{
    leaderboard::Leaderboard,
    playerprofile::{PlayerInfo, PlayerProfile},
    tournament::Tournament,
    GameChain, LastMove, MatchHistory, Operation, PlayersTime,
};
use linera_sdk::{
    abi::WithServiceAbi,
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, DataBlobHash, TimeDelta},
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

#[derive(Deserialize, Serialize, SimpleObject)]
struct TournamentParticipant {
    id: AccountOwner,
    player: PlayerInfo,
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

    async fn game_chain(&self) -> Option<GameChain> {
        if let Some(game_data) = self.state.game_chain.get() {
            let now = self.runtime.system_time();
            let expiry = game_data.timestamp.saturating_add(TimeDelta::from_secs(90)); // 1.30 secs MAX

            // If expired → return None
            if now < expiry {
                Some(game_data.clone())
            } else {
                None
            }
        } else {
            None
        }
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

    async fn friend_id(&self) -> &str {
        self.state.game_token.get()
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
        let moves: Vec<String> = postcard::from_bytes(&self.runtime.read_data_blob(hash)).unwrap();
        moves
    }

    async fn tournament(&self, id: String) -> Option<Tournament> {
        let data = self
            .state
            .tournaments
            .get(&id)
            .await
            .expect("failed to get data");

        data
    }

    async fn my_tournament(&self) -> &Vec<String> {
        self.state.my_tournament.get()
    }

    async fn all_tournaments(&self) -> &Vec<Tournament> {
        self.state.all_tournaments.get()
    }

    async fn participants(&self, tournament_id: String) -> Vec<TournamentParticipant> {
        let mut participants = Vec::new();

        let Some(player_ids) = self
            .state
            .participants
            .get(&tournament_id)
            .await
            .ok()
            .flatten()
        else {
            return participants;
        };

        for id in player_ids {
            let Some(p) = self.state.tournament_players.get(&id).await.ok().flatten() else {
                continue; // skip missing player instead of panicking
            };

            participants.push(TournamentParticipant {
                id,
                player: p.decode().info(),
            });
        }

        participants
    }
}
