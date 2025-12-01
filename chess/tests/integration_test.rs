//! Integration tests for the MicroChess.

#![cfg(not(target_arch = "wasm32"))]

use chess::{playerprofile::PlayerProfile, ChessAbi, GameChain, InstantiationArgument, Operation};
use linera_chain::types::ConfirmedBlockCertificate;
use linera_sdk::{
    linera_base_types::{
        AccountSecretKey, ApplicationId, BlobType, ChainDescription, Secp256k1SecretKey, TimeDelta,
    },
    serde_json,
    test::{ActiveChain, QueryOutcome, TestValidator},
};

fn create_default_instantiation_args() -> InstantiationArgument {
    InstantiationArgument {
        start_time: TimeDelta::from_secs(900),
        increment: TimeDelta::from_secs(0),
        block_delay: TimeDelta::from_secs(5),
    }
}

#[tokio::test(flavor = "multi_thread")]
async fn application_test() {
    let (validator, module_id) =
        TestValidator::with_current_module::<chess::ChessAbi, (), InstantiationArgument>().await;
    let mut app_chain = validator.new_chain().await;

    let player_1_chain = validator.new_chain().await;
    let player_2_chain = validator.new_chain().await;

    let instantiation = create_default_instantiation_args();
    let app_id = app_chain
        .create_application(module_id, (), instantiation, vec![])
        .await;

    // Operation::Player
    let player_1_name = "John Doe".to_string();
    let player_2_name = "Jane Doe".to_string();

    let _player_1 = create_player_profile(player_1_chain.clone(), app_id, player_1_name).await;
    let _player_2 = create_player_profile(player_2_chain.clone(), app_id, player_2_name).await;

    let player1_certificate = test_request_new_game(player_1_chain.clone(), app_id).await;

    // App chain processes player 1's request
    app_chain
        .add_block(|block| {
            block.with_messages_from(&player1_certificate);
        })
        .await;

    // Player 2 requests game - capture certificate
    let player2_certificate = test_request_new_game(player_2_chain.clone(), app_id).await;

    let key_pair1 = player_1_chain.key_pair();
    let key_pair2 = player_2_chain.key_pair();

    // App chain processes player 2's request
    let certificate = app_chain
        .add_block(|block| {
            block.with_messages_from(&player2_certificate);
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

    let mut game_chain = ActiveChain::new(key_pair1.copy(), description, validator);

    game_chain
        .add_block(|block| {
            block.with_messages_from(&certificate);
            block.with_operation(
                app_id,
                Operation::MakeMove {
                    from: "e2".to_string(),
                    to: "e4".to_string(),
                    piece: "wP".to_string(),
                },
            );
        })
        .await;

    let QueryOutcome { response, .. } =
        game_chain.graphql_query(app_id, "query { mvString }").await;

    
    // Player 1 processes messages from app_chain (receives GameChainData)
    player_1_chain.handle_received_messages().await;

    // Player 2 processes messages from app_chain (receives GameChainData)
    player_2_chain.handle_received_messages().await;

    let chain_metadata_1: GameChain = test_query_chain_metadata(player_1_chain, app_id).await;
    let chain_metadata_2: GameChain = test_query_chain_metadata(player_2_chain, app_id).await;

    assert_eq!(
        chain_metadata_1, chain_metadata_2,
        "Both players should have the same game chain"
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn test_random_match() {
    let (validator, module_id) =
        TestValidator::with_current_module::<chess::ChessAbi, (), InstantiationArgument>().await;
    let mut app_chain = validator.new_chain().await;

    let player_1_chain = validator.new_chain().await;
    let player_2_chain = validator.new_chain().await;

    let instantiation = create_default_instantiation_args();
    let app_id = app_chain
        .create_application(module_id, (), instantiation, vec![])
        .await;

    let player_1_name = "John Doe".to_string();
    let player_2_name = "Jane Doe".to_string();

    let _player_1 = create_player_profile(player_1_chain.clone(), app_id, player_1_name).await;
    let _player_2 = create_player_profile(player_2_chain.clone(), app_id, player_2_name).await;

    let player1_certificate = test_request_new_game(player_1_chain.clone(), app_id).await;

    app_chain
        .add_block(|block| {
            block.with_messages_from(&player1_certificate);
        })
        .await;

    let player2_certificate = test_request_new_game(player_2_chain.clone(), app_id).await;

    app_chain
        .add_block(|block| {
            block.with_messages_from(&player2_certificate);
        })
        .await;

    player_1_chain.handle_received_messages().await;
    player_2_chain.handle_received_messages().await;

    let chain_metadata_1 = test_query_chain_metadata(player_1_chain, app_id).await;
    let chain_metadata_2 = test_query_chain_metadata(player_2_chain, app_id).await;

    assert_eq!(
        chain_metadata_1, chain_metadata_2,
        "Both players should have the same game chain"
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn test_friendly_match() {
    let (validator, module_id) =
        TestValidator::with_current_module::<chess::ChessAbi, (), InstantiationArgument>().await;
    let mut app_chain = validator.new_chain().await;

    let player_1_chain = validator.new_chain().await;
    let player_2_chain = validator.new_chain().await;

    let instantiation = create_default_instantiation_args();
    let app_id = app_chain
        .create_application(module_id, (), instantiation, vec![])
        .await;

    let player_1_name = "Alice".to_string();
    let player_2_name = "Bob".to_string();

    let _player_1 = create_player_profile(player_1_chain.clone(), app_id, player_1_name).await;
    let _player_2 = create_player_profile(player_2_chain.clone(), app_id, player_2_name).await;

    let friend_id = test_request_friend_id(player_1_chain.clone(), app_id).await;

    let player2_certificate =
        test_join_friendly_game(player_2_chain.clone(), app_id, friend_id).await;

    app_chain
        .add_block(|block| {
            block.with_messages_from(&player2_certificate);
        })
        .await;

    player_1_chain.handle_received_messages().await;
    player_2_chain.handle_received_messages().await;

    let chain_metadata_1 = test_query_chain_metadata(player_1_chain, app_id).await;
    let chain_metadata_2 = test_query_chain_metadata(player_2_chain, app_id).await;

    assert_eq!(
        chain_metadata_1, chain_metadata_2,
        "Both players should have the same game chain"
    );
}

async fn test_query_chain_metadata(
    chain: ActiveChain,
    app_id: ApplicationId<ChessAbi>,
) -> GameChain {
    let QueryOutcome { response, .. } = chain
        .graphql_query(app_id, "query { gameChain { chainId timestamp } }")
        .await;

    serde_json::from_value(response["gameChain"].clone()).expect("Failed to deserialize gameChain")
}

async fn test_request_new_game(
    chain: ActiveChain,
    app_id: ApplicationId<ChessAbi>,
) -> ConfirmedBlockCertificate {
    let operation = Operation::NewGame;
    chain
        .add_block(|block| {
            block.with_operation(app_id, operation);
        })
        .await
}

async fn test_request_friend_id(chain: ActiveChain, app_id: ApplicationId<ChessAbi>) -> String {
    let operation = Operation::FrGame;
    chain
        .add_block(|block| {
            block.with_operation(app_id, operation);
        })
        .await;

    let QueryOutcome { response, .. } = chain.graphql_query(app_id, "query { friendId }").await;

    response["friendId"]
        .as_str()
        .expect("friendId should be a string")
        .to_string()
}

async fn test_join_friendly_game(
    chain: ActiveChain,
    app_id: ApplicationId<ChessAbi>,
    token: String,
) -> ConfirmedBlockCertificate {
    let operation = Operation::FrGameHash { token };
    chain
        .add_block(|block| {
            block.with_operation(app_id, operation);
        })
        .await
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

/*
1. Operations:

        /*
            Profile {
                name: String,
            },
            NewGame,
            FrGame,
            FrGameHash {
                token: String,
            },
        */

        // match operations
        MakeMove {
            from: String,
            to: String,
            piece: String,
        },
        PawnPromotion {
            from: String,
            to: String,
            piece: String,
            promoted_piece: String,
        },
        Resign,
        DeleteChainMetadata,
        // basic user operations
        Subscribe,

*/
