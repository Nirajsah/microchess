use serde::{Deserialize, Serialize};
use std::fmt::Write;

const FILES: [char; 8] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS: [char; 8] = ['1', '2', '3', '4', '5', '6', '7', '8'];

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct FenBoard {
    pub position: [[Option<(bool, char)>; 8]; 8], // [rank][file] - (is_white, piece_type)
    pub player_turn: char,                        // 'w' or 'b'
    pub castle_rights: u8, // 1100(white) 0011(black) can castle (k or q side)
    pub en_passant: Option<String>, // (file, rank) indices
    pub king_in_check: Option<String>,
}

impl FenBoard {
    #[inline]
    pub fn to_json(&self) -> String {
        // Preallocate enough capacity to avoid reallocations
        let mut json = String::with_capacity(2048);
        json.push_str("{\"position\":{");

        let mut first = true;
        for rank in 0..8 {
            for file in 0..8 {
                if let Some((is_white, piece)) = self.position[rank][file] {
                    if !first {
                        json.push(',');
                    } else {
                        first = false;
                    }

                    // Use write!() — faster than multiple push_str() calls
                    let _ = write!(
                        json,
                        "\"{}{}\":\"{}{}\"",
                        FILES[file],
                        RANKS[rank],
                        if is_white { 'w' } else { 'b' },
                        piece
                    );
                }
            }
        }

        // Append all scalar fields efficiently
        let _ = write!(
            json,
            "}},\"player_turn\":\"{}\",\"en_passant\":",
            self.player_turn
        );

        if let Some(ref ep) = self.en_passant {
            let _ = write!(json, "\"{}\"", ep);
        } else {
            json.push_str("null");
        }

        json.push_str(",\"king_in_check\":");
        if let Some(ref king) = self.king_in_check {
            let _ = write!(json, "\"{}\"", king);
        } else {
            json.push_str("null");
        }
        json.push('}');

        json
    }
}

/// Parse FEN string into board structure
#[inline]
pub fn fen_to_board(fen: &str) -> Result<FenBoard, String> {
    let parts: Vec<&str> = fen.split_whitespace().collect();
    if parts.len() < 2 {
        return Err("Invalid FEN: missing required fields".into());
    }

    let piece_placement = parts[0];
    let active_player = parts[1].chars().next().unwrap_or('w');
    let castling_rights = parts.get(2).copied().unwrap_or("-");
    let en_passant_str = parts.get(3).copied().unwrap_or("-");

    let mut position = [[None; 8]; 8];
    let mut rank = 7;
    let mut file = 0;

    // Track king squares numerically (rank, file)
    let mut white_king_sq: Option<String> = None;
    let mut black_king_sq: Option<String> = None;
    // Parse board (piece placement)
    for c in piece_placement.bytes() {
        match c {
            b'/' => {
                if file != 8 {
                    return Err(format!("Incomplete rank {}", rank + 1));
                }
                if rank == 0 {
                    break;
                }
                rank -= 1;
                file = 0;
            }
            b'1'..=b'8' => {
                file += (c - b'0') as usize;
                if file > 8 {
                    return Err(format!("Too many squares in rank {}", rank + 1));
                }
            }
            _ => {
                if file >= 8 {
                    return Err(format!("Too many pieces in rank {}", rank + 1));
                }
                let is_white = (c as char).is_ascii_uppercase();
                let piece = (c as char).to_ascii_uppercase();
                position[rank][file] = Some((is_white, piece));

                if piece == 'K' {
                    let sq = format!(
                        "{}{}",
                        (b'a' + file as u8) as char,
                        (b'1' + rank as u8) as char
                    );
                    if is_white {
                        white_king_sq = Some(sq);
                    } else {
                        black_king_sq = Some(sq);
                    }
                }

                file += 1;
            }
        }
    }

    let mut mask = 0;
    for ch in castling_rights.chars() {
        match ch {
            'K' => mask |= 0b1000,
            'Q' => mask |= 0b0100,
            'k' => mask |= 0b0010,
            'q' => mask |= 0b0001,
            '-' => {}
            _ => panic!("Invalid castling char: {}", ch),
        }
    }
    // Castling rights
    let mut castle_rights = 0u8;
    castle_rights |= mask;

    // En passant
    let en_passant = if en_passant_str == "-" {
        None
    } else {
        Some(en_passant_str.to_string())
    };

    // --- Create board struct ---
    let mut board = FenBoard {
        position,
        player_turn: active_player,
        castle_rights,
        en_passant,
        king_in_check: None,
    };

    // --- Check which king is in check ---
    if let Some(sq) = white_king_sq {
        if is_square_under_attack(&sq, false, &board.position) {
            board.king_in_check = Some("white".to_string());
        }
    }

    if let Some(sq) = black_king_sq {
        if is_square_under_attack(&sq, true, &board.position) {
            board.king_in_check = Some("black".to_string());
        }
    }
    // is_square_under_attack(square, by_white, &board);
    Ok(board)
}

