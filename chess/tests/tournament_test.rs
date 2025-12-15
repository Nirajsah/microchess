//! Tournament tests for the MicroChess.

#![cfg(not(target_arch = "wasm32"))]

use chess::{
    playerprofile::PlayerProfile,
    tournament::{
        GameMode, MatchType, PrizeType, TimeControlInput, Tournament, TournamentFormat,
        TournamentInput, TournamentStatus, Visibility,
    },
    ChessAbi, InstantiationArgument, Operation,
};
use linera_chain::types::ConfirmedBlockCertificate;
use linera_sdk::{
    linera_base_types::{ApplicationId, TimeDelta, Timestamp},
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

    let _player_1 = create_player_profile(player_1_chain.clone(), app_id, player_1_name).await;

    let value = TournamentInput {
        organiser_chain: player_1_chain.id(),
        organiser_id: player_1_chain.public_key().into(),
        organiser_name: "Dove".to_string(),
        tournament_id: None,
        tournament_name: "Test".to_string(),
        tournament_description: None,
        tournament_format: TournamentFormat::Swiss,
        max_players: Some(16),
        min_players: Some(4),
        round_count: Some(4),
        allow_late_join: false,
        match_type: MatchType::Bo1,
        time_control: TimeControlInput {
            base_minutes: 40,
            increment_seconds: 50,
            mode_label: Some("Classic".to_string()),
        },
        game_mode: GameMode::Standard,
        starting_time: Timestamp::from(100),
        end_time: Timestamp::from(1000),
        round_time_limit_minutes: Timestamp::from(100),
        check_in_time: Timestamp::from(300),
        prize_type: vec![PrizeType::Tokens],
        prize_pool: 100,
        prize_pool_description: None,
        visibility: Visibility::Public,
        invite_only: false,
        access_code: None,
        banner_image_url: None,
        sponsor_logo_url: None,
        custom_tags: vec![],
        version: None,
        created_at: None,
        updated_at: None,
        status: TournamentStatus::RegistrationOpen,
    };

    let certificate = test_host_tournament(player_1_chain.clone(), app_id, value.clone()).await;

    let QueryOutcome { response, .. } = player_1_chain
        .graphql_query(app_id, "query { myTournament }")
        .await;

    let res: Vec<String> = serde_json::from_value(response["myTournament"].clone())
        .expect("Failed to deserialize gameChain");

    let id = res.get(0).expect("failed to get anything");

    app_chain
        .add_block(|block| {
            block.with_messages_from(&certificate);
        })
        .await;

    let query = format!(
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
                    allowLateJoin
                    maxPlayers
                    minPlayers
                    roundCount
                    
                    
                    startingTime
                    endTime
                    roundTimeLimitMinutes
                    checkInTime
                    
                    prizePool
                    prizeType
                    
                    visibility
                    inviteOnly
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
    assert_eq!(data.organiser_chain, value.organiser_chain);
    assert_eq!(data.organiser_id, value.organiser_id);
    assert_eq!(data.organiser_name, value.organiser_name);
    assert_eq!(data.tournament_id, id.to_owned());
    assert_eq!(data.tournament_name, value.tournament_name);
    assert_eq!(data.tournament_format, value.tournament_format);
    assert_eq!(data.match_type, value.match_type);
    assert_eq!(data.game_mode, value.game_mode);

    assert_eq!(
        data.time_control.base_minutes,
        value.time_control.base_minutes
    );
    assert_eq!(
        data.time_control.increment_seconds,
        value.time_control.increment_seconds
    );
    assert_eq!(data.time_control.mode_label, value.time_control.mode_label);

    assert_eq!(data.allow_late_join, value.allow_late_join);

    assert_eq!(data.starting_time, value.starting_time);
    assert_eq!(data.end_time, value.end_time);
    assert_eq!(
        data.round_time_limit_minutes,
        value.round_time_limit_minutes
    );
    assert_eq!(data.check_in_time, value.check_in_time);

    assert_eq!(data.prize_pool, value.prize_pool);
    assert_eq!(data.prize_type, value.prize_type);
    assert_eq!(data.visibility, value.visibility);
    assert_eq!(data.invite_only, value.invite_only);
    assert_eq!(data.custom_tags, value.custom_tags);
    assert_eq!(data.status, value.status);

    assert!(!data.version.is_empty());
}

async fn test_host_tournament(
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
