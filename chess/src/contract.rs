#![cfg_attr(target_arch = "wasm32", no_main)]
#![allow(unused_imports)]

mod state;

use std::str::FromStr;

use crate::state::ChessState;

use chess::{
    playerprofile::{MatchId, PlayerProfile, Players},
    ChessResponse, Clock, Event, EventType, GameChain, GameWrapper, InstantiationArgument, Message,
    Operation, Player, TimedToken,
};
use chess_lib::{game::game::GameState, ChessError, Result};
use linera_sdk::{
    abi::WithContractAbi,
    linera_base_types::{
        AccountOwner, Amount, ApplicationPermissions, ChainId, ChainOwnership, StreamUpdate,
        TimeDelta, TimeoutConfig, Timestamp,
    },
    util::BlockingWait,
    views::{RootView, View},
    Contract, ContractRuntime,
};
use tracing::Instrument;

const STREAM_NAME: &[u8] = b"chess";

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
    type EventValue = Event;
    type Parameters = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = ChessState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ChessContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // will be used in future
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> ChessResponse {
        match operation {
            Operation::Profile { name } => {
                let id = self.runtime.authenticated_signer().unwrap();
                let profile = PlayerProfile::new(id, Some(name));
                self.state.profile.set(Some(profile));

                ChessResponse::Ok
            }
            Operation::Resign => {
                assert_ne!(self.runtime.chain_id(), self.app_chain());
                let active_player = self.state.board.get().active_player;

                assert_eq!(
                    self.runtime.authenticated_signer(),
                    Some(self.state.board.get().players[active_player.index()].unwrap()),
                    "Only active player can make a move"
                );
                self.state
                    .board
                    .get_mut()
                    .handle_resign(active_player.opposite());
                ChessResponse::Ok
            }
            // we take the hash, decode it and send a req to app_chain
            Operation::FrGameHash { token } => {
                let id = self.runtime.authenticated_signer().unwrap();
                let chain_id = self.runtime.chain_id();

                let player = if let Some(p) = self.state.profile.get() {
                    Player {
                        chain_id,
                        profile: p.clone(),
                    }
                } else {
                    let p = PlayerProfile::new(id, None);
                    self.state.profile.set(Some(p.clone()));

                    Player {
                        chain_id,
                        profile: p,
                    }
                };

                self.request_friendly_match(token, player)
            }
            // Create a new hash for a friendly match
            Operation::FrGame => {
                let id = self.runtime.authenticated_signer().unwrap();
                let chain_id = self.runtime.chain_id();

                let player = if let Some(p) = self.state.profile.get() {
                    Player {
                        chain_id,
                        profile: p.clone(),
                    }
                } else {
                    let p = PlayerProfile::new(id, None);
                    self.state.profile.set(Some(p.clone()));

                    Player {
                        chain_id,
                        profile: p,
                    }
                };

                self.state.game_token.set("abs".to_string());
                ChessResponse::Ok
            }
            Operation::Subscribe => {
                let app_id = self.runtime.application_id().forget_abi();
                let chain_id = self.app_chain();
                self.runtime
                    .subscribe_to_events(chain_id, app_id, STREAM_NAME.into());

                ChessResponse::Ok
            }
            // A player makes a new game request to its own chain, requires player profile to be present
            Operation::NewGame => {
                let app_chain = self.app_chain();
                let chain_id = self.runtime.chain_id();
                let id = self.runtime.authenticated_signer().unwrap();

                let player = if let Some(p) = self.state.profile.get() {
                    Player {
                        chain_id,
                        profile: p.clone(),
                    }
                } else {
                    let p = PlayerProfile::new(id, None);
                    self.state.profile.set(Some(p.clone()));

                    Player {
                        chain_id,
                        profile: p,
                    }
                };

                self.runtime
                    .send_message(app_chain, Message::NewGameReq { player });

                ChessResponse::Ok
            }

            Operation::MakeMove { from, to, piece } => {
                assert_ne!(self.runtime.chain_id(), self.app_chain());
                let active_player = self.state.board.get().active_player;
                let clock = self.state.clock.get_mut();
                let block_time = self.runtime.system_time();

                assert_eq!(
                    self.runtime.authenticated_signer(),
                    Some(self.state.board.get().players[active_player.index()].unwrap()),
                    "Only active player can make a move"
                );

                assert!(
                    !clock.timed_out(block_time, active_player),
                    "Player ran out of time."
                );

                match self
                    .state
                    .board
                    .get_mut()
                    .commit_move(from, to, piece, None)
                {
                    Ok(mv) => {
                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));
                        if let Some(san) = mv.san {
                            self.state.board.get_mut().moves_string.push(san);
                        }

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
                assert_ne!(self.runtime.chain_id(), self.app_chain());
                let active_player = self.state.board.get().active_player;
                let block_time = self.runtime.system_time();
                let clock = self.state.clock.get_mut();

                assert_eq!(
                    self.runtime.authenticated_signer(),
                    Some(self.state.board.get().players[active_player.index()].unwrap()),
                    "Only active player can make a move"
                );

                assert!(
                    !clock.timed_out(block_time, active_player),
                    "Player ran out of time."
                );

                match self
                    .state
                    .board
                    .get_mut()
                    .commit_move(from, to, piece, Some(promoted_piece))
                {
                    Ok(mv) => {
                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        if let Some(san) = mv.san {
                            self.state.board.get_mut().moves_string.push(san);
                        }
                        ChessResponse::Ok
                    }
                    Err(e) => ChessResponse::Err(e),
                }
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::Start {
                players,
                match_id,
                timer,
            } => self.start_new_game(players, match_id, timer),
            Message::GameChainData { game_chain_data } => {
                self.state.game_chain.set(Some(game_chain_data))
            }
            Message::NewGameReq { player } => self.new_match(player),
            Message::FriendlyGameReq { players } => self.start_friendly_match(players).await,
        }
    }

    async fn process_streams(&mut self, updates: Vec<StreamUpdate>) {
        for update in updates {
            assert_eq!(update.stream_id.stream_name, STREAM_NAME.into());
            assert_eq!(
                update.stream_id.application_id,
                self.runtime.application_id().forget_abi().into()
            );
            for index in update.new_indices() {
                let event = self
                    .runtime
                    .read_event(update.chain_id, STREAM_NAME.into(), index);
                match event {
                    Event::GameCount { value } => {
                        self.state.game_count.set(value);
                    }
                }
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl ChessContract {
    pub fn app_chain(&mut self) -> ChainId {
        self.runtime.application_creator_chain_id()
    }

    /// Starting a match on game_chain
    pub fn start_new_game(&mut self, players: Players, match_id: MatchId, timer: TimeDelta) {
        self.state.clock.set(Clock::new(timer));
        let game = self
            .state
            .board
            .get()
            .new(players.player_1.id, players.player_2.id);

        self.state.match_id.set(Some(match_id));

        self.state.board.set(game);
    }

    /// Only App chain has the right to create a new game.
    pub fn new_match(&mut self, player: Player) {
        assert_eq!(self.runtime.chain_id(), self.app_chain());

        if let Some(lobby_player) = self.state.lobby.get_mut().pop() {
            // here we start a new game for incoming player and player sitting in the lobby
            let players = Players {
                player_1: lobby_player.profile.clone(),
                player_2: player.profile.clone(),
            };
            let fee = Amount::from_str("1.").unwrap();
            let match_time = TimeDelta::from_secs(900); // 15 mins

            if let Ok(game_chain_data) = self.create_game_chain(fee, match_time, players) {
                self.send_game_chain_data_2players(game_chain_data, &[player, lobby_player])
                    .unwrap();
            }
        } else {
            // we put the player in lobby.
            self.state.lobby.get_mut().push(player);
        }
    }

    /// Method to start a new multi-owner chain for game
    /// Sends a message to newly created chain to start a game with both players
    ///
    /// `Returns` (ChainId, Timestamp)
    pub fn create_game_chain(
        &mut self,
        fee: Amount,
        match_time: TimeDelta,
        players: Players,
    ) -> Result<GameChain> {
        let timestamp: Timestamp = self.runtime.system_time();
        let ownership = ChainOwnership::multiple(
            [(players.player_1.id, 100), (players.player_2.id, 100)],
            100,
            TimeoutConfig::default(),
        );
        let app_id = self.runtime.application_id();
        let permissions = ApplicationPermissions::new_single(app_id.forget_abi());
        let chain_id = self.runtime.open_chain(ownership, permissions, fee);

        let match_id = MatchId { id: 32 };

        self.runtime.send_message(
            chain_id,
            Message::Start {
                players,
                match_id,
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
        // this means a game has started on a chain, we can increase the count,
        // in the future when a game starts on a multi-owner-chain i.e., (game_chain)
        // we send a message from the game_chain to app_chain to update this count.
        // or maybe, we send a final message when the game_chain is closed.
        self.update_state_event(EventType::GameCount);

        Ok(())
    }

    /// Used to update the state as well as emit an event for subscribers
    pub fn update_state_event(&mut self, event: EventType) {
        *self.state.game_count.get_mut() += 1;

        match event {
            EventType::GameCount => {
                self.runtime.emit(
                    STREAM_NAME.into(),
                    &Event::GameCount {
                        value: *self.state.game_count.get(),
                    },
                );
            }
            EventType::Leaderboard => todo!(),
        }
    }

    /// This method sends a message to app_chain with necessary details to create a new game chain for both players
    pub fn request_friendly_match(&mut self, token: String, player: Player) -> ChessResponse {
        let app_chain = self.app_chain();
        assert_ne!(self.runtime.chain_id(), app_chain);
        let friend = if let Some(player) = TimedToken::decode_token(&token) {
            player
        } else {
            return ChessResponse::Err(ChessError::new("INVALID TOKEN"));
        };

        self.runtime.send_message(
            app_chain,
            Message::FriendlyGameReq {
                players: [friend, player],
            },
        );

        ChessResponse::Ok
    }

    /// Responsible for creating a chain and sending the necessary data to the players
    pub async fn start_friendly_match(&mut self, players: [Player; 2]) {
        let app_chain = self.app_chain();
        assert_eq!(self.runtime.chain_id(), app_chain);

        let fee = Amount::from_str("1.").unwrap();
        let match_time = TimeDelta::from_secs(900); // 15 mins

        let p: Players = Players {
            player_1: players[0].profile.clone(),
            player_2: players[1].profile.clone(),
        };

        if let Ok(game_chain_data) = self.create_game_chain(fee, match_time, p) {
            self.send_game_chain_data_2players(game_chain_data, &players)
                .unwrap()
        }
    }

    // Handles the winner stats, when a match is over, this function is called to update the
    // leaderboard.
    // Can only be update by the creation chain(Todo!)
    /* pub fn handle_match_over(&mut self, winner: PlayerStats) {
        let last_player = self.state.bottom_player_stats();
        if last_player.wins > winner.wins {
            return;
        }

        self.state.add_player_leaderboard(winner);
    } */

    /// Handles the winner, sending match data to app_chain.
    pub fn handle_winner(&mut self) {
        let winner = self.state.board.get().winner;
        self.state.board.get_mut().winner = winner;
    }
}
