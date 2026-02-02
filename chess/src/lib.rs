#![allow(non_snake_case)]

use async_graphql::{Request, Response, SimpleObject};
use chess_lib::{
    game::game::{Game, GameState},
    pieces::Color,
    ChessError,
};
use player::{PlayerHash, PlayerInfo, PlayerProfile};
use serde::{Deserialize, Serialize};
use std::ops::{Deref, DerefMut};
pub struct ChessAbi;
pub mod clock;
pub mod leaderboard;
pub mod matches;
pub mod notifications;
pub mod player;
pub mod tournament;
use matches::{MatchId, MatchType};

use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, TimeDelta},
};
use tournament::{TournamentInput, TournamentUpdate};

use crate::matches::WagerToken;

impl ContractAbi for ChessAbi {
    type Operation = Operation;
    type Response = ChessResponse;
}

impl ServiceAbi for ChessAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct InstantiationArgument {
    /// The initial time each player has to think about their turns.
    pub start_time: TimeDelta,
    /// The duration that is added to the clock after each turn.
    pub increment: TimeDelta,
    /// The maximum time that is allowed to pass between a block proposal and validation.
    /// This should be long enough to confirm a block, but short enough for the block timestamp
    /// to accurately reflect the current time.
    pub block_delay: TimeDelta,
}

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChessResponse {
    Ok,
    Err(ChessError),
}

#[derive(Debug, Deserialize, Serialize, Clone, GraphQLMutationRoot)]
#[serde(rename_all = "camelCase")]
pub enum Operation {
    MarkAllRead, // mark all notification read
    // setup operations
    HostTournament {
        value: Box<TournamentInput>,
    },
    TournamentRegistration {
        tournament_id: String,
        tournament_chain: String,
    },
    TournamentWithDraw {
        tournament_id: String,
    },
    UpdateTournament {
        tournament_id: String,
        update: Box<TournamentUpdate>,
    },
    UpdateTournamentLocal {
        tournament_id: String,
        update: Box<TournamentUpdate>,
    },
    NewGame,
    FrGameHash {
        token: String,
    },
    CreateWager {
        token: WagerToken, // Encoded WagerToken
    },
    JoinWager {
        token: WagerToken, // Same encoded WagerToken from creator
        player: PlayerHash,
    },
    // match operations
    MakeMove {
        from: String,
        to: String,
        piece: String,
    },
    PawnPromotion {
        from: String,
        to: String,
        piece: String,
        promoted_piece: String,
    },
    Resign,
    ClaimForfeit, // Claim win when opponent times out (white never makes first move)
    DeleteChainMetadata,
    // basic user operations
    Subscribe,
    Profile {
        name: String,
    },
    /// Organizer calls this on tournament_chain to start a round after funding
    StartRound {
        tournament_id: String,
    },
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct LastMove {
    pub from: String,
    pub to: String,
}

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct GameWrapper {
    pub initalized: bool,
    inner: Game,
    pub players: [Option<AccountOwner>; 2],
    pub winner: Option<AccountOwner>,
    pub moves_string: Vec<String>,
    pub last_move: Option<LastMove>,
    pub match_id: Option<MatchId>,
    pub players_profile: [Option<PlayerProfile>; 2],
    pub match_type: Option<MatchType>,
}

impl GameWrapper {
    pub fn new(
        white: PlayerProfile,
        black: PlayerProfile,
        match_id: MatchId,
        match_type: MatchType,
    ) -> Self {
        Self {
            inner: Game::new(),
            initalized: true,
            players: [Some(white.id), Some(black.id)],
            winner: None,
            moves_string: Vec::with_capacity(256),
            last_move: None,
            match_id: Some(match_id),
            players_profile: [Some(white), Some(black)],
            match_type: Some(match_type),
        }
    }

    pub fn add_move(&mut self, from: String, to: String) {
        self.last_move = Some(LastMove { from, to });
    }

    pub fn get_profile_info_by_color(&self, color: Color) -> Option<PlayerInfo> {
        self.players_profile[color.index()]
            .as_ref()
            .map(|profile| profile.info())
    }

    pub fn get_color_by_account(&self, account: &AccountOwner) -> Option<Color> {
        self.players
            .iter()
            .position(|p| p.as_ref() == Some(account))
            .map(|i| if i == 0 { Color::White } else { Color::Black })
    }

    pub fn handle_resign(&mut self, opponent: Color) {
        if self.inner.state == GameState::Resign {
            return;
        };
        self.inner.state = GameState::Resign;
        let winner = self.players[opponent.index()];
        self.winner = winner;
    }
}

impl Deref for GameWrapper {
    type Target = Game;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl DerefMut for GameWrapper {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum ChainType {
    #[default]
    PersonalChain,
    TournamentChain,
    FriendlyMatchChain,
    GameChain,
}
