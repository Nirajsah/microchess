use chess::{
    matches::{MatchId, MatchMetaData, MatchType},
    player::{MatchHistory, PlayerHash, Players},
    tournament::{Tournament, TournamentInput, TournamentUpdate},
    GameChain,
};
use linera_sdk::linera_base_types::{AccountOwner, TimeDelta};
use serde::{Deserialize, Serialize};

pub mod tournament;

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    PublishTournament {
        value: Tournament,
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
    UpdateTournament {
        tournament_id: String,
        update: TournamentUpdate,
    },
    HostTournament {
        value: Tournament,
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
        game_chain_data: GameChain,
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
}
