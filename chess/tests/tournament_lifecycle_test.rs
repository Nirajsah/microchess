//! Tournament lifecycle tests for MicroChess.

#![cfg(not(target_arch = "wasm32"))]

use chess::{
    player::PlayerProfile,
    tournament::{
        GameMode, MatchType, PrizeType, TimeControlInput, TournamentFormat, TournamentInput,
        TournamentStatus, TournamentUpdate, Visibility,
    },
    ChessAbi, InstantiationArgument, Operation,
};
use linera_chain::types::ConfirmedBlockCertificate;
use linera_sdk::{
    linera_base_types::{ApplicationId, BlobType, ChainDescription, TimeDelta},
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

    profile
}

async fn host_tournament(
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

async fn get_tournament_chain(
    app_chain: &ActiveChain,
    _app_id: ApplicationId<ChessAbi>,
    validator: &TestValidator,
    organiser_chain: &ActiveChain,
    certificate: &ConfirmedBlockCertificate,
) -> ActiveChain {
    let certificate = app_chain
        .add_block(|block| {
            block.with_messages_from(certificate);
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
        .expect("Failed to find ChainDescription blob");

    let key_pair = organiser_chain.key_pair();
    let tournament_chain = ActiveChain::new(key_pair.copy(), description, validator.clone());

    // Process messages to initialize the chain
    tournament_chain.handle_received_messages().await;

    tournament_chain
}

#[tokio::test(flavor = "multi_thread")]
async fn test_tournament_cancellation() {
    let (validator, module_id) =
        TestValidator::with_current_module::<chess::ChessAbi, (), InstantiationArgument>().await;
    let mut app_chain = validator.new_chain().await;
    let organiser_chain = validator.new_chain().await;
    let player_1_chain = validator.new_chain().await;

    let instantiation = create_default_instantiation_args();
    let app_id = app_chain
        .create_application(module_id, (), instantiation, vec![])
        .await;

    let _ = create_player_profile(&organiser_chain, app_id, "Organiser".to_string()).await;
    let _ = create_player_profile(&player_1_chain, app_id, "Player 1".to_string()).await;

    let input = TournamentInput {
        organiser_chain: Some(organiser_chain.id()),
        organiser_id: Some(organiser_chain.public_key().into()),
        organiser_name: "Organiser".to_string(),
        tournament_id: None,
        tournament_name: "Cancelled Tournament".to_string(),
        tournament_description: None,
        tournament_format: TournamentFormat::Swiss,
        max_players: 10,
        min_players: 4,
        match_type: MatchType::Bo1,
        round_count: None,
        time_control: TimeControlInput::default(),
        game_mode: GameMode::Standard,
        starting_time: 0,
        end_time: 0,
        prize_type: PrizeType::Tokens,
        prize_pool: 0,
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

    let cert = host_tournament(&organiser_chain, app_id, input.clone()).await;
    let tournament_chain =
        get_tournament_chain(&app_chain, app_id, &validator, &organiser_chain, &cert).await;

    let QueryOutcome { response, .. } = tournament_chain
        .graphql_query(app_id, "query { tournament { tournamentId } }")
        .await;
    let tournament_id = response["tournament"]["tournamentId"]
        .as_str()
        .unwrap()
        .to_string();
    let tournament_chain_id = tournament_chain.id();

    player_1_chain
        .add_block(|block| {
            block.with_operation(
                app_id,
                Operation::TournamentRegistration {
                    tournament_id: tournament_id.clone(),
                    tournament_chain: tournament_chain_id.to_string(),
                },
            );
        })
        .await;

    tournament_chain.handle_received_messages().await;

    test_update_tournament(&tournament_chain, app_id, tournament_id.clone()).await;

    let QueryOutcome { response, .. } = tournament_chain
        .graphql_query(app_id, "query { tournament { status } }")
        .await;

    let status: TournamentStatus =
        serde_json::from_value(response["tournament"]["status"].clone()).unwrap();
    assert_eq!(status, TournamentStatus::Cancelled);
}

#[tokio::test(flavor = "multi_thread")]
async fn test_tournament_start() {
    let (validator, module_id) =
        TestValidator::with_current_module::<chess::ChessAbi, (), InstantiationArgument>().await;
    let mut app_chain = validator.new_chain().await;
    let organiser_chain = validator.new_chain().await;

    let instantiation = create_default_instantiation_args();
    let app_id = app_chain
        .create_application(module_id, (), instantiation, vec![])
        .await;

    let _ = create_player_profile(&organiser_chain, app_id, "Organiser".to_string()).await;

    let min_players = 4;
    let input = TournamentInput {
        organiser_chain: Some(organiser_chain.id()),
        organiser_id: Some(organiser_chain.public_key().into()),
        organiser_name: "Organiser".to_string(),
        tournament_id: None,
        tournament_name: "Active Tournament".to_string(),
        tournament_description: None,
        tournament_format: TournamentFormat::Swiss,
        max_players: 10,
        min_players,
        match_type: MatchType::Bo1,
        round_count: Some(3),
        time_control: TimeControlInput::default(),
        game_mode: GameMode::Standard,
        starting_time: 0,
        end_time: 0,
        prize_type: PrizeType::Tokens,
        prize_pool: 0,
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

    let cert = host_tournament(&organiser_chain, app_id, input.clone()).await;
    let tournament_chain =
        get_tournament_chain(&app_chain, app_id, &validator, &organiser_chain, &cert).await;

    let QueryOutcome { response, .. } = tournament_chain
        .graphql_query(app_id, "query { tournament { tournamentId } }")
        .await;
    println!("Start/Progression Response: {:?}", response);
    let tournament_id = response["tournament"]["tournamentId"]
        .as_str()
        .unwrap()
        .to_string();
    let tournament_chain_id = tournament_chain.id();

    let participants = create_participants(&validator, app_id, 4).await;

    for (participant, _) in &participants {
        participant
            .add_block(|block| {
                block.with_operation(
                    app_id,
                    Operation::TournamentRegistration {
                        tournament_id: tournament_id.clone(),
                        tournament_chain: tournament_chain_id.to_string(),
                    },
                );
            })
            .await;
    }

    tournament_chain.handle_received_messages().await;

    // Close Registration
    test_update_tournament(&tournament_chain, app_id, tournament_id.clone()).await;

    let QueryOutcome { response, .. } = tournament_chain
        .graphql_query(app_id, "query { tournament { status } }")
        .await;

    let status: TournamentStatus =
        serde_json::from_value(response["tournament"]["status"].clone()).unwrap();

    assert_ne!(status, TournamentStatus::Cancelled);

    tournament_chain
        .add_block(|block| {
            block.with_operation(app_id, Operation::StartRound { tournament_id });
        })
        .await;

    let QueryOutcome { response, .. } = tournament_chain
        .graphql_query(
            app_id,
            "query { tournamentRound { round matches { matchId playerA playerB } } }",
        )
        .await;

    let round = &response["tournamentRound"];
    assert!(!round.is_null());

    // access matches directly from the round object
    let matches = round["matches"].as_array().unwrap();
    assert_eq!(matches.len(), 2);
}

// Full Progression Test
// Full progression test omitted due to complexity of mocking game play.

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
    count: u8,
) -> Vec<(ActiveChain, String)> {
    let mut participants = Vec::with_capacity(count as usize);

    for number in 0..count {
        let player_name = format!("{}{}", "Player ", number);
        let player_chain = validator.new_chain().await;
        // ensure player has a profile
        let _ = create_player_profile(&player_chain, app_id, player_name.clone()).await;
        // Profile has player_hash? No, but we can query it or derive it.
        // `create_player_profile` returns `PlayerProfile`.
        // `PlayerProfile` has `player_hash`?
        // Let's check `create_player_profile` return type.
        // It returns `PlayerProfile`.
        // Struct definition of PlayerProfile?
        // In `tests/tournament_test.rs` step 87: `profile.name`, `profile.elo` etc.
        // It likely has `id` or `playerHash` field if the schema expose it.
        // `participants_registration_test.rs` query: `playerHash { value }`.

        // Let's update `create_player_profile` to fetch hash if needed, or just fetch it here.
        // Ideally we fetch it.

        let QueryOutcome { response, .. } = player_chain
            .graphql_query(app_id, "query { profile { playerHash { value } } }") // Value is inside PlayerHash struct wrapper maybe?
            .await;

        // Check structure of PlayerHash. In `game.rs` it uses `PlayerHash`.
        // If response has it.
        let hash = response["profile"]["playerHash"].clone();
        // It might be an object or string?
        // Assuming object with fields? Or custom scalar?
        // Let's check `Participants` usage.
        // `state.rs`: `HashMap<String, PlayerHash>`. key is string rep.

        // Let's assume serialization works.
        // But for comparison, string is easiest.
        let hash_str = hash.to_string(); // This might be JSON string.
                                         // If `PlayerHash` is struct, `serde` serailizes it.

        // Let's rely on extracting `value` if it exists, or just the whole thing?
        // In `contract.rs` `PlayerHash` is used.
        // Let's look at `participants_registration_test.rs` for how it handles hashes?
        // It doesn't seem to use hashes deeply.

        // I'll grab the raw JSON of the hash to compare.
        participants.push((player_chain, hash_str));
    }

    participants
}
