use std::collections::BTreeSet;

use async_graphql::SimpleObject;
use linera_sdk::linera_base_types::AccountOwner;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Leaderboard {
    pub id: AccountOwner,
    pub name: Option<String>,
    pub elo: u32,
    pub matches: u32,
    pub won: u32,
    pub lost: u32,
}

// Implement ordering: sort by elo descending, then by id for uniqueness
impl PartialOrd for Leaderboard {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Leaderboard {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Higher elo comes first
        other.elo.cmp(&self.elo)
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize, SimpleObject)]
pub struct LeaderboardManager {
    players: BTreeSet<Leaderboard>,
    max_size: usize,
}

impl Default for LeaderboardManager {
    fn default() -> Self {
        Self::new()
    }
}

impl LeaderboardManager {
    pub fn new() -> Self {
        Self {
            players: BTreeSet::new(),
            max_size: 10,
        }
    }

    /// Try to add a player to the leaderboard after a match
    pub fn try_add_player(&mut self, player: Leaderboard) {
        // Remove old entry if player already exists (in case of updated stats)
        self.players.retain(|p| p.id != player.id);

        // If leaderboard has room, add the player
        if self.players.len() < self.max_size {
            self.players.insert(player);
            return;
        }

        // Leaderboard is full - check if player beats the weakest
        if let Some(weakest) = self.players.iter().next_back() {
            if player.elo > weakest.elo {
                // Remove weakest player
                let weakest_clone = weakest.clone();
                self.players.remove(&weakest_clone);
                // Add new player (BTreeSet automatically sorts)
                self.players.insert(player);
            }
        }
    }

    /// Get the top 10 players (already sorted)
    pub fn get_top_10_owned(&self) -> Vec<Leaderboard> {
        self.players.iter().cloned().collect()
    }

    pub fn get_top_10(&self) -> Vec<&Leaderboard> {
        self.players.iter().collect()
    }
    /// Get the weakest player's elo (for checking eligibility)
    pub fn get_min_elo(&self) -> Option<u32> {
        self.players.iter().next_back().map(|p| p.elo)
    }
}

pub struct EloCalculator {
    k_factor: f64,
}

impl EloCalculator {
    pub fn new(k_factor: f64) -> Self {
        Self { k_factor }
    }

    /// Calculate expected score for player with rating_a against rating_b
    fn expected_score(&self, rating_a: f64, rating_b: f64) -> f64 {
        1.0 / (1.0 + 10_f64.powf((rating_b - rating_a) / 400.0))
    }

    /// Calculate new ratings after a match
    /// outcome: 1.0 for player_a win, 0.5 for draw, 0.0 for player_b win
    pub fn calculate_new_ratings(&self, rating_a: f64, rating_b: f64, outcome: f64) -> (f64, f64) {
        let expected_a = self.expected_score(rating_a, rating_b);
        let expected_b = self.expected_score(rating_b, rating_a);

        let new_rating_a = rating_a + self.k_factor * (outcome - expected_a);
        let new_rating_b = rating_b + self.k_factor * ((1.0 - outcome) - expected_b);

        (new_rating_a, new_rating_b)
    }
}
