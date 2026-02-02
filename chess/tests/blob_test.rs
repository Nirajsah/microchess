use chess::matches::MatchBlobData;
use postcard;

#[test]
fn test_match_blob_data_serialization() {
    let original_data = MatchBlobData {
        moves: vec!["e2e4".to_string(), "e7e5".to_string()],
        outcome: "Checkmate".to_string(),
    };

    // Serialize
    let encoded: Vec<u8> = postcard::to_allocvec(&original_data).unwrap();

    // Deserialize as MatchBlobData
    let decoded: MatchBlobData = postcard::from_bytes(&encoded).unwrap();
    assert_eq!(decoded.moves, original_data.moves);
    assert_eq!(decoded.outcome, original_data.outcome);
}

#[test]
fn test_backward_compatibility() {
    // Old format: just Vec<String>
    let moves = vec!["e2e4".to_string(), "c7c5".to_string()];
    let encoded_old: Vec<u8> = postcard::to_allocvec(&moves).unwrap();

    // Try reading as MatchBlobData (should fail)
    let as_new_struct = postcard::from_bytes::<MatchBlobData>(&encoded_old);
    assert!(as_new_struct.is_err());

    // Try reading fallback as Vec<String> (should succeed)
    let as_vec: Vec<String> = postcard::from_bytes(&encoded_old).unwrap();
    assert_eq!(as_vec, moves);
}
