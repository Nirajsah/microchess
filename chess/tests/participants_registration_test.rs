//! Participants Registration tests for the MicroChess's Tournaments.

#![cfg(not(target_arch = "wasm32"))]

use chess::{
    player::PlayerProfile,
    tournament::{
        utils::{Match, Participants, TournamentParticipant},
        GameMode, MatchType, PrizeType, TimeControlInput, Tournament, TournamentFormat,
        TournamentInput, TournamentStatus, TournamentUpdate, Visibility,
    },
    ChessAbi, InstantiationArgument, Operation,
};
use linera_chain::types::ConfirmedBlockCertificate;
use linera_sdk::{
    linera_base_types::{ApplicationId, BlobType, ChainDescription, TimeDelta, Timestamp},
    test::{ActiveChain, QueryOutcome, TestValidator},
};

fn create_default_instantiation_args() -> InstantiationArgument {
    InstantiationArgument {
        start_time: TimeDelta::from_secs(900),
        increment: TimeDelta::from_secs(0),
        block_delay: TimeDelta::from_secs(5),
    }
}

async fn create_player_profile(
    chain: &ActiveChain,
    app_id: ApplicationId<ChessAbi>,
    name: String,
) -> PlayerProfile {
    let operation = Operation::Profile { name: name.clone() };
    chain
        .add_block(|block| {
            block.with_operation(app_id, operation);
        })
        .await;

    let QueryOutcome { response, .. } = chain
        .graphql_query(
            app_id,
            "query { profile { id name elo matches won lost ath chainId } }",
        )
        .await;

    let profile: PlayerProfile =
        serde_json::from_value(response["profile"].clone()).expect("Failed to deserialize profile");

    assert_eq!(
        profile.name.as_ref().unwrap(),
        &name,
        "Profile creation failed"
    );

    profile
}

#[tokio::test(flavor = "multi_thread")]
async fn test_tournament() {
    let (validator, module_id) =
        TestValidator::with_current_module::<chess::ChessAbi, (), InstantiationArgument>().await;
    let mut app_chain = validator.new_chain().await;

    let player_1_chain = validator.new_chain().await;
    let key_pair_1 = player_1_chain.key_pair();

    let instantiation = create_default_instantiation_args();
    let app_id = app_chain
        .create_application(module_id, (), instantiation, vec![])
        .await;

    let player_1_name = "John Doe".to_string();

    let _player_1 = create_player_profile(&player_1_chain, app_id, player_1_name.clone()).await;

    let value = TournamentInput {
        organiser_chain: Some(player_1_chain.id()),
        organiser_id: Some(player_1_chain.public_key().into()),
        organiser_name: player_1_name.clone(),
        tournament_id: None,
        tournament_name: "Teigjoeiagst".to_string(),
        tournament_description: None,
        tournament_format: TournamentFormat::Swiss,
        max_players: 16,
        min_players: 4,
        match_type: MatchType::Bo1,
        round_count: None,
        time_control: TimeControlInput {
            base_minutes: 10,
            increment_seconds: 5,
            mode_label: Some("Classic".to_string()),
        },
        game_mode: GameMode::Standard,
        starting_time: 10u64,
        end_time: 10u64,
        prize_type: PrizeType::Tokens,
        prize_pool: 100,
        prize_pool_description: None,
        visibility: Visibility::Public,
        banner_image_url: None,
        sponsor_logo_url: None,
        custom_tags: vec![],
        version: None,
        created_at: None,
        updated_at: None,
        status: TournamentStatus::RegistrationOpen,
    };

    let certificate = test_host_tournament(&player_1_chain, app_id, value.clone()).await;

    let tournament_query = "
        query {
          tournament {
            organiserChain
            organiserId
            organiserName
            tournamentId
            tournamentName
            tournamentDescription
            tournamentChain
            tournamentFormat
            matchType
            gameMode
            timeControl {
                baseMinutes
                incrementSeconds
                modeLabel
            }
            maxPlayers
            minPlayers
            roundCount
            startingTime
            endTime
            prizeType
            prizePool
            prizePoolDescription
            visibility
            bannerImageUrl
            sponsorLogoUrl
            customTags
            version
            createdAt
            updatedAt
            status
          }
        }";

    let certificate = app_chain
        .add_block(|block| {
            block.with_messages_from(&certificate);
        })
        .await;

    let block = certificate.inner().block();
    let description = block
        .created_blobs()
        .into_iter()
        .filter_map(|(blob_id, blob)| {
            (blob_id.blob_type == BlobType::ChainDescription)
                .then(|| bcs::from_bytes::<ChainDescription>(blob.content().bytes()).unwrap())
        })
        .next()
        .unwrap();

    let tournament_chain = ActiveChain::new(key_pair_1.copy(), description, validator);
    tournament_chain.handle_received_messages().await;

    let QueryOutcome { response, .. } = tournament_chain
        .graphql_query(app_id, tournament_query)
        .await;

    let data: Option<Tournament> = serde_json::from_value(response["tournament"].clone())
        .expect("Failed to deserialize tournament data");

    let data = data.unwrap();

    // Assert logic
    assert_eq!(data.organiser_chain, value.organiser_chain.unwrap());
    assert_eq!(data.organiser_id, value.organiser_id.unwrap());
    assert_eq!(data.organiser_name, value.organiser_name);
    assert_eq!(data.tournament_name, value.tournament_name);
    assert_eq!(data.tournament_format, value.tournament_format);
    assert_eq!(data.match_type, value.match_type);
    assert_eq!(data.game_mode, value.game_mode);

    assert_eq!(
        data.time_control.clone().base_minutes,
        value.time_control.clone().base_minutes
    );
    assert_eq!(
        data.time_control.clone().increment_seconds,
        value.time_control.clone().increment_seconds
    );
    assert_eq!(data.time_control.mode_label, value.time_control.mode_label);

    assert_eq!(data.starting_time, Timestamp::from(value.starting_time));

    assert_eq!(data.end_time, Timestamp::from(value.end_time));

    assert_eq!(data.prize_pool, value.prize_pool);
    assert_eq!(data.prize_type, value.prize_type);
    assert_eq!(data.visibility, value.visibility);

    assert_eq!(data.custom_tags, value.custom_tags);
    assert_eq!(data.status, value.status);

    assert!(!data.version.is_empty());

    // let participants_chains = create_participants(&validator, app_id).await;
    //
    // for chain in participants_chains {
    //     let certificate = test_participant_registration(&chain, app_id, &id).await;
    //     app_chain
    //         .add_block(|block| {
    //             block.with_messages_from(&certificate);
    //         })
    //         .await;
    // }
    //
    // let query_participants = format!(
    //     r#"
    //         query {{ participants(id: "{}") }}
    //     "#,
    //     id
    // );
    //
    // let QueryOutcome { response, .. } = app_chain.graphql_query(app_id, query_participants).await;
    //
    // let data: String = serde_json::from_value(response["participants"].clone())
    //     .expect("Failed to deserialize participants data");
    //
    // let participants: Participants = Participants::decode(data);
    //
    // process_players(&participants);
    //
    // let certificate = test_update_tournament(&player_1_chain, app_id, id.clone()).await;
    //
    // app_chain
    //     .add_block(|block| {
    //         block.with_messages_from(&certificate);
    //     })
    //     .await;
    //
    // let query_tournament_matches = format!(
    //     r#"
    //         query {{ tournamentMatches(id: "{}") {{
    //             matchId
    //             tournamentId
    //             playerA
    //             playerB
    //             round
    //             result
    //         }} }}
    //     "#,
    //     id
    // );
    //
    // let QueryOutcome { response, .. } = app_chain
    //     .graphql_query(app_id, query_tournament_matches)
    //     .await;
    //
    // let data: Vec<Match> = serde_json::from_value(response["tournamentMatches"].clone())
    //     .expect("Failed to deserialize participants data");
    //
    // assert_eq!(data.len(), 8);
}

