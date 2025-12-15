use chess::{
    playerprofile::PlayerHash,
    tournament::{TournamentInput, TournamentStatus, TournamentUpdate, TournamentUpdates},
    Event, EventType,
};
use linera_sdk::linera_base_types::{AccountOwner, ChainId};

use crate::{ChessContract, STREAM_NAME};

impl ChessContract {
    pub fn on_msg_host_tournament(&mut self, tournament: TournamentInput) {
        assert_eq!(self.runtime.chain_id(), self.app_chain());
        if let Some(tournament_id) = tournament.tournament_id.clone() {
            let _ = self
                .state
                .tournaments
                .insert(&tournament_id.clone(), tournament.clone().into());
        }

        self.runtime.emit(
            STREAM_NAME.into(),
            &Event::Tournament {
                value: tournament.into(),
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
        if let Ok(Some(tournament)) = self.state.tournaments.get_mut(&tournament_id).await {
            if tournament.organiser_chain == sender {
                tournament.update(update.clone());
                /* if let Some(status) = update.status {
                    tournament.status = status;
                    match status {
                        TournamentStatus::RegistrationClosed => todo!(), // we start the tournament and switch to inprogress
                        TournamentStatus::InProgress => todo!(),         // we update to completed
                        TournamentStatus::Completed => todo!(),
                        TournamentStatus::Cancelled => todo!(), // we update to cancelled
                        _ => (),
                    }
                } */
            }

            self.runtime.emit(
                STREAM_NAME.into(),
                &Event::Tournament {
                    value: tournament.to_owned(),
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

        let mut participants = self
            .state
            .participants
            .get(&tournament_id)
            .await
            .ok()
            .flatten()
            .unwrap_or_default();

        if participants.contains(&owner) {
            return;
        }

        if (participants.len() as u32) >= tournament.max_players.unwrap_or(16) {
            return;
        }
        participants.push(owner.clone()); // Clone for storage
        let _ = self.state.participants.insert(&tournament_id, participants);

        let _ = self.state.tournament_players.insert(&owner, player.clone());

        self.runtime.emit(
            STREAM_NAME.into(),
            &Event::TournamentRegistration {
                tournament_id: tournament_id.clone(),
                owner,
                player,
            },
        );
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

        let mut participants = self
            .state
            .participants
            .get(&tournament_id)
            .await
            .ok()
            .flatten()
            .unwrap_or_default();

        let before_len = participants.len();
        participants.retain(|v| v != &owner);

        if participants.len() == before_len {
            return;
        }

        self.state
            .participants
            .insert(&tournament_id, participants)
            .ok();

        self.state.tournament_players.remove(&owner).ok();

        self.runtime.emit(
            STREAM_NAME.into(),
            &Event::TournamentWithDraw {
                tournament_id,
                owner,
            },
        );
    }
}
