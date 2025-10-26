use chess_lib::{board::square::Square, game::game::Game};
use criterion::{BenchmarkId, Criterion, criterion_group, criterion_main};

// Standard perft test positions
const PERFT_POSITIONS: &[(&str, &str)] = &[
    (
        "Starting Position",
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    ),
    (
        "Kiwipete",
        "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    ),
    ("Position 3", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 0"),
    (
        "Position 4",
        "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    ),
    (
        "Position 5",
        "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
    ),
    (
        "Position 6",
        "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
    ),
];

// Expected results for validation
const EXPECTED_NODES: &[(&str, &[(usize, u64)])] = &[
    (
        "Starting Position",
        &[(1, 20), (2, 400), (3, 8_902), (4, 197_281), (5, 4_865_609)],
    ),
    (
        "Kiwipete",
        &[(1, 48), (2, 2_039), (3, 97_862), (4, 4_085_603)],
    ),
    (
        "Position 3",
        &[(1, 14), (2, 191), (3, 2_812), (4, 43_238), (5, 674_624)],
    ),
    ("Position 4", &[(1, 6), (2, 264), (3, 9_467), (4, 422_333)]),
    ("Position 5", &[(1, 44), (2, 1_486), (3, 62_379)]),
    ("Position 6", &[(1, 46), (2, 2_079), (3, 89_890)]),
];

fn perft(game: &mut Game, depth: usize) -> u64 {
    if depth == 0 {
        return 1;
    }

    let mut nodes = 0;
    let moves = generate_all_legal_moves(game);

    for mv in moves {
        let result = game.commit_move(mv.from, mv.to, mv.piece, mv.move_type);

        match result {
            Ok(move_data) => {
                nodes += perft(game, depth - 1);
                game.undo_move(move_data).expect("undo failed");
            }

            Err(e) => {
                println!("move failed:, {e} FEN: {:?}", game.to_fen());
            }
        };
    }

    nodes
}

// Helper structure for move data
#[derive(Clone, Debug)]
struct MoveInfo {
    from: String,
    to: String,
    piece: String,
    move_type: Option<String>,
}

/// Generate all legal moves for the current position
fn generate_all_legal_moves(game: &Game) -> Vec<MoveInfo> {
    let mut legal_moves = Vec::new();
    let color = game.active_player;
    let mut all_pieces = game.board.all_pieces();

    // Iterate through all squares with pieces
    while let Some(square_idx) = all_pieces.pop_lsb() {
        let from = Square::uint_to_square(square_idx as u8);
        if let Some(piece) = game.board.get_piece_at(from) {
            if piece.color() == color {
                // Generate moves for this piece
                let moves = game.board.get_legal_moves(from, piece);
                let mut targets = moves;

                while let Some(target_square) = targets.pop_lsb() {
                    let target = Square::uint_to_square(target_square as u8);

                    // Check if this is a promotion move
                    if piece.is_pawn() && game.is_promotion(target, piece.color()) {
                        // Generate all 4 promotion types
                        let promotion_pieces = if piece.is_white() {
                            ["wQ", "wR", "wB", "wK"]
                        } else {
                            ["bQ", "bR", "bB", "bK"]
                        };

                        for promo_piece in promotion_pieces {
                            legal_moves.push(MoveInfo {
                                from: from.to_string(),
                                to: target.to_string(),
                                piece: piece.to_string(),
                                move_type: Some(promo_piece.to_string()), // or promoted_to: Some(promo_piece) if that's your field name
                            });
                        }
                    } else {
                        // Not a promotion - just a regular move
                        legal_moves.push(MoveInfo {
                            from: from.to_string(),
                            to: target.to_string(),
                            piece: piece.to_string(),
                            move_type: None, // or promoted_to: None
                        });
                    }
                }
            }
        }
    }

    legal_moves
}

fn bench_perft(c: &mut Criterion) {
    let mut group = c.benchmark_group("perft");
    group.sample_size(10); // Fewer samples for slow tests

    let test_cases = vec![
        (
            "Starting Position",
            Game::new(),
            vec![(1, 20), (2, 400), (3, 8_902), (4, 197_281), (5, 4_865_609)],
        ),
        (
            "Kiwipete",
            Game::with_fen("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"),
            vec![(1, 48), (2, 2_039), (3, 97_862), (4, 4_085_603)],
        ),
        (
            "Position 3",
            Game::with_fen("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 0"),
            vec![(1, 14), (2, 191), (3, 2_812), (4, 43_238), (5, 674_624)],
        ),
        (
            "Position 4",
            Game::with_fen("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"),
            vec![(1, 6), (2, 264), (3, 9_467), (4, 422_333)],
        ),
        (
            "Position 5",
            Game::with_fen("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"),
            vec![(1, 44), (2, 1_486), (3, 62_379)],
        ),
        (
            "Position 6",
            Game::with_fen(
                "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
            ),
            vec![(1, 46), (2, 2_079), (3, 89_890)],
        ),
    ];

    for (name, game, depths) in test_cases {
        for (depth, expected) in depths {
            group.bench_with_input(
                BenchmarkId::new(name, format!("depth_{}", depth)),
                &(game.clone(), depth, expected),
                |b, (game, depth, expected)| {
                    b.iter(|| {
                        let mut test_game = game.clone();
                        let result = perft(&mut test_game, *depth);

                        assert_eq!(
                            result, *expected,
                            "Perft({}) for {} failed: expected {}, got {}",
                            depth, name, expected, result
                        );

                        result
                    });
                },
            );
        }
    }

    group.finish();
}

criterion_group!(benches, bench_perft);
criterion_main!(benches);

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================================
    // Starting Position Tests
    // ============================================================

    #[test]
    fn test_starting_position_depth_1() {
        let mut game = Game::new();
        let nodes = perft(&mut game, 1);
        assert_eq!(nodes, 20, "Starting position depth 1 should be 20 nodes");
    }

    #[test]
    fn test_starting_position_depth_2() {
        let mut game = Game::new();
        let nodes = perft(&mut game, 2);

        if nodes != 400 {
            println!("\n=== DEBUGGING DEPTH 2 ===");
            let divide_results = divide(&mut game, 2);
            for (mv, count) in divide_results {
                println!("{}: {}", mv, count);
            }
        }

        assert_eq!(nodes, 400, "Starting position depth 2 should be 400 nodes");
    }

    #[test]
    fn test_starting_position_depth_3() {
        let mut game = Game::new();
        let nodes = perft(&mut game, 3);
        assert_eq!(
            nodes, 8_902,
            "Starting position depth 3 should be 8,902 nodes"
        );
    }

    #[test]
    #[ignore] // Slow test - run with --ignored
    fn test_starting_position_depth_4() {
        let mut game = Game::new();
        let nodes = perft(&mut game, 4);
        assert_eq!(
            nodes, 197_281,
            "Starting position depth 4 should be 197,281 nodes"
        );
    }

    #[test]
    #[ignore] // Very slow test
    fn test_starting_position_depth_5() {
        let mut game = Game::new();
        let nodes = perft(&mut game, 5);
        assert_eq!(
            nodes, 4_865_609,
            "Starting position depth 5 should be 4,865,609 nodes"
        );
    }

    // ============================================================
    // Kiwipete Position Tests
    // ============================================================

    #[test]
    fn test_kiwipete_depth_1() {
        let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 1);
        assert_eq!(nodes, 48, "Kiwipete depth 1 should be 48 nodes");
    }

    #[test]
    fn test_kiwipete_depth_2() {
        let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 2);

        if nodes != 2_039 {
            println!("\n=== DEBUGGING KIWIPETE DEPTH 2 ===");
            let divide_results = divide(&mut game, 2);
            for (mv, count) in divide_results {
                println!("{}: {}", mv, count);
            }
        }

        assert_eq!(nodes, 2_039, "Kiwipete depth 2 should be 2,039 nodes");
    }

    #[test]
    fn test_kiwipete_depth_3() {
        let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 3);
        assert_eq!(nodes, 97_862, "Kiwipete depth 3 should be 97,862 nodes");
    }

    #[test]
    #[ignore] // Slow test
    fn test_kiwipete_depth_4() {
        let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 4);
        assert_eq!(
            nodes, 4_085_603,
            "Kiwipete depth 4 should be 4,085,603 nodes"
        );
    }

    // ============================================================
    // Position 3 Tests (Endgame with promoted pawn potential)
    // ============================================================

    #[test]
    fn test_position3_depth_1() {
        let fen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 0";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 1);
        assert_eq!(nodes, 14, "Position 3 depth 1 should be 14 nodes");
    }

    #[test]
    fn test_position3_depth_2() {
        let fen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 0";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 2);
        assert_eq!(nodes, 191, "Position 3 depth 2 should be 191 nodes");
    }

    #[test]
    fn test_position3_depth_3() {
        let fen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 0";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 3);
        assert_eq!(nodes, 2_812, "Position 3 depth 3 should be 2,812 nodes");
    }

    #[test]
    fn test_position3_depth_4() {
        let fen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 0";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 4);
        assert_eq!(nodes, 43_238, "Position 3 depth 4 should be 43,238 nodes");
    }

    #[test]
    #[ignore] // Slow test
    fn test_position3_depth_5() {
        let fen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 0";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 5);
        assert_eq!(nodes, 674_624, "Position 3 depth 5 should be 674,624 nodes");
    }

    // ============================================================
    // Position 4 Tests (Complex position with promotions)
    // ============================================================

    #[test]
    fn test_position4_depth_1() {
        let fen = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 1);
        assert_eq!(nodes, 6, "Position 4 depth 1 should be 6 nodes");
    }

    #[test]
    fn test_position4_depth_2() {
        let fen = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 2);
        assert_eq!(nodes, 264, "Position 4 depth 2 should be 264 nodes");
    }

    #[test]
    fn test_position4_depth_3() {
        let fen = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 3);
        assert_eq!(nodes, 9_467, "Position 4 depth 3 should be 9,467 nodes");
    }

    #[test]
    #[ignore] // Slow test
    fn test_position4_depth_4() {
        let fen = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 4);
        assert_eq!(nodes, 422_333, "Position 4 depth 4 should be 422,333 nodes");
    }

    // ============================================================
    // Position 5 Tests (Lopez Opening with complications)
    // ============================================================

    #[test]
    fn test_position5_depth_1() {
        let fen = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 1);
        assert_eq!(nodes, 44, "Position 5 depth 1 should be 44 nodes");
    }

    #[test]
    fn test_position5_depth_2() {
        let fen = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 2);
        assert_eq!(nodes, 1_486, "Position 5 depth 2 should be 1,486 nodes");
    }

    #[test]
    fn test_position5_depth_3() {
        let fen = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 3);
        assert_eq!(nodes, 62_379, "Position 5 depth 3 should be 62,379 nodes");
    }

    #[test]
    #[ignore] // Slow test
    fn test_position5_depth_4() {
        let fen = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 4);
        assert_eq!(
            nodes, 2_103_487,
            "Position 5 depth 4 should be 2,103,487 nodes"
        );
    }

    // ============================================================
    // Position 6 Tests (Mirror position)
    // ============================================================

    #[test]
    fn test_position6_depth_1() {
        let fen = "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 1);
        assert_eq!(nodes, 46, "Position 6 depth 1 should be 46 nodes");
    }

    #[test]
    fn test_position6_depth_2() {
        let fen = "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 2);
        assert_eq!(nodes, 2_079, "Position 6 depth 2 should be 2,079 nodes");
    }

    #[test]
    fn test_position6_depth_3() {
        let fen = "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 3);
        assert_eq!(nodes, 89_890, "Position 6 depth 3 should be 89,890 nodes");
    }

    #[test]
    #[ignore] // Slow test
    fn test_position6_depth_4() {
        let fen = "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10";
        let mut game = Game::with_fen(fen);
        let nodes = perft(&mut game, 4);
        assert_eq!(
            nodes, 3_894_594,
            "Position 6 depth 4 should be 3,894,594 nodes"
        );
    }

    #[test]
    fn debug_divide() {
        let mut game = Game::new();
        let results = divide(&mut game, 4);

        for (mv, count) in results {
            eprintln!("{}: {}", mv, count);
        }

        panic!("Look at the output above!");
    }

    #[test]
    fn test_debug_depth_4() {
        let mut game = Game::new();

        println!("\n=== DIVIDE DEPTH 4 ===");
        let divide_results = divide(&mut game, 4);

        // Print all moves first
        println!("Generated {} first moves:", divide_results.len());
        let mut total = 0;
        for (mv, count) in &divide_results {
            println!("{}: {}", mv, count);
            total += count;
        }

        println!("\n✅ Total nodes: {}", total);
        println!("❌ Expected: 197281");
        println!("❌ Difference: {} extra nodes", total as i64 - 197281);

        // Now compare with expected (if your move format matches)
        let expected = vec![
            ("a2a3", 8457),
            ("a2a4", 9329),
            ("b2b3", 9345),
            ("b2b4", 9332),
            ("c2c3", 9272),
            ("c2c4", 9744),
            ("d2d3", 8073),
            ("d2d4", 12435),
            ("e2e3", 9726),
            ("e2e4", 10471),
            ("f2f3", 8393),
            ("f2f4", 8457),
            ("g2g3", 9345),
            ("g2g4", 9328),
            ("h2h3", 8457),
            ("h2h4", 9329),
            ("b1a3", 8885),
            ("b1c3", 9755),
            ("g1f3", 9748),
            ("g1h3", 8881),
        ];

        // Check if we can find mismatches
        for (expected_mv, expected_count) in expected {
            if let Some((_, actual_count)) = divide_results.iter().find(|(m, _)| m == expected_mv) {
                if *actual_count != expected_count {
                    println!(
                        "\n⚠️  MISMATCH: {} has {} nodes (expected {})",
                        expected_mv, actual_count, expected_count
                    );
                }
            }
        }
    }
}
