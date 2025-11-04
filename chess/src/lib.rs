#![allow(non_snake_case)]

use std::{
    ops::{Deref, DerefMut},
    time::{SystemTime, UNIX_EPOCH},
};

use async_graphql::{Request, Response, SimpleObject};
use base64::{engine::general_purpose, Engine};
use chess_lib::{game::game::Game, pieces::Color, ChessError};
use serde::{Deserialize, Serialize};
pub struct ChessAbi;
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, ChainId, TimeDelta, Timestamp},
};

impl ContractAbi for ChessAbi {
    type Operation = Operation;
    type Response = ChessResponse;
}

impl ServiceAbi for ChessAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct InstantiationArgument {
    /// The initial time each player has to think about their turns.
    pub start_time: TimeDelta,
    /// The duration that is added to the clock after each turn.
    pub increment: TimeDelta,
    /// The maximum time that is allowed to pass between a block proposal and validation.
    /// This should be long enough to confirm a block, but short enough for the block timestamp
    /// to accurately reflect the current time.
    pub block_delay: TimeDelta,
}

//#[derive(Clone, Debug, Default, Deserialize, Serialize, SimpleObject)]
//pub struct PlayerStats {
//    pub player_id: String,
//    pub games_played: u32,
//    pub wins: u32,
//    pub losses: u32,
//    pub draws: u32,
//    pub win_rate: f32,
//}

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChessResponse {
    Ok,
    Err(ChessError),
}

#[derive(Debug, Deserialize, Serialize, Clone, GraphQLMutationRoot)]
#[serde(rename_all = "camelCase")]
pub enum Operation {
    NewGame {
        player: AccountOwner,
    },
    MakeMove {
        from: String,
        to: String,
        piece: String,
    },
    PawnPromotion {
        from: String,
        to: String,
        piece: String,
        promoted_piece: String,
    },
    FrGame {
        player: AccountOwner,
    },
    FrGameHash {
        token: String,
        player: AccountOwner,
    },
    Resign,
    Increment,
    Subscribe,
    /* Resign,
    /// Start the game on a temporary chain
    StartGame {
        /// The `Owner` controlling player 1 and 2, respectively.
        players: [AccountOwner; 2],
        /// A small amount to cover the fees for the game, on the new chain
        amount: Amount,
        /// Game's total time (~15 mins)
        match_time: TimeDelta,
    },
    RequestGame {
        player: AccountOwner,
        timer: TimeDelta,
        rank: Rank,
    },
    FriendlyGame {
        player: AccountOwner,
        timer: TimeDelta,
    },
    StartFriendlyGame {
        player: AccountOwner,
        hash: FriendId,
    }, */
}
//     /// The `Owner` controlling player 1 and 2, respectively.
//     pub players: [Owner; 2],
//     /// The initial time each player has to think about their turns.
//     pub start_time: TimeDelta,
//

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    Start {
        players: [AccountOwner; 2],
        timer: TimeDelta,
    },
    NewGameReq {
        player: Player,
    },
    GameChainData {
        game_chain_data: GameChain,
    },

    FriendlyGameReq {
        players: [Player; 2],
    }, /*
       StartGame {
           player: PublicKey,
           timer: TimeDelta,
           rank: Rank,
       },
       FriendlyGame {
           hash: FriendId,
           player: PlayerRequest,
       }, */
}

const TOKEN_TIME: u64 = 300; // 300 seconds = 5 minutes

// struct with expiration
#[derive(Serialize, Deserialize, Debug)]
pub struct TimedToken {
    player: Player,
    expires_at: u64,
}

#[allow(dead_code)]
impl TimedToken {
    pub fn new(player: Player) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            player,
            expires_at: now + TOKEN_TIME,
        }
    }

    // Encode the token into a base64 string
    pub fn encode_token(&self) -> String {
        let bytes = bincode::serialize(self).unwrap();
        general_purpose::STANDARD.encode(bytes)
    }

    // Decode the base64 string back into a token
    pub fn decode_token(encoded: &str) -> Option<Player> {
        let bytes = general_purpose::STANDARD.decode(encoded).unwrap();
        let timed_token: TimedToken = bincode::deserialize(&bytes).unwrap();
        // Check if expired
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if now > timed_token.expires_at {
            return None;
        }

        Some(timed_token.player)
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Event {
    Increment { value: u64 },
}
/* #[derive(
    Clone, Debug, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize, SimpleObject, InputObject,
)]
pub struct PlayerRequest {
    pub player: AccountOwner,
    pub timer: TimeDelta,
    pub rank: Rank,
} */

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, SimpleObject)]
pub struct Player {
    pub owner: AccountOwner,
    pub chain_id: ChainId,
}

#[derive(Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct GameWrapper {
    pub initalized: bool,
    #[graphql(skip)]
    inner: Game,
    pub players: [Option<AccountOwner>; 2],
    pub winner: Option<AccountOwner>,
    pub moves_string: Vec<String>,
}

impl GameWrapper {
    pub fn new(&self, white: AccountOwner, black: AccountOwner) -> Self {
        Self {
            inner: Game::new(),
            initalized: true,
            players: [Some(white), Some(black)],
            winner: None,
            moves_string: Vec::with_capacity(256),
        }
    }

    pub fn get_color_by_account(&self, account: &AccountOwner) -> Option<Color> {
        self.players
            .iter()
            .position(|p| p.as_ref() == Some(account))
            .map(|i| if i == 0 { Color::White } else { Color::Black })
    }
}

impl Deref for GameWrapper {
    type Target = Game;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl DerefMut for GameWrapper {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}

/// The ID and timestamp of a temporary chain for a single game.
///
/// Register View needs this struct to impl Default trait. but ChainId does not, we use Option<ChainId<ChainId>
#[derive(
    Clone, Debug, Default, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize, SimpleObject,
)]
pub struct GameChain {
    /// The Timestamp of the `OpenChain` message that created the chain.
    pub timestamp: Timestamp,
    /// The ID of the temporary game chain itself.
    pub chain_id: Option<ChainId>,
    pub created_at: Timestamp,
}

#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize, SimpleObject)]
pub struct PlayersTime {
    pub white: TimeDelta,
    pub black: TimeDelta,
}

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
