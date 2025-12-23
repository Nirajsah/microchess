use std::str::FromStr;

use chess::{
    player::PlayerHash,
    tournament::{
        utils::{Participants, TParticipants},
        {Tournament, TournamentInput, TournamentStatus, TournamentUpdate},
    },
};
use linera_sdk::linera_base_types::{AccountOwner, ChainId};

use crate::{event::Event, ChessContract, STREAM_NAME};

impl ChessContract {
    pub async fn on_msg_host_tournament(&mut self, tournament: Tournament) {
        assert_eq!(self.runtime.chain_id(), self.app_chain());
        self.state.save_tournament(tournament.clone()).await;

        self.runtime.emit(
            STREAM_NAME.into(),
            &Event::Tournament {
                value: Box::new(tournament),
            },
        );
        // emit events
        // app chain is responsible to emitting events to update supabase
    }

    pub async fn on_msg_update_tournament(
        &mut self,
        sender: ChainId,
        tournament_id: String,
        update: TournamentUpdate,
    ) {
        assert_eq!(self.runtime.chain_id(), self.app_chain());
        let now = self.runtime.system_time();
        let Some(mut tournament) = self
            .state
            .tournaments
            .get(&tournament_id)
            .await
            .ok()
            .flatten()
        else {
            return;
        };

        if tournament.organiser_chain != sender {
            return;
        }

        tournament.update(&update, now);

        if let Some(status) = update.status {
            tournament.status = status;
            match status {
                TournamentStatus::RegistrationClosed => {
                    self.state.start_tournament(&tournament_id).await;
                    tournament.status = TournamentStatus::InProgress;
                } // we start the tournament and switch to inprogress
                TournamentStatus::InProgress => todo!(), // we update to completed
                TournamentStatus::Completed => todo!(),
                TournamentStatus::Cancelled => todo!(), // we update to cancelled
                _ => (),
            }
        }

        if self
            .state
            .tournaments
            .insert(&tournament_id, tournament.clone())
            .is_ok()
        {
            self.runtime.emit(
                STREAM_NAME.into(),
                &Event::Tournament {
                    value: Box::new(tournament),
                },
            );
        }
        // update should be an enum with fields to update
        // emit events
        // app chain is responsible to emitting events to update supabase
    }
    pub async fn on_msg_tournament_registration(
        &mut self,
        tournament_id: String,
        owner: AccountOwner,
        player: PlayerHash,
    ) {
        let app_chain = self.app_chain();
        assert_eq!(self.runtime.chain_id(), app_chain);
        let Some(tournament) = self
            .state
            .tournaments
            .get(&tournament_id)
            .await
            .ok()
            .flatten()
        else {
            return;
        };

        if tournament.status != TournamentStatus::RegistrationOpen {
            return;
        }

        let Some(mut participants) = self
            .state
            .participants
            .get(&tournament_id)
            .await
            .ok()
            .flatten()
        else {
            return;
        };

        let res = participants.try_add_player(owner);

        if res {
            let _ = self.state.participants.insert(&tournament_id, participants);
            let _ = self.state.t_players.insert(&owner, player.clone());

            self.runtime.emit(
                STREAM_NAME.into(),
                &Event::TournamentRegistration {
                    tournament_id: tournament_id.clone(),
                    owner,
                    player,
                },
            );
        }
    }

    pub async fn on_msg_tournament_withdraw(&mut self, tournament_id: String, owner: AccountOwner) {
        let app_chain = self.app_chain();
        assert_eq!(self.runtime.chain_id(), app_chain);

        let Some(tournament) = self
            .state
            .tournaments
            .get(&tournament_id)
            .await
            .ok()
            .flatten()
        else {
            return;
        };

        if tournament.status != TournamentStatus::RegistrationOpen {
            return;
        }

        let Some(mut participants) = self
            .state
            .participants
            .get(&tournament_id)
            .await
            .ok()
            .flatten()
        else {
            return;
        };

        participants.remove_player(owner);

        self.state.t_players.remove(&owner).ok();

        self.state
            .participants
            .insert(&tournament_id, participants)
            .ok();

        self.runtime.emit(
            STREAM_NAME.into(),
            &Event::TournamentWithDraw {
                tournament_id,
                owner,
            },
        );
    }

    pub fn on_msg_publish_tournament(&mut self, tournament: Tournament) {
        if self
            .state
            .tournaments
            .insert(&tournament.tournament_id.clone(), tournament.clone())
            .is_ok()
        {
            self.runtime.emit(
                STREAM_NAME.into(),
                &Event::Tournament {
                    value: Box::new(tournament),
                },
            );
        }
    }
}
