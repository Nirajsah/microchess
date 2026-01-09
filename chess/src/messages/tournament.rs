use std::str::FromStr;

use chess::{
    notifications::Notification,
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
    pub fn on_msg_handle_friendly_match_data(
        &mut self,
        chain_id: ChainId,
        notification: Notification,
    ) {
        self.state.game_chain.set(Some(chain_id));
        self.state.notifications.get_mut().push(notification);
    }

    pub fn on_msg_handle_notification(&mut self, notification: Notification) {
        self.state.notifications.get_mut().push(notification);
    }
    /// First message on tournament_chain to process the tournament
    pub async fn on_msg_process_tournament(&mut self, tournament: Tournament) {
        self.state.save_tournament(tournament).await;
    }

    /// Method used by app_chain to create a new chain send a cross-chain message with the tournament as payload
    pub async fn on_msg_host_tournament(&mut self, tournament: Tournament) {
        assert_eq!(self.runtime.chain_id(), self.app_chain());
        let now = self.runtime.system_time();
        let organiser_chain = tournament.organiser_chain;

        let chain = self.create_chain(tournament.organiser_id);

        let mut t = tournament.clone();
        t.tournament_chain = Some(chain);

        self.state.tournament_chains.get_mut().push(chain);

        let message = Message::ProcessTournament { value: Box::new(t) };

        let notification_message = Message::Notification {
            notification: Notification::tournament_published(
                "Tournament Was Published".to_string(),
                chain,
                tournament.tournament_name,
                self.app_chain(),
                now,
            ),
        };

        // send tournament organiser detailed notification about the published tournament
        self.runtime
            .send_message(organiser_chain, notification_message);

        // send tournament to newly create chain
        self.runtime.send_message(chain, message);

        // send chain detail to subscriber
        self.runtime
            .emit(STREAM_NAME.into(), &Event::TournamentChain { chain });
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

        if let Some(participants) = self.state.participants.get_mut() {
            participants.try_add_player(owner, player.clone());
        };
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
}
