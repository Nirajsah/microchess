use async_graphql::{Enum, SimpleObject};
use linera_sdk::linera_base_types::{ChainId, Timestamp};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, PartialEq)]
pub struct Notification {
    pub title: String,
    pub notification_type: NotificationType,

    /// Optional payload depending on type
    pub chain_id: Option<ChainId>,

    pub data: String,
    pub sender: ChainId,
    pub read: bool,
    pub created_at: Timestamp,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, PartialEq, Eq, Enum)]
pub enum NotificationType {
    TournamentPublished, // has chain_id
    TournamentFinished,
    FriendlyMatch, // has chain_id
}

impl Notification {
    pub fn tournament_published(
        title: String,
        chain_id: ChainId,
        data: String,
        sender: ChainId,
        created_at: Timestamp,
    ) -> Self {
        Self {
            title,
            notification_type: NotificationType::TournamentPublished,
            chain_id: Some(chain_id),
            data,
            sender,
            read: false,
            created_at,
        }
    }

    pub fn tournament_finished(
        title: String,
        data: String,
        sender: ChainId,
        created_at: Timestamp,
    ) -> Self {
        Self {
            title,
            notification_type: NotificationType::TournamentFinished,
            chain_id: None,
            data,
            sender,
            read: false,
            created_at,
        }
    }

    pub fn friendly_match(
        title: String,
        chain_id: ChainId,
        data: String,
        sender: ChainId,
        created_at: Timestamp,
    ) -> Self {
        Self {
            title,
            notification_type: NotificationType::FriendlyMatch,
            chain_id: Some(chain_id),
            data,
            sender,
            read: false,
            created_at,
        }
    }
}
