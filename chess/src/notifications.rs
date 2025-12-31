use async_graphql::{Enum, SimpleObject};
use linera_sdk::linera_base_types::{ChainId, Timestamp};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, PartialEq)]
pub struct Notification {
    pub title: String,                       // Title of the notification
    pub notification_type: NotificationType, // Notification type to match on the frontend
    pub data: String,                        // data contained in the notification
    pub sender: ChainId,                     // Chain which sends the notification(app_chain)
    pub read: bool,                          // unread vs read
    pub created_at: Timestamp,               // event time
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, PartialEq, Enum, Eq)]
pub enum NotificationType {
    TournamentCreated,
    TournamentPublished,
    PlayerRegistered,
    MatchCreated,
    MatchResult,
    TournamentFinished,
    RoundStarted,
    RoundExpired,
}

impl Notification {
    pub fn new() {
        todo!()
    }
}