/// Generate all possible moves for a piece
#[inline]
pub fn generate_possible_moves(
    piece: (bool, char),
    file_idx: usize,
    rank_idx: usize,
    board: &FenBoard,
) -> Vec<String> {
    let (is_white, piece_type) = piece;
    let mut moves = Vec::with_capacity(27);

    // Helper to add a move if valid
    let mut add_move = |new_file: i8, new_rank: i8| -> bool {
        if new_file < 0 || new_file > 7 || new_rank < 0 || new_rank > 7 {
            return false;
        }

        let target = board.position[new_rank as usize][new_file as usize];
        match target {
            None => {
                moves.push(format!(
                    "{}{}",
                    FILES[new_file as usize], RANKS[new_rank as usize]
                ));
                true
            }
            Some((target_white, _)) if target_white != is_white => {
                moves.push(format!(
                    "{}{}",
                    FILES[new_file as usize], RANKS[new_rank as usize]
                ));
                false
            }
            _ => false,
        }
    };

    // Helper for sliding pieces
    let mut add_moves_in_direction = |dx: i8, dy: i8, max_steps: i8| {
        for i in 1..=max_steps {
            if !add_move(file_idx as i8 + i * dx, rank_idx as i8 + i * dy) {
                break;
            }
        }
    };

    match piece_type {
        'P' => {
            let direction = if is_white { 1 } else { -1 };
            let start_rank = if is_white { 1 } else { 6 };

            // Forward move
            let new_rank = rank_idx as i8 + direction;
            if new_rank >= 0 && new_rank <= 7 {
                if board.position[new_rank as usize][file_idx].is_none() {
                    moves.push(format!("{}{}", FILES[file_idx], RANKS[new_rank as usize]));

                    // Double move from start
                    if rank_idx == start_rank {
                        let double_rank = rank_idx as i8 + 2 * direction;
                        if board.position[double_rank as usize][file_idx].is_none() {
                            moves.push(format!(
                                "{}{}",
                                FILES[file_idx], RANKS[double_rank as usize]
                            ));
                        }
                    }
                }
            }

            // Captures
            for &dx in &[-1, 1] {
                let new_file = file_idx as i8 + dx;
                let new_rank = rank_idx as i8 + direction;

                if new_file >= 0 && new_file <= 7 && new_rank >= 0 && new_rank <= 7 {
                    let target = board.position[new_rank as usize][new_file as usize];

                    // Regular capture
                    if let Some((target_white, _)) = target {
                        if target_white != is_white {
                            moves.push(format!(
                                "{}{}",
                                FILES[new_file as usize], RANKS[new_rank as usize]
                            ));
                        }
                    }

                    // En passant capture
                    if let Some(ref ep_square) = board.en_passant {
                        let target_square =
                            format!("{}{}", FILES[new_file as usize], RANKS[new_rank as usize]);
                        if target_square == *ep_square {
                            // Verify we're on the correct rank for en passant
                            let ep_capture_rank = if is_white { 5 } else { 4 };
                            if rank_idx == ep_capture_rank {
                                moves.push(target_square);
                            }
                        }
                    }
                }
            }
        }
        'R' => {
            for &(dx, dy) in &[(0, 1), (0, -1), (1, 0), (-1, 0)] {
                add_moves_in_direction(dx, dy, 7);
            }
        }
        'N' => {
            for &(dx, dy) in &[
                (1, 2),
                (2, 1),
                (2, -1),
                (1, -2),
                (-1, -2),
                (-2, -1),
                (-2, 1),
                (-1, 2),
            ] {
                add_move(file_idx as i8 + dx, rank_idx as i8 + dy);
            }
        }
        'B' => {
            for &(dx, dy) in &[(1, 1), (1, -1), (-1, -1), (-1, 1)] {
                add_moves_in_direction(dx, dy, 7);
            }
        }
        'Q' => {
            for &(dx, dy) in &[
                (0, 1),
                (0, -1),
                (1, 0),
                (-1, 0),
                (1, 1),
                (1, -1),
                (-1, -1),
                (-1, 1),
            ] {
                add_moves_in_direction(dx, dy, 7);
            }
        }
        'K' => {
            for &(dx, dy) in &[
                (0, 1),
                (0, -1),
                (1, 0),
                (-1, 0),
                (1, 1),
                (1, -1),
                (-1, -1),
                (-1, 1),
            ] {
                add_move(file_idx as i8 + dx, rank_idx as i8 + dy);
            }

            let position = &board.position;

            if file_idx == 4 {
                if is_white {
                    let wk = board.castle_rights & 0b1000 != 0;
                    let wq = board.castle_rights & 0b0100 != 0;

                    if wk && board.position[0][5].is_none() && board.position[0][6].is_none() {
                        // Only check once for performance
                        let e1_attacked = is_square_under_attack("e1", false, position);
                        if !e1_attacked
                            && !is_square_under_attack("f1", false, position)
                            && !is_square_under_attack("g1", false, position)
                        {
                            moves.push("g1".to_string());
                        }
                    }

                    if wq
                        && board.position[0][3].is_none()
                        && board.position[0][2].is_none()
                        && board.position[0][1].is_none()
                    {
                        let e1_attacked = is_square_under_attack("e1", false, position);
                        if !e1_attacked
                            && !is_square_under_attack("d1", false, position)
                            && !is_square_under_attack("c1", false, position)
                        {
                            moves.push("c1".to_string());
                        }
                    }
                } else {
                    let bk = board.castle_rights & 0b0010 != 0;
                    let bq = board.castle_rights & 0b0001 != 0;

                    if bk && board.position[7][5].is_none() && board.position[7][6].is_none() {
                        let e8_attacked = is_square_under_attack("e8", true, position);
                        if !e8_attacked
                            && !is_square_under_attack("f8", true, position)
                            && !is_square_under_attack("g8", true, position)
                        {
                            moves.push("g8".to_string());
                        }
                    }

                    if bq
                        && board.position[7][3].is_none()
                        && board.position[7][2].is_none()
                        && board.position[7][1].is_none()
                    {
                        let e8_attacked = is_square_under_attack("e8", true, position);
                        if !e8_attacked
                            && !is_square_under_attack("d8", true, position)
                            && !is_square_under_attack("c8", true, position)
                        {
                            moves.push("c8".to_string());
                        }
                    }
                }
            }
        }
        _ => {}
    }

    moves
}

