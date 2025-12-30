use std::str::FromStr;

use chess::{
    player::PlayerHash,
    tournament::{
        utils::{Match, Participants, TParticipants},
        Tournament, TournamentInput, TournamentStatus, TournamentUpdate,
    },
};
use linera_sdk::linera_base_types::{AccountOwner, ChainId};
use log::info;

use crate::{event::Event, messages::Message, ChessContract, STREAM_NAME};

impl ChessContract {
    /// First message on tournament_chain to process the tournament
    pub async fn on_msg_process_tournament(&mut self, tournament: Tournament) {
        self.state.save_tournament(tournament).await;
    }

    /// Method used by app_chain to create a new chain send a cross-chain message with the tournament as payload
    pub async fn on_msg_host_tournament(&mut self, tournament: Tournament) {
        assert_eq!(self.runtime.chain_id(), self.app_chain());

        let chain = self.create_chain(tournament.organiser_id);
        let message = Message::ProcessTournament {
            value: Box::new(tournament),
        };

        // send tournament to newly create chain
        self.runtime.send_message(chain, message);

        // send chain detail to subscriber
        self.runtime
            .emit(STREAM_NAME.into(), &Event::TournamentChain { chain });
    }

    /// we don't really need this anymore as updates are handled by respective chains, needed in on_op_update_tournament to start a tournament, used on tournament_chain
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

        let _data: Option<Vec<Match>> = if let Some(status) = update.status {
            tournament.status = status;
            match status {
                TournamentStatus::RegistrationClosed => {
                    let matches = self
                        .state
                        .start_tournament_and_persist(&tournament_id)
                        .await;
                    tournament.status = TournamentStatus::InProgress;
                    matches
                } // we start the tournament and switch to inprogress
                TournamentStatus::InProgress => todo!(), // we update to completed
                TournamentStatus::Completed => todo!(),
                TournamentStatus::Cancelled => todo!(), // we update to cancelled
                _ => None,
            }
        } else {
            None
        };

        // we need to create game_chain and send data to players, Vec<Match> has the required data, (player_a: AccountOwner, player_b: AccountOwner)

        if self
            .state
            .tournaments
            .insert(&tournament_id, tournament.clone())
            .is_ok()
        {
            todo!()
            // self.runtime.emit(
            //     STREAM_NAME.into(),
            //     &Event::Tournament {
            //         value: Box::new(tournament),
            //     },
            // );
        }
        // update should be an enum with fields to update
        // emit events
        // app chain is responsible to emitting events to update supabase
    }

    /// Message received on tournament_chain to process the incoming participation request from a user
    pub async fn on_msg_tournament_participation(
        &mut self,
        tournament_id: String,
        owner: AccountOwner,
        player: PlayerHash,
    ) {
        let Some(tournament) = self.state.tournament.get() else {
            return;
        };

        if tournament.tournament_id != tournament_id
            || tournament.status != TournamentStatus::RegistrationOpen
        {
            return;
        }

        let Some(participants) = self.state.participants.get_mut() else {
            return;
        };

        if participants.try_add_player(owner) {
            let _ = self.state.players_data.insert(&owner, player.clone());
        }
    }

    pub async fn on_msg_tournament_withdraw(
        &mut self,
        _tournament_id: String,
        _owner: AccountOwner,
    ) {
        let app_chain = self.app_chain();
        assert_eq!(self.runtime.chain_id(), app_chain);
        todo!()

        // let Some(tournament) = self
        //     .state
        //     .tournaments
        //     .get(&tournament_id)
        //     .await
        //     .ok()
        //     .flatten()
        // else {
        //     return;
        // };

        // if tournament.status != TournamentStatus::RegistrationOpen {
        //     return;
        // }

        // let Some(mut participants) = self
        //     .state
        //     .participants
        //     .get(&tournament_id)
        //     .await
        //     .ok()
        //     .flatten()
        // else {
        //     return;
        // };

        // participants.remove_player(owner);

        // self.state.t_players.remove(&owner).ok();

        // self.state
        //     .participants
        //     .insert(&tournament_id, participants)
        //     .ok();

        // self.runtime.emit(
        //     STREAM_NAME.into(),
        //     &Event::TournamentWithDraw {
        //         tournament_id,
        //         owner,
        //     },
        // );
    }

    // pub fn on_msg_publish_tournament(&mut self, tournament: Tournament) {
    //     if self
    //         .state
    //         .tournaments
    //         .insert(&tournament.tournament_id.clone(), tournament.clone())
    //         .is_ok()
    //     {
    //         // let chain = self.create_chain(tournament.organiser_id);

    //         self.runtime
    //             .emit(STREAM_NAME.into(), &Event::Tournament { value: tournament });
    //     }
    // }
}
