use chess::{
    matches::{MatchId, MatchMetaData, MatchType},
    notifications::Notification,
    player::{MatchHistory, PlayerHash, Players},
    tournament::{Tournament, TournamentInput, TournamentUpdate},
};
use linera_sdk::linera_base_types::{AccountOwner, Amount, ChainId, TimeDelta};
use serde::{Deserialize, Serialize};

pub mod tournament;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Message {
    ProcessTournament {
        value: Box<Tournament>,
    },
    TournamentWithDraw {
        tournament_id: String,
        owner: AccountOwner,
    },
    TournamentRegister {
        tournament_id: String,
        owner: AccountOwner,
        player: PlayerHash,
    },
    HostTournament {
        value: Box<Tournament>,
    },
    // game_chain receiving data to start a new game
    Start {
        match_id: MatchId,
        players: Players,
        timer: TimeDelta,
        match_type: MatchType,
    },
    // app_chain receiving player to put in lobby or start a game.
    NewGameReq {
        player: PlayerHash,
    },
    // receiving game_chain data from the app_chain
    GameChainData {
        game_chain: ChainId,
    },

    FriendlyGameChainData {
        game_chain: ChainId,
        notification: Notification,
    },
    // app_chain receiving both players details to start a friendly match
    FriendlyGameReq {
        players: Players,
    },
    // MatchMetadata from the game_chain to the app_chain
    MatchEnd {
        metadata: MatchMetaData,
    },
    // app_chain sends points update to the players
    MatchUpdate {
        player_hash: PlayerHash,
        match_history: MatchHistory,
    },
    Notification {
        notification: Notification,
    },
    CreateWager {
        lobby_id: MatchId,
        creator: PlayerHash,
        amount: Amount,
    },
    JoinWager {
        lobby_id: MatchId,
        joiner: PlayerHash,
    },
}