pub fn process_players(participants: &Participants) {
    match participants {
        Participants::Swiss(p) => process_player_list(&p.players),
        Participants::SingleElim(p) => process_player_list(&p.players),
    }
}

fn process_player_list<T: TournamentParticipant>(players: &[T]) {
    assert_eq!(players.len(), 16);
}

async fn test_host_tournament(
    chain: &ActiveChain,
    app_id: ApplicationId<ChessAbi>,
    value: TournamentInput,
) -> ConfirmedBlockCertificate {
    let operation = Operation::HostTournament {
        value: Box::new(value),
    };

    chain
        .add_block(|block| {
            block.with_operation(app_id, operation);
        })
        .await
}

async fn test_update_tournament(
    chain: &ActiveChain,
    app_id: ApplicationId<ChessAbi>,
    tournament_id: String,
) -> ConfirmedBlockCertificate {
    let operation = Operation::UpdateTournament {
        tournament_id,
        update: Box::new(TournamentUpdate {
            status: Some(TournamentStatus::RegistrationClosed),
            banner_image_url: None,
            custom_tags: None,
            prize_pool: None,
            prize_type: None,
            sponsor_logo_url: None,
            tournament_description: None,
            tournament_name: None,
            visibility: None,
        }),
    };

    chain
        .add_block(|block| {
            block.with_operation(app_id, operation);
        })
        .await
}

async fn create_participants(
    validator: &TestValidator,
    app_id: ApplicationId<ChessAbi>,
) -> Vec<ActiveChain> {
    let mut participants_chains = Vec::with_capacity(16);

    for number in 0..16 {
        let player_name = format!("{}{}", "John Done", number);
        let player_chain = validator.new_chain().await;
        let _player = create_player_profile(&player_chain, app_id, player_name.clone()).await;
        participants_chains.push(player_chain);
    }

    participants_chains
}

async fn test_participant_registration(
    chain: &ActiveChain,
    app_id: ApplicationId<ChessAbi>,
    tournament_id: &str,
) -> ConfirmedBlockCertificate {
    let operation = Operation::TournamentRegistration {
        tournament_id: tournament_id.to_string(),
        tournament_chain: "gaieoga".to_string(),
    };

    chain
        .add_block(|block| {
            block.with_operation(app_id, operation);
        })
        .await
}