#[inline]
fn is_square_under_attack(
    square: &str,
    by_white: bool,
    board: &[[Option<(bool, char)>; 8]; 8],
) -> bool {
    let bytes = square.as_bytes();
    if bytes.len() != 2 {
        return false;
    }

    let file = (bytes[0] - b'a') as usize;
    let rank = (bytes[1] - b'1') as usize;

    if file >= 8 || rank >= 8 {
        return false;
    }

    let deltas_knight = [
        (-2, -1),
        (-2, 1),
        (-1, -2),
        (-1, 2),
        (1, -2),
        (1, 2),
        (2, -1),
        (2, 1),
    ];

    let deltas_king = [
        (-1, -1),
        (-1, 0),
        (-1, 1),
        (0, -1),
        (0, 1),
        (1, -1),
        (1, 0),
        (1, 1),
    ];

    let directions_straight = [(0, 1), (1, 0), (0, -1), (-1, 0)];
    let directions_diag = [(1, 1), (1, -1), (-1, 1), (-1, -1)];

    let rank = rank as i32;
    let file = file as i32;

    // --- Pawns ---
    let pawn_dir = if by_white { -1 } else { 1 };
    for &df in &[-1, 1] {
        let r = rank + pawn_dir;
        let f = file + df;
        if r >= 0 && r < 8 && f >= 0 && f < 8 {
            if let Some((is_white, piece)) = board[r as usize][f as usize] {
                if is_white == by_white && piece == 'P' {
                    return true;
                }
            }
        }
    }

    // --- Knights ---
    for &(dr, df) in &deltas_knight {
        let r = rank + dr;
        let f = file + df;
        if r >= 0 && r < 8 && f >= 0 && f < 8 {
            if let Some((is_white, piece)) = board[r as usize][f as usize] {
                if is_white == by_white && piece == 'N' {
                    return true;
                }
            }
        }
    }

    // --- Sliding pieces ---
    for &(dr, df) in &directions_straight {
        let mut r = rank + dr;
        let mut f = file + df;
        while r >= 0 && r < 8 && f >= 0 && f < 8 {
            if let Some((is_white, piece)) = board[r as usize][f as usize] {
                if is_white == by_white {
                    if piece == 'R' || piece == 'Q' {
                        return true;
                    }
                    break;
                } else {
                    break;
                }
            }
            r += dr;
            f += df;
        }
    }

    for &(dr, df) in &directions_diag {
        let mut r = rank + dr;
        let mut f = file + df;
        while r >= 0 && r < 8 && f >= 0 && f < 8 {
            if let Some((is_white, piece)) = board[r as usize][f as usize] {
                if is_white == by_white {
                    if piece == 'B' || piece == 'Q' {
                        return true;
                    }
                    break;
                } else {
                    break;
                }
            }
            r += dr;
            f += df;
        }
    }

    // --- King ---
    for &(dr, df) in &deltas_king {
        let r = rank + dr;
        let f = file + df;
        if r >= 0 && r < 8 && f >= 0 && f < 8 {
            if let Some((is_white, piece)) = board[r as usize][f as usize] {
                if is_white == by_white && piece == 'K' {
                    return true;
                }
            }
        }
    }

    false
}

