#![cfg_attr(target_arch = "wasm32", no_main)]
#![allow(unused_imports)]

mod state;

use std::str::FromStr;

use crate::state::ChessState;

use chess::{
    leaderboard::LeaderboardManager,
    playerprofile::{PlayerHash, PlayerProfile, Players},
    ChessResponse, Clock, Event, EventType, GameChain, GameWrapper, InstantiationArgument, MatchId,
    MatchMetaData, MatchType, Message, Operation, TimedToken,
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

        if self.state.leaderboard_manager.get().is_none() {
            let manager = LeaderboardManager::new();
            self.state.leaderboard_manager.set(Some(manager));
        }
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> ChessResponse {
        match operation {
            Operation::Profile { name } => {
                let id = self.runtime.authenticated_signer().unwrap();
                let chain_id = self.runtime.chain_id();
                let mut profile = PlayerProfile::new(chain_id, id, Some(name));
                profile.encode();

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
                let now = self.runtime.system_time();

                let player: Option<PlayerHash> = if let Some(p) = self.state.profile.get() {
                    p.hash()
                } else {
                    let mut p = PlayerProfile::new(chain_id, id, None);
                    p.encode()
                };

                if let Some(hash) = player {
                    let decoded: PlayerHash = TimedToken::decode_token(&token, now).unwrap();
                    let players = Players {
                        player_1: decoded,
                        player_2: hash,
                    };
                    self.request_friendly_match(players);
                }

                ChessResponse::Ok
            }
            // Create a new hash for a friendly match
            Operation::FrGame => {
                let id = self.runtime.authenticated_signer().unwrap();
                let chain_id = self.runtime.chain_id();
                let now = self.runtime.system_time();

                let player: Option<PlayerHash> = if let Some(p) = self.state.profile.get() {
                    p.hash()
                } else {
                    let mut p = PlayerProfile::new(chain_id, id, None);
                    p.encode()
                };

                if let Some(hash) = player {
                    let token = TimedToken::new(now, hash).encode_token();
                    self.state.game_token.set(token);
                }

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

                let player: Option<PlayerHash> = if let Some(p) = self.state.profile.get() {
                    p.hash()
                } else {
                    let mut p = PlayerProfile::new(chain_id, id, None);
                    p.encode()
                };

                if let Some(hash) = player {
                    self.runtime
                        .send_message(app_chain, Message::NewGameReq { player: hash });
                }

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
                    .commit_move(from.clone(), to.clone(), piece, None)
                {
                    Ok(mv) => {
                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));
                        if let Some(san) = mv.san {
                            let board = self.state.board.get_mut();
                            board.moves_string.push(san);
                            board.add_move(from, to);
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

                match self.state.board.get_mut().commit_move(
                    from.clone(),
                    to.clone(),
                    piece,
                    Some(promoted_piece),
                ) {
                    Ok(mv) => {
                        clock.make_move(block_time, active_player);
                        self.runtime
                            .assert_before(block_time.saturating_add(clock.block_delay));

                        if let Some(san) = mv.san {
                            let board = self.state.board.get_mut();
                            board.moves_string.push(san);
                            board.add_move(from, to);
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
                match_type,
                timer,
            } => self.start_new_game(players, match_id, timer, match_type),
            Message::GameChainData { game_chain_data } => {
                self.state.game_chain.set(Some(game_chain_data))
            }
            Message::NewGameReq { player } => self.new_match(player),
            Message::FriendlyGameReq { players } => self.start_friendly_match(players).await,
            // handle updates after receiving the metadata
            Message::MatchEnd { metadata } => self.handle_match_end(metadata).await,
            Message::ProfileUpdate { player_hash } => {
                if let Some(profile) = self.state.profile.get_mut() {
                    profile.update(player_hash);
                }
            }
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
                    Event::Leaderboard { leaderboard } => {
                        self.state.leaderboard.set(leaderboard);
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
    pub fn start_new_game(
        &mut self,
        players: Players,
        match_id: MatchId,
        timer: TimeDelta,
        match_type: MatchType,
    ) {
        self.state.clock.set(Clock::new(timer));
        let (player_1, player_2) = players.get_players();
        let game = self
            .state
            .board
            .get()
            .new(player_1.id, player_2.id, match_id, match_type);

        self.state.board.set(game);
    }

    /// Only App chain has the right to create a new game.
    pub fn new_match(&mut self, player: PlayerHash) {
        assert_eq!(self.runtime.chain_id(), self.app_chain());

        if let Some(lobby_player) = self.state.lobby.get_mut().pop() {
            // here we start a new game for incoming player and player sitting in the lobby
            let players = Players {
                player_1: lobby_player,
                player_2: player,
            };
            let fee = Amount::from_str("1.").unwrap();
            let match_time = TimeDelta::from_secs(900); // 15 mins

            if let Ok(game_chain_data) =
                self.create_game_chain(fee, match_time, MatchType::Random, &players)
            {
                self.send_game_chain_data_2players(game_chain_data, players);
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
        match_type: MatchType,
        players: &Players,
    ) -> Result<GameChain> {
        let timestamp: Timestamp = self.runtime.system_time();

        let (player_1, player_2) = players.get_players();

        let ownership = ChainOwnership::multiple(
            [(player_1.id, 100), (player_2.id, 100)],
            100,
            TimeoutConfig::default(),
        );
        let app_id = self.runtime.application_id();
        let permissions = ApplicationPermissions::new_single(app_id.forget_abi());
        let chain_id = self.runtime.open_chain(ownership, permissions, fee);

        let match_id = MatchId::encode_players(players);

        self.runtime.send_message(
            chain_id,
            Message::Start {
                players: players.clone(),
                match_id,
                timer: match_time,
                match_type,
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
    pub fn send_game_chain_data_2players(&mut self, game_chain_data: GameChain, players: Players) {
        let (player_1, player_2) = players.get_players();
        self.runtime.send_message(
            player_1.chain_id,
            Message::GameChainData {
                game_chain_data: game_chain_data.clone(),
            },
        );

        self.runtime.send_message(
            player_2.chain_id,
            Message::GameChainData { game_chain_data },
        );
        // this means a game has started on a chain, we can increase the count,
        // in the future when a game starts on a multi-owner-chain i.e., (game_chain)
        // we send a message from the game_chain to app_chain to update this count.
        // or maybe, we send a final message when the game_chain is closed.
        self.update_state_event(EventType::GameCount);
    }

    /// Used to update the state as well as emit an event for subscribers
    pub fn update_state_event(&mut self, event: EventType) {
        assert_eq!(self.app_chain(), self.runtime.chain_id());
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
            EventType::Leaderboard => {
                if let Some(leaderboard_manager) = self.state.leaderboard_manager.get() {
                    let leaderboard = leaderboard_manager.get_top_10_owned();
                    self.runtime
                        .emit(STREAM_NAME.into(), &Event::Leaderboard { leaderboard });
                }
            }
        }
    }

    /// This method sends a message to app_chain with necessary details to create a new game chain for both players
    pub fn request_friendly_match(&mut self, players: Players) -> ChessResponse {
        let app_chain = self.app_chain();
        assert_ne!(self.runtime.chain_id(), app_chain);

        self.runtime
            .send_message(app_chain, Message::FriendlyGameReq { players });

        ChessResponse::Ok
    }

    /// Responsible for creating a chain and sending the necessary data to the players
    pub async fn start_friendly_match(&mut self, players: Players) {
        let app_chain = self.app_chain();
        assert_eq!(self.runtime.chain_id(), app_chain);

        let fee = Amount::from_str("1.").unwrap();
        let match_time = TimeDelta::from_secs(900); // 15 mins

        if let Ok(game_chain_data) =
            self.create_game_chain(fee, match_time, MatchType::Friendly, &players)
        {
            self.send_game_chain_data_2players(game_chain_data, players)
        }
    }

    /// Handles the winner, sending match data to app_chain.
    pub fn send_result(&mut self) {
        let app_chain = self.app_chain();
        let game = self.state.board.get();

        if let Some(winner) = game.winner {
            let metadata = MatchMetaData {
                match_id: game.match_id.clone().unwrap(),
                match_type: game.match_type.unwrap(),
                winner,
            };

            self.runtime
                .send_message(app_chain, Message::MatchEnd { metadata });
        }
    }

    pub async fn handle_match_end(&mut self, metadata: MatchMetaData) {
        assert_eq!(self.app_chain(), self.runtime.chain_id());
        let win = 5; // will change in the future
        let lose = 2;

        match metadata.match_type {
            MatchType::Random => {
                if let Ok(Some(players)) = self.state.matches.get(&metadata.match_id).await {
                    let (mut player_1, mut player_2) = players.get_players();

                    if player_1.id == metadata.winner {
                        player_1.add(win);
                        player_2.sub(lose);
                    } else if player_2.id == metadata.winner {
                        player_2.add(win);
                        player_1.sub(lose);
                    } else {
                        player_1.draw();
                        player_2.draw();
                    }

                    if let Some(leaderboard) = self.state.leaderboard_manager.get_mut() {
                        leaderboard.try_add_player(player_1.to_leaderboard());
                        leaderboard.try_add_player(player_2.to_leaderboard());
                    }

                    if let Some(player_hash) = player_1.encode() {
                        self.runtime.send_message(
                            player_1.chain_id,
                            Message::ProfileUpdate { player_hash },
                        );
                    }
                    if let Some(player_hash) = player_2.encode() {
                        self.runtime.send_message(
                            player_2.chain_id,
                            Message::ProfileUpdate { player_hash },
                        );
                    }
                }
            }
            MatchType::Friendly => (),
        }

        self.update_state_event(EventType::Leaderboard);
    }
}
