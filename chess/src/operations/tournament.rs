use chess::{
    matches::MatchType,
    player::Players,
    tournament::{
        utils::{Match, Participants, TournamentRound},
        Tournament, TournamentInput, TournamentStatus, TournamentUpdate,
    },
};
use linera_sdk::linera_base_types::{Amount, ChainId, TimeDelta};
use std::str::FromStr;

use crate::{messages::Message, ChessContract};

impl ChessContract {
    /// Method used by a player to participate in a tournament
    /// TODO: Refactor player profile to remove hash
    pub fn on_op_tournament_participation(
        &mut self,
        tournament_id: String,
        tournament_chain: String,
    ) {
        let owner = self.runtime.authenticated_signer().unwrap();
        // returning early
        let Some(player) = self.state.profile.get() else {
            return;
        };
        let Some(player_hash) = player.player_hash.clone() else {
            return;
        };
        let message = Message::TournamentRegister {
            tournament_id,
            owner,
            player: player_hash,
        };

        if let Ok(chain) = ChainId::from_str(&tournament_chain) {
            self.runtime.send_message(chain, message);
        }
    }

    pub fn on_op_tournament_withdraw(&mut self, tournament_id: String) {
        let app_chain = self.app_chain();
        let owner = self.runtime.authenticated_signer().unwrap();
        assert_ne!(self.runtime.chain_id(), app_chain);

        let message = Message::TournamentWithDraw {
            tournament_id,
            owner,
        };
        self.runtime.send_message(app_chain, message);
    }

    /// Operation to host a tournament, meant to be used by personal chain
    pub fn on_op_host_tournament(&mut self, value: TournamentInput) {
        let app_chain = self.app_chain();
        let now = self.runtime.system_time();
        let owner = self.runtime.authenticated_signer().unwrap();
        let chain_id = self.runtime.chain_id();
        let tournament: Tournament = TournamentInput::new(value, chain_id, now, owner).into();

        self.state.my_tournaments.get_mut().push(tournament.clone());

        if tournament.status == TournamentStatus::RegistrationOpen {
            let message = Message::HostTournament {
                value: Box::new(tournament),
            };
            // we also store tournament_id in own_chain to make sure when we send updates, the tournament exists.
            self.runtime.send_message(app_chain, message);
            // here we send tournament_id and tournament to app_chain
            // app chain is responsible to emitting events to update supabase
            // to update status of a tournament we send status updates to app_chain
        }
    }

    /// Method initially used by a organiser's chain.
    pub fn on_op_update_tournament_local(
        &mut self,
        tournament_id: String,
        update: TournamentUpdate,
    ) {
        let app_chain = self.app_chain();
        let now = self.runtime.system_time();
        let my_tournaments = self.state.my_tournaments.get_mut();

        if let Some(tournament) = my_tournaments
            .iter_mut()
            .find(|v| tournament_id == v.tournament_id)
        {
            tournament.update(&update, now);

            if tournament.status == TournamentStatus::RegistrationOpen {
                let message = Message::HostTournament {
                    value: Box::new(tournament.to_owned()),
                };
                self.runtime.send_message(app_chain, message);
            }
        }
    }

    /// An organiser should add the touranment_chain in their wallet, allows them to directly update the state,
    /// Note: Rounds are NOT auto-started - organizer must call StartRound after funding
    pub async fn on_op_update_tournament(
        &mut self,
        tournament_id: String,
        update: TournamentUpdate,
    ) {
        let updated_at = self.runtime.system_time();

        let status = {
            let tournament = match self.state.tournament.get_mut() {
                Some(t) if t.tournament_id == tournament_id => t,
                _ => return,
            };

            tournament.update(&update, updated_at);
            tournament.status
        };

        if status == TournamentStatus::RegistrationClosed {
            let min_players = self
                .state
                .tournament
                .get()
                .as_ref()
                .map(|t| t.min_players)
                .unwrap_or(0);

            let participant_count = if let Some(participants) = self.state.participants.get() {
                match participants {
                    Participants::Swiss(p) => p.players.len(),
                    Participants::SingleElim(p) => p.players.len(),
                }
            } else {
                0
            };

            if (participant_count as u32) < min_players {
                if let Some(t) = self.state.tournament.get_mut() {
                    t.status = TournamentStatus::Cancelled;
                }
            }
            // Note: Rounds NOT auto-started here. Organizer must call StartRound after funding.
        }
    }

    /// Organizer calls this after funding tournament_chain to start the NEXT round
    /// Automatically determines round number based on completed rounds.
    /// Checks balance before creating game chains.
    pub async fn on_op_start_round(&mut self, tournament_id: String) -> chess::ChessResponse {
        use chess::ChessResponse;
        use chess_lib::ChessError;

        // Verify we're on tournament chain
        let Some(tournament) = self.state.tournament.get() else {
            return ChessResponse::Err(ChessError::new("Not a tournament chain"));
        };

        if tournament.tournament_id != tournament_id {
            return ChessResponse::Err(ChessError::new("Tournament ID mismatch"));
        }

        // Registration must be closed
        if tournament.status != TournamentStatus::RegistrationClosed
            && tournament.status != TournamentStatus::InProgress
        {
            return ChessResponse::Err(ChessError::new("Registration must be closed first"));
        }

        // Calculate the next round number based on completed rounds
        let completed_rounds = self.state.tournament_rounds.get().len() as u8;
        let next_round = completed_rounds + 1;

        // Check if we've reached max rounds
        let max_rounds = tournament.round_count.unwrap_or(3);
        if next_round > max_rounds {
            return ChessResponse::Err(ChessError::new(format!(
                "Tournament complete: all {} rounds finished",
                max_rounds
            )));
        }

        // Get participant count for this round
        let participant_count = if let Some(participants) = self.state.participants.get() {
            match participants {
                Participants::Swiss(p) => p.players.len(),
                Participants::SingleElim(p) => p.players.len(),
            }
        } else {
            0
        };

        // Calculate required funds: 0.5 tokens per match, matches = participants / 2
        let matches_in_round = participant_count / 2;
        let required = Amount::from_millis((matches_in_round as u128) * 500); // 0.5 tokens = 500 millis

        // Check tournament chain balance
        let balance = self.runtime.chain_balance();

        if balance < required {
            return ChessResponse::Err(ChessError::new(format!(
                "Insufficient funds: need {} tokens, have {}",
                required, balance
            )));
        }

        // Update status to InProgress if first round
        if next_round == 1 {
            if let Some(t) = self.state.tournament.get_mut() {
                t.status = TournamentStatus::InProgress;
            }
        }

        // Start the next round (this creates game chains)
        self.start_new_round(next_round);

        ChessResponse::Ok
    }
}