/// Check if a square is under attack
/* #[inline]
pub fn is_square_under_attack(square: &str, by_white: bool, board: &FenBoard) -> bool {
    let bytes = square.as_bytes();
    if bytes.len() != 2 {
        return false;
    }

    let target_file = (bytes[0] - b'a') as usize;
    let target_rank = (bytes[1] - b'1') as usize;

    if target_file >= 8 || target_rank >= 8 {
        return false;
    }

    // Check all pieces of the attacking color
    for rank in 0..8 {
        for file in 0..8 {
            if let Some((is_white, piece)) = board.position[rank][file] {
                if is_white != by_white {
                    continue;
                }

                let moves = generate_possible_moves((is_white, piece), file, rank, board);
                if moves.contains(&square.to_string()) {
                    return true;
                }
            }
        }
    }

    false
} */

/// Perft test for debugging
#[inline]
pub fn perft_internal(board: &FenBoard, depth: u8) -> u64 {
    if depth == 0 {
        return 1;
    }

    let mut nodes = 0;
    let is_white = board.player_turn == 'w';

    for rank in 0..8 {
        for file in 0..8 {
            if let Some((piece_white, piece)) = board.position[rank][file] {
                if piece_white != is_white {
                    continue;
                }

                let moves = generate_possible_moves((piece_white, piece), file, rank, board);
                nodes += moves.len() as u64;

                // For deeper perft, would need to actually make moves and recurse
                // This is a simplified version for depth 1
            }
        }
    }

    nodes
}
