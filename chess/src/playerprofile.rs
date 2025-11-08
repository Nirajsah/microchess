use std::ops::Deref;

/**
 * TODO(When a match is over the points update will be based on game type, i.e., Standard, Bullet, Blitz...)
*/
use async_graphql::{scalar, InputObject, SimpleObject};
use linera_sdk::linera_base_types::AccountOwner;
use serde::{Deserialize, Serialize};

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
}

scalar!(GameResult);

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum GameResult {
    Win,  // Add 5 points
    Loss, // Sub 1 point
    Draw, // Add 2 points
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct Players {
    pub player_1: PlayerProfile,
    pub player_2: PlayerProfile,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject, InputObject)]
pub struct MatchId {
    pub id: u32,
}

impl Deref for MatchId {
    type Target = u32;

    fn deref(&self) -> &Self::Target {
        &self.id
    }
}

impl PlayerProfile {
    // create a new profile
    pub fn new(id: AccountOwner, name: Option<String>) -> Self {
        Self {
            id,
            name,
            elo: 0,
            matches: 0,
            won: 0,
            lost: 0,
            ath: 0,
        }
    }
    // send player to app_chain for a match, this will be sent to game_chain
    // -> game_chain sends data back to app_chain to handle point updates after match
    // -> app_chain sends point updates to the player's chains
    pub fn player(&self) -> Self {
        self.clone()
        /*
        elo, id ,name, matches, won, lost
        -> player_chain send to app_chain
        -> app_chain to game_chain
        -> game_chain to app_chain
        -> app_chain to player chain


        // when a match starts the app_chain stores the matchid as well as both the players profile.
        the game_chain receives, both player(elo, id, name), match_id.

        after match ends the game_chain sends, match_id and result(winner)
        app_chain decides and update_leaderboard, send update points to players and deleted both players profile from its state
        */
    }

    // update player stats after a match, message received from app_chain
    pub fn update(&mut self) {
        todo!()
    }
}
