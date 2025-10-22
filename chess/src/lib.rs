#![allow(non_snake_case)]

use std::ops::{Deref, DerefMut};

use async_graphql::{Enum, InputObject, Request, Response, SimpleObject};
use chess_lib::{game::game::Game, pieces::Color, ChessError, Result};
use serde::{Deserialize, Serialize};
pub struct ChessAbi;
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, ChainId, TimeDelta, Timestamp},
    ToBcsBytes,
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

#[derive(
    Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Ord, PartialOrd, SimpleObject, InputObject,
)]
#[graphql(input_name = "FriendIdInput")]
pub struct FriendId {
    pub id: String,
}

impl FriendId {
    pub fn create_token_id(player_key: &String, points: &u32) -> Result<FriendId> {
        use base64::engine::{general_purpose::STANDARD_NO_PAD, Engine as _};
        use sha3::Digest as _;

        let mut hasher = sha3::Sha3_256::new();
        hasher.update(player_key.to_bcs_bytes().unwrap());
        hasher.update(points.to_bcs_bytes().unwrap());

        let id = hasher.finalize().to_vec();

        let token_id = STANDARD_NO_PAD.encode(id);

        Ok(FriendId { id: token_id })
    }
}

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

/* #[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, SimpleObject)]
pub struct Players {

}; */

#[derive(Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct GameWrapper {
    pub initalized: bool,
    #[graphql(skip)]
    inner: Game,
    pub players: [Option<AccountOwner>; 2],
    pub winner: Option<AccountOwner>,
}

impl GameWrapper {
    pub fn new(&self, white: AccountOwner, black: AccountOwner) -> Self {
        Self {
            inner: Game::new(),
            initalized: true,
            players: [Some(white), Some(black)],
            winner: None,
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
    pub current_turn_start: Timestamp,
    pub block_delay: TimeDelta,
}

impl Clock {
    /// Initializes the clock.
    pub fn new(block_time: Timestamp, timer: TimeDelta) -> Self {
        Self {
            time_left: [timer, timer],
            // increment: arg.increment, // todo!(increment is not required at the moment)
            current_turn_start: block_time,
            block_delay: TimeDelta::from_secs(5),
        }
    }

    /// Records a player making a move in the current block.
    pub fn make_move(&mut self, block_time: Timestamp, player: Color) {
        let duration = block_time.delta_since(self.current_turn_start);
        let i = player.index();
        self.time_left[i] = self.time_left[i].saturating_sub(duration);
        self.current_turn_start = block_time;
    }

    /// Returns the time left for a given player.
    pub fn time_left_for_players(&self) -> PlayersTime {
        PlayersTime {
            white: self.time_left[Color::White.index()],
            black: self.time_left[Color::Black.index()],
        }
    }

    /// Returns whether the given player has timed out.
    #[inline]
    pub fn timed_out(&self, block_time: Timestamp, player: Color) -> bool {
        let elapsed = block_time.delta_since(self.current_turn_start);
        let t = self.time_left[player.index()].saturating_sub(elapsed);
        t.eq(&TimeDelta::ZERO)
    }
}
