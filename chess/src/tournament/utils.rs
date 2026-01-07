use std::collections::HashMap;

use async_graphql::SimpleObject;
use base64::{engine::general_purpose, Engine};
use linera_sdk::linera_base_types::AccountOwner;
use serde::{Deserialize, Serialize};

use crate::player::{PlayerHash, PlayerInfo};

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
    fn has_played(&self, opponent_id: AccountOwner) -> bool;
    fn add_opponent(&mut self, opponent_id: AccountOwner);
    fn add_points(&mut self, points: f32);
}

impl TournamentParticipant for SwissPlayer {
    fn new(player_id: AccountOwner) -> Self {
        Self {
            player_id,
            score: 0,
            opponents: vec![],
        }
    }
    fn has_played(&self, opponent_id: AccountOwner) -> bool {
        self.opponents.contains(&opponent_id)
    }

    fn add_opponent(&mut self, opponent_id: AccountOwner) {
        self.opponents.push(opponent_id);
    }

    fn add_points(&mut self, score: f32) {
        self.score += score;
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

    fn has_played(&self, opponent_id: AccountOwner) -> bool {
        self.opponents.contains(&opponent_id)
    }

    fn add_opponent(&mut self, opponent_id: AccountOwner) {
        self.opponents.push(opponent_id);
    }

    fn add_points(&mut self, score: f32) {
        self.score += score;
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct SwissParticipants {
    pub players: Vec<SwissPlayer>,
    pub participants: HashMap<String, PlayerInfo>,
    pub tournament_id: String,
    pub max_players: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct SingleElimParticipants {
    pub players: Vec<SingleElimPlayer>,
    pub participants: HashMap<String, PlayerInfo>,
    pub tournament_id: String,
    pub max_players: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum Participants {
    Swiss(SwissParticipants),
    SingleElim(SingleElimParticipants),
}

impl Participants {
    pub fn encode(&self) -> String {
        let bytes = postcard::to_allocvec(self).expect("postcard serialization failed");
        general_purpose::STANDARD.encode(&bytes)
    }
    pub fn decode(encoded: String) -> Self {
        let bytes = general_purpose::STANDARD
            .decode(encoded)
            .expect("invalid base64 input");

        postcard::from_bytes::<Participants>(&bytes).expect("postcard deserialization failed")
    }

    pub fn try_add_player(&mut self, player: AccountOwner, player_hash: PlayerHash) -> bool {
        match self {
            Self::Swiss(p) => p.try_add_player(player, player_hash),
            Self::SingleElim(p) => p.try_add_player(player, player_hash),
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
    fn try_add_player(&mut self, id: AccountOwner, player_hash: PlayerHash) -> bool;
    fn remove_player(&mut self, id: AccountOwner);
    fn generate_pairings(&self, round: u8) -> Vec<Match>;
    fn generate_first_round_pairings(&self) -> Vec<Match>;
}

impl TParticipants for SwissParticipants {
    fn try_add_player(&mut self, id: AccountOwner, player_hash: PlayerHash) -> bool {
        // Check for duplicate player first
        if self.players.iter().any(|p| p.player_id == id) {
            return false;
        }

        if self.players.len() >= self.max_players {
            return false;
        }

        let player = SwissPlayer::new(id);
        self.players.push(player);
        self.participants
            .insert(id.to_string(), player_hash.decode().info());
        true
    }

    fn remove_player(&mut self, id: AccountOwner) {
        self.players.retain(|p| p.player_id != id);
    }

    ///generate pairing is a pure function of player state to generate matches, the round number only selects the pairing strategy.
    fn generate_pairings(&self, round: u8) -> Vec<Match> {
        if round == 1 {
            return self.generate_first_round_pairings();
        }

        let mut swiss_players = self.players.clone();
        swiss_players.sort_by(|a, b| a.player_id.cmp(&b.player_id));

        let mut matches = Vec::new();
        let mut match_count = 1;

        //     // Handle odd number of players - assign bye to lowest rated unpaired player
        //     let needs_bye = sorted_players.len() % 2 == 1;
        //     let mut bye_player = None;

        for i in (0..swiss_players.len()).step_by(2) {
            let p1 = &swiss_players[i];
            let p2 = &swiss_players[i + 1];

            matches.push(Match {
                match_id: match_count,
                tournament_id: self.tournament_id.clone(),
                round,
                player_a: p1.player_id,
                player_b: p2.player_id,
                result: None,
            });

            match_count += 1;
        }

        matches
    }

    // fn generate_pairings(&mut self, round: u8) -> Vec<Match> {
    //

    //     // Sort by points (descending), then by player_id for tiebreaking
    //     let mut sorted_players = self.players.clone();
    //     sorted_players.sort_by(|a, b| {
    //         b.points
    //             .partial_cmp(&a.points)
    //             .unwrap_or(std::cmp::Ordering::Equal)
    //             .then_with(|| a.player_id.cmp(&b.player_id))
    //     });

    //     let mut matches = Vec::new();
    //     let mut paired = HashSet::new();
    //     let mut match_count = 1;

    //     // Handle odd number of players - assign bye to lowest rated unpaired player
    //     let needs_bye = sorted_players.len() % 2 == 1;
    //     let mut bye_player = None;

    //     if needs_bye {
    //         // Find lowest ranked player who hasn't had a bye
    //         for player in sorted_players.iter().rev() {
    //             if !player.has_played(0) {
    //                 // 0 represents bye
    //                 bye_player = Some(player.player_id);
    //                 break;
    //             }
    //         }

    //         // If all players had bye, give it to lowest ranked
    //         if bye_player.is_none() {
    //             bye_player = Some(sorted_players.last().unwrap().player_id);
    //         }

    //         paired.insert(bye_player.unwrap());

    //         matches.push(Match {
    //             match_id: match_count,
    //             tournament_id: self.tournament_id.clone(),
    //             round,
    //             player_a: bye_player.unwrap(),
    //             player_b: None,
    //             result: None,
    //         });

    //         match_count += 1;
    //     }

    //     // Swiss pairing with fold-down algorithm
    //     let mut i = 0;
    //     while i < sorted_players.len() {
    //         let p1_id = sorted_players[i].player_id;

    //         if paired.contains(&p1_id) {
    //             i += 1;
    //             continue;
    //         }

    //         let mut opponent_found = false;

    //         // Try to find opponent in same score group first
    //         for j in (i + 1)..sorted_players.len() {
    //             let p2_id = sorted_players[j].player_id;

    //             if paired.contains(&p2_id) {
    //                 continue;
    //             }

    //             // Check if they haven't played before
    //             if !sorted_players[i].has_played(p2_id) {
    //                 matches.push(Match {
    //                     match_id: match_count,
    //                     tournament_id: self.tournament_id.clone(),
    //                     round,
    //                     player_a: p1_id,
    //                     player_b: Some(p2_id),
    //                     result: None,
    //                 });

    //                 paired.insert(p1_id);
    //                 paired.insert(p2_id);
    //                 match_count += 1;
    //                 opponent_found = true;
    //                 break;
    //             }
    //         }

    //         // If no valid opponent in same bracket, allow repeat pairing (last resort)
    //         if !opponent_found {
    //             for j in (i + 1)..sorted_players.len() {
    //                 let p2_id = sorted_players[j].player_id;

    //                 if !paired.contains(&p2_id) {
    //                     matches.push(Match {
    //                         match_id: match_count,
    //                         tournament_id: self.tournament_id.clone(),
    //                         round,
    //                         player_a: p1_id,
    //                         player_b: Some(p2_id),
    //                         result: None,
    //                     });

    //                     paired.insert(p1_id);
    //                     paired.insert(p2_id);
    //                     match_count += 1;
    //                     break;
    //                 }
    //             }
    //         }

    //         i += 1;
    //     }

    //     matches
    // }

    fn generate_first_round_pairings(&self) -> Vec<Match> {
        let mut players = self.players.clone();
        players.sort_by_key(|p| p.player_id);

        let mut matches = Vec::new();
        let mut match_count = 1;

        // Handle odd number - give bye to last player
        let pair_count = players.len() / 2;

        for i in 0..pair_count {
            matches.push(Match {
                match_id: match_count,
                tournament_id: self.tournament_id.clone(),
                round: 1,
                player_a: players[i].player_id,
                player_b: players[players.len() - 1 - i].player_id,
                result: None,
            });
            match_count += 1;
        }

        // Add bye for odd player count
        if players.len() % 2 == 1 {
            let middle = players.len() / 2;
            matches.push(Match {
                match_id: match_count,
                tournament_id: self.tournament_id.clone(),
                round: 1,
                player_a: players[middle].player_id,
                player_b: None,
                result: None,
            });
        }

        matches
    }

    // Call this after recording match results
    // fn record_result(&mut self, match_result: &Match, winner: Option<u32>) {
    //     if let Some(p2) = match_result.player_b {
    //         // Regular match
    //         let p1_idx = self
    //             .players
    //             .iter()
    //             .position(|p| p.player_id == match_result.player_a)
    //             .unwrap();
    //         let p2_idx = self.players.iter().position(|p| p.player_id == p2).unwrap();

    //         self.players[p1_idx].add_opponent(p2);
    //         self.players[p2_idx].add_opponent(match_result.player_a);

    //         match winner {
    //             Some(w) if w == match_result.player_a => {
    //                 self.players[p1_idx].add_points(1.0);
    //             }
    //             Some(w) if w == p2 => {
    //                 self.players[p2_idx].add_points(1.0);
    //             }
    //             _ => {
    //                 // Draw
    //                 self.players[p1_idx].add_points(0.5);
    //                 self.players[p2_idx].add_points(0.5);
    //             }
    //         }
    //     } else {
    //         // Bye - player gets a point
    //         let p1_idx = self
    //             .players
    //             .iter()
    //             .position(|p| p.player_id == match_result.player_a)
    //             .unwrap();
    //         self.players[p1_idx].add_opponent(0); // 0 represents bye
    //         self.players[p1_idx].add_points(1.0);
    //     }
    // }
}

impl TParticipants for SingleElimParticipants {
    fn generate_pairings(&self, _round: u8) -> Vec<Match> {
        todo!()
    }

    fn remove_player(&mut self, _id: AccountOwner) {
        todo!()
    }
    fn try_add_player(&mut self, id: AccountOwner, player_hash: PlayerHash) -> bool {
        // Check for duplicate player first
        if self.players.iter().any(|p| p.player_id == id) {
            return false;
        }

        if self.players.len() >= self.max_players {
            return false;
        }

        let player = SingleElimPlayer::new(id);
        self.players.push(player);
        self.participants
            .insert(id.to_string(), player_hash.decode().info());
        true
    }

    fn generate_first_round_pairings(&self) -> Vec<Match> {
        todo!()
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Match {
    match_id: u8,
    tournament_id: String,
    round: u8,
    player_a: AccountOwner,
    player_b: AccountOwner,
    result: Option<AccountOwner>,
}
