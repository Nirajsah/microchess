use chess::{
    matches::MatchType,
    player::Players,
    tournament::{
        utils::{Match, TournamentRound},
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
            } else {
                return; // in any other case,
            }
        }
    }

    /// An organiser should add the touranment_chain in his/her wallet, he/she could directly update the state,
    pub async fn on_op_update_tournament(
        &mut self,
        tournament_id: String,
        update: TournamentUpdate,
    ) {
        let updated_at = self.runtime.system_time();
        let me = self.runtime.chain_id();

        let tournament = match self.state.tournament.get_mut() {
            Some(t) if t.tournament_id == tournament_id => t,
            _ => return,
        };

        let timer = tournament.time_control.base_minutes;

        tournament.update(&update, updated_at);
        /* if tournament.status != TournamentStatus::RegistrationClosed {
            return;
        } */
        // Need to fix this

        let (matches, player_map) = {
            match self.state.start_tournament_without_persist(&tournament_id) {
                Some(m) => m,
                None => return,
            }
        };

        let fee = Amount::from_str("1.").unwrap();
        let time = TimeDelta::from_secs(timer.into());

        let mut matches_to = Vec::with_capacity(matches.len());

        for m in matches {
            let players = Players {
                player_1: player_map.get(&m.player_a.to_string()).unwrap().clone(),
                player_2: player_map.get(&m.player_b.to_string()).unwrap().clone(),
            };

            if let Some((chain, match_id)) =
                self.create_game_chain(fee, time, MatchType::Tournament(me), &players)
            {
                self.state.matches.insert(&match_id, players).ok();

                matches_to.push(Match {
                    game_chain: Some(chain),
                    ..m
                });
            }
        }
        let t_round = TournamentRound::new(1, matches_to);
        self.state.tournament_rounds.get_mut().push(t_round);
    }
}
