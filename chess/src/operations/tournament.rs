use std::str::FromStr;

use chess::tournament::{Tournament, TournamentInput, TournamentStatus, TournamentUpdate};
use linera_sdk::linera_base_types::ChainId;

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
            } else {
                return; // in any other case,
            }
        }
    }

    /// An organiser should add the touranment_chain in his/her wallet, he/she could directly update the state,
    pub fn on_op_update_tournament(&mut self, tournament_id: String, update: TournamentUpdate) {
        let updated_at = self.runtime.system_time();

        // TODO: we need to take care of tournament update when the organiser want's to start the tournament
        if let Some(tournament) = self.state.tournament.get_mut() {
            if tournament_id == tournament.tournament_id {
                tournament.update(&update, updated_at);
            }

            // registration close triggers tournament start
            if tournament.status == TournamentStatus::RegistrationClosed {
                let res = self.state.start_tournament_and_persist(&tournament_id);
            } else {
                return; // in any other case,
            }
        }
    }
}
