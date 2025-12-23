use async_graphql::{SimpleObject, Union};
use base64::{engine::general_purpose, Engine};
use linera_sdk::linera_base_types::AccountOwner;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, PartialEq)]
pub struct SwissPlayer {
    player_id: AccountOwner,
    score: u8, // starts at 0
    opponents: Vec<AccountOwner>,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, PartialEq)]
pub struct SingleElimPlayer {
    player_id: AccountOwner,
    score: u8, // starts at 0
    opponents: Vec<AccountOwner>,
}

pub trait TournamentParticipant: std::fmt::Debug {
    fn new(player_id: AccountOwner) -> Self;
}

impl TournamentParticipant for SwissPlayer {
    fn new(player_id: AccountOwner) -> Self {
        Self {
            player_id,
            score: 0,
            opponents: vec![],
        }
    }
}

impl TournamentParticipant for SingleElimPlayer {
    fn new(player_id: AccountOwner) -> Self {
        Self {
            player_id,
            score: 0,
            opponents: vec![],
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, PartialEq)]
pub struct SwissParticipants {
    pub players: Vec<SwissPlayer>,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, PartialEq)]
pub struct SingleElimParticipants {
    pub players: Vec<SingleElimPlayer>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Union, PartialEq)]
pub enum Participants {
    Swiss(SwissParticipants),
    SingleElim(SingleElimParticipants),
}

impl Participants {
    pub fn encode(&self) -> String {
        let bytes = bincode::serialize(self).unwrap(); // Serialize full enum
        general_purpose::STANDARD.encode(&bytes)
    }

    pub fn decode(data: String) -> Self {
        let bytes = general_purpose::STANDARD.decode(data).unwrap();
        let participants: Participants = bincode::deserialize(&bytes).unwrap();
        participants
    }

    pub fn try_add_player(&mut self, player: AccountOwner) -> bool {
        match self {
            Self::Swiss(p) => p.try_add_player(player),
            Self::SingleElim(p) => p.try_add_player(player),
        }
    }

    pub fn remove_player(&mut self, player: AccountOwner) {
        match self {
            Self::Swiss(p) => p.remove_player(player),
            Self::SingleElim(p) => p.remove_player(player),
        }
    }
}

pub trait TParticipants {
    fn try_add_player(&mut self, id: AccountOwner) -> bool;
    fn remove_player(&mut self, id: AccountOwner);
    fn generate_pairings(&self, tournament_id: &str, round: u8);
}

impl TParticipants for SwissParticipants {
    fn try_add_player(&mut self, id: AccountOwner) -> bool {
        // Check for duplicate player first
        if self.players.iter().any(|p| p.player_id == id) {
            return false;
        }

        if self.players.len() >= self.players.capacity() {
            return false;
        }

        let player = SwissPlayer::new(id);
        self.players.push(player);
        true
    }

    fn remove_player(&mut self, id: AccountOwner) {
        self.players.retain(|p| p.player_id != id);
    }

    /// generate pairing is a pure function of player state to generate matches, the round number only selects the pairing strategy.
    fn generate_pairings(&self, tournament_id: &str, round: u8) {
        let mut swiss_players = self.players.clone();

        swiss_players.sort_by(|a, b| a.player_id.cmp(&b.player_id));

        let mut matches = Vec::new();

        for i in (0..swiss_players.len()).step_by(2) {
            let p1 = &swiss_players[i];
            let p2 = &swiss_players[i + 1];

            matches.push(Match {
                tournament_id: tournament_id.to_string(),
                round,
                player_a: p1.player_id,
                player_b: p2.player_id,
                result: None,
            });
        }
    }
}

impl TParticipants for SingleElimParticipants {
    fn generate_pairings(&self, _tournament_id: &str, _round: u8) {
        todo!()
    }

    fn remove_player(&mut self, _id: AccountOwner) {
        todo!()
    }
    fn try_add_player(&mut self, id: AccountOwner) -> bool {
        // Check for duplicate player first
        if self.players.iter().any(|p| p.player_id == id) {
            return false;
        }

        if self.players.len() >= 256 {
            return false;
        }

        let player = SingleElimPlayer::new(id);
        self.players.push(player);
        true
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
struct Match {
    tournament_id: String,
    round: u8,
    player_a: AccountOwner,
    player_b: AccountOwner,
    result: Option<AccountOwner>,
}
