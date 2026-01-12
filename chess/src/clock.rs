use async_graphql::SimpleObject;
use chess_lib::pieces::Color;
use linera_sdk::linera_base_types::{TimeDelta, Timestamp};
use serde::{Deserialize, Serialize};

use crate::player::PlayersTime;

/// A struct to represent a Clock
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, SimpleObject)]
pub struct Clock {
    pub time_left: [TimeDelta; 2],
    pub current_turn_start: Option<Timestamp>,
    pub block_delay: TimeDelta,
}

impl Clock {
    /// Initializes the clock.
    pub fn new(timer: TimeDelta) -> Self {
        Self {
            time_left: [timer, timer],
            // increment: arg.increment, // todo!(increment is not required at the moment)
            current_turn_start: None, // clock starts after a player make a move
            block_delay: TimeDelta::from_secs(5),
        }
    }

    /// Records a player making a move in the current block.
    pub fn make_move(&mut self, block_time: Timestamp, player: Color) {
        if self.current_turn_start.is_none() {
            self.current_turn_start = Some(block_time);
            return;
        }

        let duration = block_time.delta_since(
            self.current_turn_start
                .expect("failed to get timestamp at make move(clock)"),
        );
        let i = player.index();
        self.time_left[i] = self.time_left[i].saturating_sub(duration);

        self.current_turn_start = Some(block_time); // need to reset the current_turn_start for the next player
    }

    /// Returns the time left for a given player.
    pub fn time_left_for_players(
        &self,
        block_time: Timestamp,
        active_player: Color,
    ) -> PlayersTime {
        let mut white_time = self.time_left[Color::White.index()];
        let mut black_time = self.time_left[Color::Black.index()];

        // Deduct elapsed time from active player only
        if let Some(turn_start) = self.current_turn_start {
            let elapsed = block_time.delta_since(turn_start);

            match active_player {
                Color::White => {
                    white_time = white_time.saturating_sub(elapsed);
                }
                Color::Black => {
                    black_time = black_time.saturating_sub(elapsed);
                }
            }
        }

        PlayersTime {
            white: white_time,
            black: black_time,
        }
    }

    /// Returns whether the given player has timed out.
    #[inline]
    pub fn timed_out(&self, block_time: Timestamp, player: Color) -> bool {
        let Some(start) = self.current_turn_start else {
            return false;
        };

        let elapsed = block_time.delta_since(start);
        let t = self.time_left[player.index()].saturating_sub(elapsed);
        t.eq(&TimeDelta::ZERO)
    }
}
