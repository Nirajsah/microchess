use chess::{
    tournament::{TournamentInput, TournamentStatus, TournamentUpdate},
    Message,
};

use crate::ChessContract;

impl ChessContract {
    pub fn on_op_tournament_registration(&mut self, tournament_id: String) {
        let app_chain = self.app_chain();
        let owner = self.runtime.authenticated_signer().unwrap();
        assert_ne!(self.runtime.chain_id(), app_chain);

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

        self.runtime.send_message(app_chain, message);
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

    pub fn on_op_host_tournament(&mut self, value: TournamentInput) {
        let app_chain = self.app_chain();
        assert_ne!(self.runtime.chain_id(), app_chain);
        let now = self.runtime.system_time();
        let owner = self.runtime.authenticated_signer().unwrap();
        let chain_id = self.runtime.chain_id();
        let tournament = TournamentInput::new(value, chain_id, now, owner);
        self.state
            .my_tournaments
            .get_mut()
            .push(tournament.clone().into());

        if tournament.status == TournamentStatus::RegistrationOpen {
            let message = Message::HostTournament { value: tournament };
            // we also store tournament_id in own_chain to make sure when we send updates, the tournament exists.
            self.runtime.send_message(app_chain, message);
            // here we send tournament_id and tournament to app_chain
            // app chain is responsible to emitting events to update supabase
            // to update status of a tournament we send status updates to app_chain
        }
    }

    pub fn on_op_update_tournament(&mut self, tournament_id: String, update: TournamentUpdate) {
        let app_chain = self.app_chain();
        let my_tournament = self
            .state
            .my_tournaments
            .get_mut()
            .iter_mut()
            .find(|v| tournament_id == v.tournament_id);

        if let Some(tournament) = my_tournament {
            tournament.update(update.clone());

            if tournament.status == TournamentStatus::Draft {
                return;
            }
        }

        let message = Message::UpdateTournament {
            tournament_id: tournament_id.clone(),
            update,
        };

        self.runtime.send_message(app_chain, message);
    }
}
