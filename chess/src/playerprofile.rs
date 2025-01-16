/**
 * Todo!(When a match is over the points update will be based on game type, i.e., Standard, Bullet, Blitz...)
*/
use async_graphql::{scalar, SimpleObject};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, Deserialize, Serialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct PlayerProfile {
    pub points: u32,       // Total points the player has accumulated
    pub games_played: u32, // Total number of games played
    pub games_won: u32,    // Total number of games won
    pub games_lost: u32,   // Total number of games lost
    pub draw_count: u32,   // Number of games drawn
    pub win_rate: f32,     // Winrate of a player, 42.2%
    pub rank: Rank,        // Player Rank (Default: Bronze)
}

scalar!(Rank);

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Ord, PartialOrd, Serialize)]
pub enum Rank {
    #[default]
    Bronze, // 0–999 points
    Silver,   // 1000–1999 points
    Gold,     // 2000–2999 points
    Platinum, // 3000–3999 points
    Diamond,  // 4000+ points
}

scalar!(GameResult);

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum GameResult {
    Win,  // Add 5 points
    Loss, // Sub 1 point
    Draw, // Add 2 points
}

impl Rank {
    pub fn from_points(points: u32) -> Self {
        match points {
            0..=999 => Rank::Bronze,
            1000..=1999 => Rank::Silver,
            2000..=2999 => Rank::Gold,
            3000..=3999 => Rank::Platinum,
            _ => Rank::Diamond,
        }
    }

    // A helper function to get the lower bound of the rank range
    pub fn points(&self) -> u32 {
        match self {
            Rank::Bronze => 0,
            Rank::Silver => 1000,
            Rank::Gold => 2000,
            Rank::Platinum => 3000,
            Rank::Diamond => 4000,
        }
    }
}

impl From<Rank> for u32 {
    fn from(val: Rank) -> Self {
        val.points()
    }
}

impl PlayerProfile {
    /// Constructor to create a new player profile
    pub fn new(points: u32) -> Self {
        let rank = Rank::from_points(points);
        PlayerProfile {
            points,
            games_played: 0,
            games_won: 0,
            games_lost: 0,
            draw_count: 0,
            win_rate: 0.0,
            rank,
        }
    }

    /// A function to update points, recalculate win_rate and rank
    pub fn update_points(&mut self, result: GameResult) {
        match result {
            GameResult::Win => {
                self.points += 5; // Add 5 points for a win
                self.games_won += 1;
            }
            GameResult::Loss => {
                self.points = self.points.saturating_sub(1); // Subtract 1 point for a loss
                self.games_lost += 1;
            }
            GameResult::Draw => {
                self.points += 2; // Add 2 point for a draw
                self.draw_count += 1;
            }
        }
        self.games_played += 1;

        // Recalculate the win rate
        self.win_rate = (self.games_won as f32 / self.games_played as f32) * 100.0;

        // Recalculate the player's rank based on updated points
        self.rank = Rank::from_points(self.points);
    }
}
