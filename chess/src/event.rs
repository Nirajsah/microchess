use chess::{
    leaderboard::Leaderboard,
    player::{MatchHistory, Player, PlayerHash},
    tournament::Tournament,
};
use linera_sdk::linera_base_types::{AccountOwner, ChainId};
use serde::{Deserialize, Serialize};

use crate::ChessContract;

#[derive(Debug, Deserialize, Serialize)]
pub enum Event {
    GameCount {
        value: u64,
    },
    Leaderboard {
        leaderboard: Vec<Leaderboard>,
    },
    MatchHistory {
        history: MatchHistory,
    },
    Tournament {
        value: Box<Tournament>,
    },
    TournamentRegistration {
        tournament_id: String,
        owner: AccountOwner,
        player: PlayerHash,
    },
    TournamentWithDraw {
        tournament_id: String,
        owner: AccountOwner,
    },
    TournamentChain {
        chain: ChainId,
    },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum EventType {
    GameCount,
    Leaderboard,
    MatchHistory,
}

impl ChessContract {
    pub fn on_event_host_tournament(&mut self, tournament: Tournament) {
        self.state.all_tournaments.get_mut().push(tournament);
    }

    pub fn on_event_tournament_chain(&mut self, chain: ChainId) {
        self.state.tournament_chains.get_mut().push(chain);
    }

    pub async fn on_event_tournament_registration(
        &mut self,
        _tournament_id: String,
        _owner: AccountOwner,
        _player: PlayerHash,
    ) {
        todo!()
        // let Some(mut participants) = self
        //     .state
        //     .participants
        //     .get(&tournament_id)
        //     .await
        //     .ok()
        //     .flatten()
        // else {
        //     return;
        // };

        // participants.try_add_player(owner);

        // self.state
        //     .participants
        //     .insert(&tournament_id, participants)
        //     .ok();

        // self.state.t_players.insert(&owner, player).ok();
    }

    pub async fn on_event_tournament_withdraw(
        &mut self,
        _tournament_id: String,
        _owner: AccountOwner,
    ) {
        todo!()
        // let Some(mut participants) = self
        //     .state
        //     .participants
        //     .get(&tournament_id)
        //     .await
        //     .ok()
        //     .flatten()
        // else {
        //     return;
        // };

        // participants.remove_player(owner);

        // self.state
        //     .participants
        //     .insert(&tournament_id, participants)
        //     .ok();

        // self.state.t_players.remove(&owner).ok();
    }
}
