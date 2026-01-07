use async_graphql::{Enum, InputObject, SimpleObject};
use base64::{engine::general_purpose, Engine};
use linera_sdk::linera_base_types::{AccountOwner, DataBlobHash, TimeDelta, Timestamp};
use serde::{Deserialize, Serialize};

use crate::player::{PlayerHash, Players};

#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Enum)]
pub enum MatchType {
    Random,
    Friendly,
}

// match duration could be added
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MatchMetaData {
    pub match_id: MatchId,
    pub winner: AccountOwner,
    pub match_type: MatchType,
    pub blob_hash: DataBlobHash, // we only store moves in this, so we can replay the entire game
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug, SimpleObject, InputObject)]
pub struct MatchId {
    value: String,
}

impl MatchId {
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
