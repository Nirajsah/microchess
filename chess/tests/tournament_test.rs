//! Tournament tests for the MicroChess.

#![cfg(not(target_arch = "wasm32"))]

use chess::{
    playerprofile::PlayerProfile,
    tournament::{
        GameMode, MatchType, PrizeType, TimeControlInput, TournamentFormat, TournamentInput,
        TournamentStatus, Visibility,
    },
    ChessAbi, InstantiationArgument, Operation,
};
use linera_chain::types::ConfirmedBlockCertificate;
use linera_sdk::{
    linera_base_types::{ApplicationId, TimeDelta},
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
    chain: ActiveChain,
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

    let instantiation = create_default_instantiation_args();
    let app_id = app_chain
        .create_application(module_id, (), instantiation, vec![])
        .await;

    let player_1_name = "John Doe".to_string();

    let _player_1 =
        create_player_profile(player_1_chain.clone(), app_id, player_1_name.clone()).await;

    let _value = TournamentInput {
        organiser_chain: Some(player_1_chain.id()),
        organiser_id: Some(player_1_chain.public_key().into()),
        organiser_name: player_1_name,
        tournament_id: None,
        tournament_name: "Test".to_string(),
        tournament_description: None,
        tournament_format: Some(TournamentFormat::Swiss),
        max_players: Some(16),
        min_players: Some(4),
        match_type: Some(MatchType::Bo1),
        time_control: Some(TimeControlInput {
            base_minutes: 40,
            increment_seconds: 50,
            mode_label: Some("Classic".to_string()),
        }),
        game_mode: GameMode::Standard,
        starting_time: Some(100u64),
        end_time: Some(1000u64),
        prize_type: Some(PrizeType::Tokens),
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
    // let certificate = test_host_tournament(player_1_chain.clone(), app_id, value.clone()).await;

    /* let QueryOutcome { response, .. } = player_1_chain
        .graphql_query(app_id, "query { myTournaments }")
        .await;

    let res: Vec<Tournament> = serde_json::from_value(response["myTournaments"].clone())
        .expect("Failed to deserialize response"); */

    // let id = res[0].tournament_id.clone();

    /* app_chain
    .add_block(|block| {
        block.with_messages_from(&certificate);
    })
    .await; */

    /* let query = format!(
        r#"
            query {{
                tournament(id: "{}") {{
                    organiserChain
                    organiserId
                    organiserName
                    tournamentId
                    tournamentName

                    tournamentFormat
                    matchType
                    gameMode
                    timeControl {{
                        baseMinutes
                        incrementSeconds
                        modeLabel
                    }}
                    maxPlayers
                    minPlayers
                    startingTime
                    endTime
                    prizePool
                    prizeType

                    visibility
                    customTags

                    version
                    createdAt
                    updatedAt
                    status
                }}
            }}
            "#,
        id
    );

    let QueryOutcome { response, .. } = app_chain.graphql_query(app_id, query).await;

    let data: Tournament = serde_json::from_value(response["tournament"].clone())
        .expect("Failed to deserialize tournament data");

    // Assert logic
    assert_eq!(data.organiser_chain, value.organiser_chain.unwrap());
    assert_eq!(data.organiser_id, value.organiser_id.unwrap());
    assert_eq!(data.organiser_name, value.organiser_name);
    assert_eq!(data.tournament_id, id.to_owned());
    assert_eq!(data.tournament_name, value.tournament_name);
    assert_eq!(data.tournament_format, value.tournament_format.unwrap());
    assert_eq!(data.match_type, value.match_type.unwrap());
    assert_eq!(data.game_mode, value.game_mode);

    assert_eq!(
        data.time_control.clone().unwrap().base_minutes,
        value.time_control.clone().unwrap().base_minutes
    );
    assert_eq!(
        data.time_control.clone().unwrap().increment_seconds,
        value.time_control.clone().unwrap().increment_seconds
    );
    assert_eq!(
        data.time_control.unwrap().mode_label,
        value.time_control.unwrap().mode_label
    );

    assert_eq!(
        data.starting_time,
        Timestamp::from(value.starting_time.unwrap())
    );

    assert_eq!(data.end_time, Timestamp::from(value.end_time.unwrap()));

    assert_eq!(data.prize_pool, value.prize_pool);
    assert_eq!(data.prize_type, value.prize_type.unwrap());
    assert_eq!(data.visibility, value.visibility);

    assert_eq!(data.custom_tags, value.custom_tags);
    assert_eq!(data.status, value.status);

    assert!(!data.version.is_empty()); */
}

async fn _test_host_tournament(
    chain: ActiveChain,
    app_id: ApplicationId<ChessAbi>,
    value: TournamentInput,
) -> ConfirmedBlockCertificate {
    let operation = Operation::HostTournament { value };

    chain
        .add_block(|block| {
            block.with_operation(app_id, operation);
        })
        .await
}
