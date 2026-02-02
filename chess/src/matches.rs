use async_graphql::{InputObject, SimpleObject};
use base64::{engine::general_purpose, Engine};
use linera_sdk::linera_base_types::{
    AccountOwner, Amount, ChainId, DataBlobHash, TimeDelta, Timestamp,
};
use serde::{Deserialize, Serialize};

use crate::player::{PlayerHash, Players};

#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum MatchType {
    Random,
    Friendly,
    Tournament(ChainId),
    FriendlyWager(Amount),
}

// match duration could be added
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MatchMetaData {
    pub match_id: MatchId,
    pub winner: AccountOwner,
    pub match_type: MatchType,
    pub blob_hash: DataBlobHash, // we only store moves in this, so we can replay the entire game
}

#[derive(Serialize, Deserialize, Debug, SimpleObject)]
pub struct MatchBlobData {
    pub moves: Vec<String>,
    pub outcome: String,
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug, SimpleObject, InputObject)]
pub struct MatchId {
    value: String,
}

impl MatchId {
    pub fn new(value: String) -> Self {
        MatchId { value }
    }

    pub fn encode_players(players: &Players) -> Self {
        let bytes = bincode::serialize(players).unwrap();
        let value = general_purpose::STANDARD.encode(bytes);

        MatchId { value }
    }

    pub fn decode_players(&self) -> Option<Players> {
        let bytes = general_purpose::STANDARD.decode(&self.value).unwrap();
        let players: Players = bincode::deserialize(&bytes).unwrap();

        Some(players)
    }
}

const TOKEN_TIME: u64 = 300; // 300 seconds = 5 minutes

// Friendly hash active for 5 minutes since creation
#[derive(Serialize, Deserialize, Debug, SimpleObject)]
pub struct TimedToken {
    player: PlayerHash,
    expires_at: Timestamp,
}

impl TimedToken {
    pub fn new(now: Timestamp, player: PlayerHash) -> Self {
        Self {
            player,
            expires_at: now.saturating_add(TimeDelta::from_secs(TOKEN_TIME)),
        }
    }

    // Encode the token into a base64 string
    pub fn encode_token(&self) -> String {
        let bytes = bincode::serialize(self).unwrap();
        general_purpose::STANDARD.encode(bytes)
    }

    // Decode the base64 string back into a token
    pub fn decode_token(encoded: &str, now: Timestamp) -> Option<PlayerHash> {
        let bytes = general_purpose::STANDARD.decode(encoded).ok()?;
        let timed_token: TimedToken = bincode::deserialize(&bytes).ok()?;

        if now <= timed_token.expires_at {
            Some(timed_token.player)
        } else {
            None
        }
    }
}

/// Time in seconds after which a ranked match entry expires
pub const RANKED_ENTRY_EXPIRY: u64 = 60; // 60 seconds

/// Entry for ranked matchmaking lobby with expiry timestamp
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RankedMatchEntry {
    pub player: PlayerHash,
    pub created_at: Timestamp,
}

impl RankedMatchEntry {
    pub fn new(player: PlayerHash, now: Timestamp) -> Self {
        Self {
            player,
            created_at: now,
        }
    }

    pub fn is_expired(&self, now: Timestamp) -> bool {
        now > self
            .created_at
            .saturating_add(TimeDelta::from_secs(RANKED_ENTRY_EXPIRY))
    }
}

#[derive(Clone, Serialize, Deserialize, Debug, SimpleObject)]
pub struct WagerLobby {
    pub lobby_id: MatchId,
    pub creator: PlayerHash,
    pub amount: Amount,
    pub created_at: Timestamp,
}

/// Token shared between players to join a wager match
/// Uses JSON encoding so frontend can decode and show details
#[derive(Clone, Serialize, Deserialize, Debug, SimpleObject, InputObject)]
pub struct WagerToken {
    pub creator: PlayerHash,
    pub amount: Amount,
    pub created_at: Timestamp,
    pub expires_at: Timestamp,
}

impl WagerToken {
    pub fn new(creator: PlayerHash, amount: Amount, now: Timestamp) -> Self {
        Self {
            creator,
            amount,
            created_at: now,
            expires_at: now.saturating_add(TimeDelta::from_secs(TOKEN_TIME)),
        }
    }

    /// Encode token to base64 JSON string (frontend-readable)
    pub fn encode(&self) -> String {
        let json = serde_json::to_string(self).unwrap();
        general_purpose::STANDARD.encode(json.as_bytes())
    }

    /// Decode base64 JSON string back to token
    pub fn decode(encoded: &str) -> Option<Self> {
        let bytes = general_purpose::STANDARD.decode(encoded).ok()?;
        let json = String::from_utf8(bytes).ok()?;
        serde_json::from_str(&json).ok()
    }

    pub fn is_expired(&self, now: Timestamp) -> bool {
        now > self.expires_at
    }

    /// Generate a unique lobby ID from this token
    pub fn lobby_id(&self) -> MatchId {
        // Use creator hash value + created_at for uniqueness
        let input = format!(
            "wager:{}:{}",
            &*self.creator, // Deref to &String
            self.created_at.micros()
        );
        MatchId::new(general_purpose::STANDARD.encode(input.as_bytes()))
    }
}
