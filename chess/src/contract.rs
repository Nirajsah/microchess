#![cfg_attr(target_arch = "wasm32", no_main)]
#![allow(unused_imports)]

mod state;

use std::str::FromStr;

use crate::state::ChessState;

use chess::{ChessResponse, Clock, GameChain, InstantiationArgument, Message, Operation, Player};
use chess_lib::{game::game::GameState, Result};
use linera_sdk::{
    abi::WithContractAbi,
    linera_base_types::{
        AccountOwner, Amount, ApplicationPermissions, ChainId, ChainOwnership, TimeDelta,
        TimeoutConfig, Timestamp,
    },
    util::BlockingWait,
    views::{RootView, View},
    Contract, ContractRuntime,
};

#[allow(dead_code)]
pub struct ChessContract {
    state: ChessState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(ChessContract);

impl WithContractAbi for ChessContract {
    type Abi = chess::ChessAbi;
}

impl Contract for ChessContract {
    type InstantiationArgument = InstantiationArgument;
    type Message = Message;
    type EventValue = ();
    type Parameters = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = ChessState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ChessContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
        //self.state
        //  .clock
        // .set(Clock::new(self.runtime.system_time(), &argument));
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> ChessResponse {
        match operation {
            Operation::NewGame => {
                /* log::info!("{player} has arrived");
                let players = self.state.get_players();
                if players.len() == 2 {
                    return ChessResponse::Err(ChessError::InvalidRequest);
                }
                if players.len() == 1 {
                    if player == players[0] {
                        return ChessResponse::Err(ChessError::InvalidRequest);
                    }
                    let game = self.state.board.get().new();
                    // let game = self.state.board.get().with_fen("8/7P/7P/8/8/8/8/7r w - - 0 1");
                    self.state.add_player(player);
                    self.state.board.set(game);
                    ChessResponse::Ok
                } else {
                    self.state.add_player(player);
                    ChessResponse::Ok
                } */
                let game = self.state.board.get().new();

                self.state.board.set(game);

                ChessResponse::Ok
            }

            Operation::MakeMove { from, to, piece } => {
                let active_player = self.state.board.get().active_player;

                let clock = self.state.clock.get_mut();
                let block_time = self.runtime.system_time();

                match self
                    .state
                    .board
                    .get_mut()
                    .commit_move(from, to, piece, None)
                {
                    Ok(_) => {
                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        ChessResponse::Ok
                    }
                    Err(e) => ChessResponse::Err(e),
                }
            }
            Operation::PawnPromotion {
                from,
                to,
                piece,
                promoted_piece,
            } => {
                let block_time = self.runtime.system_time();

                let clock = self.state.clock.get_mut();
                let active_player = self.state.board.get().active_player;

                match self
                    .state
                    .board
                    .get_mut()
                    .commit_move(from, to, piece, Some(promoted_piece))
                {
                    Ok(_) => {
                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        ChessResponse::Ok
                    }
                    Err(e) => ChessResponse::Err(e),
                }
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::Start { players, timer } => todo!(),
            Message::GameChainData { game_chain_data } => {
                self.state.game_chain.set(game_chain_data)
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl ChessContract {
    /// Method to start a new multi-owner chain for game
    /// Sends a message to newly created chain to start a game with both players
    ///
    /// `Returns` (ChainId, Timestamp)
    pub fn create_game_chain(
        &mut self,
        fee: Amount,
        match_time: TimeDelta,
        players: [AccountOwner; 2],
    ) -> Result<GameChain> {
        let timestamp: Timestamp = self.runtime.system_time();
        let ownership = ChainOwnership::multiple(
            [(players[0], 100), (players[1], 100)],
            100,
            TimeoutConfig::default(),
        );
        let app_id = self.runtime.application_id();
        let permissions = ApplicationPermissions::new_single(app_id.forget_abi());
        let chain_id = self.runtime.open_chain(ownership, permissions, fee);

        self.runtime.send_message(
            chain_id,
            Message::Start {
                players,
                timer: match_time,
            },
        );
        let game_chain = GameChain {
            chain_id,
            timestamp,
        };

        Ok(game_chain)
    }

    // Method to send required chain data to players.
    // this is required, the web-client needs to assign player's wallet with new chain
    pub fn send_game_chain_data_2players(
        &mut self,
        game_chain_data: GameChain,
        players: &[Player],
    ) -> Result<()> {
        for p in players.iter() {
            self.runtime.send_message(
                p.chain_id,
                Message::GameChainData {
                    game_chain_data: game_chain_data.clone(),
                },
            );
        }

        Ok(())
    }

    /* /// generated hash
    pub fn request_friendly_match(&mut self, player: PublicKey, timer: TimeDelta) -> ChessResponse {
        assert_ne!(self.runtime.chain_id(), self.main_chain_id());
        let points = self.state.stats.get().points;
        let id = FriendId::create_token_id(&player.to_string(), &points)
            .expect("Unable to generate hash");

        // Todo!() Need to store and return the hash to the user.
        let main_chain_id = self.main_chain_id();
        let player_rank = self.state.stats.get().rank.clone();
        let player = PlayerRequest {
            player,
            timer,
            rank: player_rank,
        };

        log::info!("Hash_id: {:?}", id);
        self.runtime
            .send_message(main_chain_id, Message::FriendlyGame { hash: id, player });
        ChessResponse::Ok
    }

    /// This method is used to send hash and player's PlayerRequest to the main_chain_id, requires
    /// (game hash, and public_key)
    pub async fn start_friendly_match(
        &mut self,
        player: PublicKey,
        hash: FriendId,
    ) -> ChessResponse {
        assert_ne!(self.runtime.chain_id(), self.main_chain_id());

        let main_chain_id = self.main_chain_id();
        let rank = self.state.stats.get().rank.clone();

        // Timer does not matter here, as the player who generated the hash timer will be used.
        let player = PlayerRequest {
            player,
            timer: TimeDelta::from_micros(0),
            rank,
        };

        self.runtime
            .send_message(main_chain_id, Message::FriendlyGame { hash, player });
        ChessResponse::Ok
    }

    /// A method to send a request to the main chain to start a new chain with player's public_key
    pub fn request_game_chain(&mut self, player: PublicKey, timer: TimeDelta, rank: Rank) {
        assert_ne!(self.runtime.chain_id(), self.main_chain_id());
        let main_chain_id = self.main_chain_id();
        self.runtime.send_message(
            main_chain_id,
            Message::StartGame {
                player,
                timer,
                rank,
            },
        );
    }

    /// Start a new game on new chain, requires two players and the amount to cover the chain fees
    /// (Todo!) Add the ability to bet on the game, requires optional betting amount
    pub async fn start_game(
        &mut self,
        players: [PublicKey; 2],
        amount: Amount,
        match_time: TimeDelta,
    ) -> ChessResponse {
        assert_eq!(self.runtime.chain_id(), self.main_chain_id());
        let ownership = ChainOwnership::multiple(
            [(players[0], 100), (players[1], 100)],
            100,
            TimeoutConfig::default(),
        );
        let app_id = self.runtime.application_id();
        let permissions = ApplicationPermissions::new_single(app_id.forget_abi());
        let (message_id, chain_id) = self.runtime.open_chain(ownership, permissions, amount);
        for public_key in &players {
            self.state
                .game_chains
                .get_mut_or_default(public_key)
                .await
                .unwrap()
                .insert(GameChain {
                    message_id,
                    chain_id,
                });
        }
        self.runtime.send_message(
            chain_id,
            Message::Start {
                players,
                timer: match_time,
            },
        );

        log::info!("Game chain_id: {:?}", chain_id);

        ChessResponse::Ok
    } */

    /// Returns creator chain_id
    pub fn main_chain_id(&mut self) -> ChainId {
        self.runtime.application_creator_chain_id()
    }

    // Handles the winner stats, when a match is over, this function is called to update the
    // leaderboard.
    // Can only be update by the creation chain(Todo!)
    //pub fn handle_match_over(&mut self, winner: PlayerStats) {
    //    let last_player = self.state.bottom_player_stats();
    //    if last_player.wins > winner.wins {
    //        return;
    //    }
    //
    //    self.state.add_player_leaderboard(winner);
    //}

    /// Handles the winner of the game, when a match is over
    pub async fn handle_winner(&mut self) {
        // self.send_reward_nft().await;
        // if players were betting on the game. send the amount to the winner(Todo!)
        // it will require punk records
    }
}
