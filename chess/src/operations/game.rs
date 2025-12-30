use chess::{
    matches::TimedToken,
    player::{PlayerHash, PlayerProfile, Players},
    ChessResponse,
};
use chess_lib::{game::game::GameState, ChessError};

use crate::{messages::Message, ChessContract, STREAM_NAME};

impl ChessContract {
    pub fn on_op_resign(&mut self) -> ChessResponse {
        assert_ne!(self.runtime.chain_id(), self.app_chain());
        let board = self.state.board.get_mut();
        let active_player = board.active_player;
        assert_eq!(
            self.runtime.authenticated_signer(),
            Some(board.players[active_player.index()].unwrap()),
            "Only active player can make a move"
        );

        board.handle_resign(active_player.opposite());
        // handle match_end
        self.send_result();

        ChessResponse::Ok
    }

    /// NEED work, we don't want to encode everytime we send a request, should only send necessary data to app_chain
    pub fn on_op_request_friendly_match(&mut self, token: String) -> ChessResponse {
        let id = self.runtime.authenticated_signer().unwrap();
        let chain_id = self.runtime.chain_id();
        let now = self.runtime.system_time();

        let player: Option<PlayerHash> = if let Some(p) = self.state.profile.get() {
            p.hash()
        } else {
            let mut p = PlayerProfile::new(chain_id, id, None);
            p.encode();
            self.state.profile.set(Some(p.clone()));
            p.hash()
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

    // we don't need this
    pub fn on_op_my_id(&mut self) -> ChessResponse {
        ChessResponse::Ok
    }

    pub fn on_op_subscribe(&mut self) -> ChessResponse {
        let app_id = self.runtime.application_id().forget_abi();
        let chain_id = self.app_chain();
        self.runtime
            .subscribe_to_events(chain_id, app_id, STREAM_NAME.into());

        ChessResponse::Ok
    }

    // NEED work, only send necessary data to app_chain, we don't want to encode data
    pub fn on_op_request_new_game(&mut self) -> ChessResponse {
        let app_chain = self.app_chain();
        let chain_id = self.runtime.chain_id();
        let id = self.runtime.authenticated_signer().unwrap();

        let player: Option<PlayerHash> = if let Some(p) = self.state.profile.get() {
            p.hash()
        } else {
            let mut p = PlayerProfile::new(chain_id, id, None);
            p.encode();
            self.state.profile.set(Some(p.clone()));
            p.hash()
        };

        if let Some(hash) = player {
            self.runtime
                .send_message(app_chain, Message::NewGameReq { player: hash });
        }

        ChessResponse::Ok
    }

    pub fn on_op_make_move(&mut self, from: String, to: String, piece: String) -> ChessResponse {
        assert_ne!(self.runtime.chain_id(), self.app_chain());
        let active_player = self.state.board.get().active_player;
        let clock = self.state.clock.get_mut();
        let block_time = self.runtime.system_time();

        assert_eq!(
            self.runtime.authenticated_signer(),
            Some(self.state.board.get().players[active_player.index()].unwrap()),
            "Only active player can make a move"
        );

        if clock.timed_out(block_time, active_player) {
            // Mark game as over with opponent as winner
            let board = self.state.board.get_mut();
            let opponent = active_player.opposite();
            board.winner = Some(board.players[opponent.index()].unwrap());
            board.state = GameState::Ended;

            self.send_result();

            return ChessResponse::Err(ChessError::new("Timed Out"));
        }

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

                // CHECK GAME STATE AFTER MOVE
                let game_state = self.state.board.get().state;
                if game_state == GameState::Checkmate || game_state == GameState::Stalemate {
                    self.send_result();
                }
                ChessResponse::Ok
            }
            Err(e) => match e {
                ChessError::GameOver => {
                    self.send_result();
                    ChessResponse::Err(e)
                }
                _ => ChessResponse::Err(e),
            },
        }
    }
    pub fn on_op_pawn_promotion(
        &mut self,
        from: String,
        to: String,
        piece: String,
        promoted_piece: String,
    ) -> ChessResponse {
        assert_ne!(self.runtime.chain_id(), self.app_chain());
        let active_player = self.state.board.get().active_player;
        let block_time = self.runtime.system_time();
        let clock = self.state.clock.get_mut();

        assert_eq!(
            self.runtime.authenticated_signer(),
            Some(self.state.board.get().players[active_player.index()].unwrap()),
            "Only active player can make a move"
        );

        if clock.timed_out(block_time, active_player) {
            // Mark game as over with opponent as winner
            let board = self.state.board.get_mut();
            let opponent = active_player.opposite();
            board.winner = Some(board.players[opponent.index()].unwrap());
            board.state = GameState::Ended;

            self.send_result();

            return ChessResponse::Err(ChessError::new("Timed Out"));
        }

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

                let game_state = self.state.board.get().state;
                if game_state == GameState::Checkmate || game_state == GameState::Stalemate {
                    self.send_result();
                }
                ChessResponse::Ok
            }

            Err(e) => match e {
                ChessError::GameOver => {
                    self.send_result();
                    ChessResponse::Err(e)
                }
                _ => ChessResponse::Err(e),
            },
        }
    }
}

// Operation::FrGame => {
//              let id = self.runtime.authenticated_signer().unwrap();
//              let chain_id = self.runtime.chain_id();
//              let now = self.runtime.system_time();

//              let player: Option<PlayerHash> = if let Some(p) = self.state.profile.get() {
//                  p.hash()
//              } else {
//                  let mut p = PlayerProfile::new(chain_id, id, None);
//                  p.encode();
//                  self.state.profile.set(Some(p.clone()));
//                  p.hash()
//              };

//              if let Some(hash) = player {
//                  let token = TimedToken::new(now, hash).encode_token();
//                  self.state.game_token.set(token);
//              }

//              ChessResponse::Ok
//          }
