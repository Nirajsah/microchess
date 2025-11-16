use std::ops::Deref;

/**
 * TODO(When a match is over the points update will be based on game type, i.e., Standard, Bullet, Blitz...)
*/
use async_graphql::SimpleObject;
use base64::{engine::general_purpose, Engine};
use linera_sdk::linera_base_types::{AccountOwner, ChainId};
use serde::{Deserialize, Serialize};

use crate::leaderboard::Leaderboard;

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct PlayerProfile {
    pub id: AccountOwner,     // Player Rank (Default: Bronze)
    pub name: Option<String>, // player's name
    pub elo: u32,             // Total points the player has accumulated
    pub matches: u32,         // Total number of games played
    pub won: u32,             // Total number of games won
    pub lost: u32,            // Total number of games lost
    pub ath: u32,             // All time high
    pub chain_id: ChainId,
    pub player_hash: Option<PlayerHash>,
}

/// This struct is mainly used to display user profile to opponent player
#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct PlayerInfo {
    pub name: Option<String>,
    pub elo: u32,
    pub matches: u32,
    pub ath: u32,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct PlayerHash {
    value: String,
}

impl PlayerHash {
    pub fn decode(&self) -> PlayerProfile {
        let bytes = general_purpose::STANDARD.decode(&self.value).unwrap();
        let player: PlayerProfile = bincode::deserialize(&bytes).unwrap();

        player
    }
}

impl Deref for PlayerHash {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct Players {
    pub player_1: PlayerHash,
    pub player_2: PlayerHash,
}

impl Players {
    pub fn get_players(&self) -> (PlayerProfile, PlayerProfile) {
        (self.player_1.decode(), self.player_2.decode())
    }
}

impl PlayerProfile {
    // create a new profile
    pub fn new(chain_id: ChainId, id: AccountOwner, name: Option<String>) -> Self {
        Self {
            id,
            chain_id,
            name,
            elo: 0,
            matches: 0,
            won: 0,
            lost: 0,
            ath: 0,
            player_hash: None,
        }
    }

    pub fn hash(&self) -> Option<PlayerHash> {
        self.player_hash.clone()
    }

    pub fn encode(&mut self) -> Option<PlayerHash> {
        let bytes = bincode::serialize(&self).unwrap();
        let value = general_purpose::STANDARD.encode(bytes);

        self.player_hash = Some(PlayerHash { value });
        self.player_hash.clone()
    }

    pub fn decode(&self) -> Option<Self> {
        if let Some(hash) = self.player_hash.clone() {
            let bytes = general_purpose::STANDARD.decode(hash.value).unwrap();
            let player: Self = bincode::deserialize(&bytes).unwrap();

            Some(player)
        } else {
            None
        }
    }

    pub fn info(&self) -> PlayerInfo {
        PlayerInfo {
            name: self.name.clone(),
            elo: self.elo,
            matches: self.matches,
            ath: self.ath,
        }
    }

    pub fn to_leaderboard(&self) -> Leaderboard {
        Leaderboard {
            id: self.id,
            name: self.name.clone(),
            elo: self.elo,
            matches: self.matches,
            won: self.won,
            lost: self.lost,
        }
    }

    pub fn update(&mut self, new_hash: PlayerHash) {
        *self = new_hash.decode()
    }

    // When player loses
    pub fn sub(&mut self, elo_change: u32) {
        self.matches += 1;
        self.lost += 1;
        if self.elo >= elo_change {
            self.elo -= elo_change; // Decrease Elo
        } else {
            self.elo = 0;
        }
    }

    // When player wins
    pub fn add(&mut self, elo_change: u32) {
        self.matches += 1;
        self.won += 1;
        self.elo += elo_change;
        if self.elo > self.ath {
            self.ath = self.elo; // New all-time-high if beaten
        }
    }

    // When draw
    pub fn draw(&mut self) {
        self.matches += 1;
    }

    pub fn update_rating(&mut self, delta: i32, won: bool, lost: bool) {
        self.matches += 1;

        // Update win/loss counters
        if won {
            self.won += 1;
        } else if lost {
            self.lost += 1;
        }

        // Apply Elo change (can be positive or negative)
        let new_elo = (self.elo as i32 + delta).max(0) as u32; // Prevent negative elo
        self.elo = new_elo;

        // Update all-time high if beaten
        if self.elo > self.ath {
            self.ath = self.elo;
        }
    }
}
