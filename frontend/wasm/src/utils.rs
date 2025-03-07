/*
    1. generate possible moves
    2. FEN to obj
*/
#[allow(dead_code)]

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

const FILES: [char; 8] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS: [char; 8] = ['1', '2', '3', '4', '5', '6', '7', '8'];

pub fn generate_possible_moves(
    piece: &str,
    square: &str,
    board: &HashMap<String, String>,
    white_castle: bool,
    black_castle: bool,
    en_passant: &str,
) -> Vec<String> {
    let file = square.chars().nth(0).unwrap();
    let rank = square.chars().nth(1).unwrap();
    let file_index = FILES.iter().position(|&x| x == file).unwrap();
    let rank_index = RANKS.iter().position(|&x| x == rank).unwrap();
    let mut possible_moves: Vec<String> = Vec::with_capacity(27); // 27 is the maximum number of possible moves for a queen(no piece has more possible moves)

    let is_white_piece = piece.chars().nth(0).unwrap() == 'w';

    let mut add_move = |new_file: u8, new_rank: u8| -> bool {
        if new_file < 0 || new_file > 7 || new_rank < 0 || new_rank > 7 {
            return false;
        }
        let new_square = format!("{}{}", FILES[new_file as usize], RANKS[new_rank as usize]);
        let piece_at_new_square = board.get(&new_square);
        if piece_at_new_square.is_none() {
            possible_moves.push(new_square);
            return true;
        } else if piece_at_new_square.unwrap().chars().nth(0).unwrap()
            != piece.chars().nth(0).unwrap()
        {
            possible_moves.push(new_square);
            return false;
        }
        return false;
    };

    let mut add_moves_in_direction = |dx: i8, dy: i8, max_steps: i8| {
        for i in 1..=max_steps {
            if !add_move(
                (file_index as i8 + i * dx) as u8,
                (rank_index as i8 + i * dy) as u8,
            ) {
                break;
            }
        }
    };

    let is_square_under_attack = |square: &str, is_white: bool| -> bool {
        for (sq, pc) in board.iter() {
            if pc.is_empty() || pc.chars().nth(0).unwrap() == if is_white { 'w' } else { 'b' } {
                continue;
            }
            let attacking_moves =
                generate_possible_moves(pc, sq, board, white_castle, black_castle, en_passant);
            if attacking_moves.contains(&square.to_string()) {
                return true;
            }
        }
        return false;
    };

    let piece_type = piece.chars().nth(1).unwrap();

    match piece_type {
        'P' => {
            let direction = if is_white_piece { 1 } else { -1 };

            if add_move(file_index as u8, (rank_index as i8 + direction) as u8) {
                if (is_white_piece && rank == '2') || (!is_white_piece && rank == '7') {
                    add_move(file_index as u8, (rank_index as i8 + 2 * direction) as u8);
                }
            }

            // Diagonal captures
            [-1, 1].iter().for_each(|&dx| {
                let new_file_index = file_index as i8 + dx;
                let new_rank_index = rank_index as i8 + direction;

                // Ensure indices are within valid bounds
                if new_file_index < 0 || new_file_index >= FILES.len() as i8 || new_rank_index < 0 || new_rank_index >= RANKS.len() as i8 {
                    return;
                }

                let capture_square = format!("{}{}", FILES[new_file_index as usize], RANKS[new_rank_index as usize]);

                if let Some(piece_at_capture_square) = board.get(&capture_square) {
                    if piece_at_capture_square.is_empty() || piece_at_capture_square.chars().next() != piece.chars().next() {
                        possible_moves.push(capture_square.clone());
                    }
                }

                if capture_square == en_passant && ((is_white_piece && rank == '5') || (!is_white_piece && rank == '4')) {
                    possible_moves.push(capture_square);
                }
            });
        }
        'R' => {
            for &[dx, dy] in [[0, 1], [0, -1], [1, 0], [-1, 0]].iter() {
                add_moves_in_direction(dx, dy, 7);
            }
        }
        'N' => {
            for &[dx, dy] in [
                [1, 2],
                [2, 1],
                [2, -1],
                [1, -2],
                [-1, -2],
                [-2, -1],
                [-2, 1],
                [-1, 2],
            ].iter()
            {
                add_move((file_index as i8 + dx) as u8, (rank_index as i8 + dy) as u8);
            }
        }
        'B' => {
            for &[dx, dy] in [[1, 1], [1, -1], [-1, -1], [-1, 1]].iter() {
                add_moves_in_direction(dx, dy, 7);
            }
        }
        'Q' => {
            for &[dx, dy] in [[0, 1],
                [0, -1],
                [1, 0],
                [-1, 0],
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1]].iter() {
                    add_moves_in_direction(dx, dy, 7);
                }
        }
        'K' => {
            for &[dx, dy] in [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, -1], [-1, 1]]
                .iter()
            {
                add_move((file_index as i8 + dx) as u8, (rank_index as i8 + dy) as u8);
            }

            if is_white_piece {
                if white_castle {
                    if board.get("f1").is_none()
                        && board.get("g1").is_none()
                        && !is_square_under_attack("e1", true)
                        && !is_square_under_attack("f1", true)
                        && !is_square_under_attack("g1", true)
                    {
                        possible_moves.push("g1".to_string());
                    }
                    if board.get("d1").is_none()
                        && board.get("c1").is_none()
                        && board.get("b1").is_none()
                        && !is_square_under_attack("e1", true)
                        && !is_square_under_attack("d1", true)
                        && !is_square_under_attack("c1", true)
                    {
                        possible_moves.push("c1".to_string());
                    }
                }
            } else if black_castle {
                if board.get("f8").is_none()
                    && board.get("g8").is_none()
                    && !is_square_under_attack("e8", false)
                    && !is_square_under_attack("f8", false)
                    && !is_square_under_attack("g8", false)
                {
                    possible_moves.push("g8".to_string());
                }
                if board.get("d8").is_none()
                    && board.get("c8").is_none()
                    && board.get("b8").is_none()
                    && !is_square_under_attack("e8", false)
                    && !is_square_under_attack("d8", false)
                    && !is_square_under_attack("c8", false)
                {
                    possible_moves.push("c8".to_string());
                }
            }
        }
        _ => {}
    }

    possible_moves
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FenBoard {
    position: HashMap<String, String>,
    player_turn: String,
    white_c: bool,
    black_c: bool,
    en_passant: String,
    king_in_check: String,
}

pub fn fen_to_board(fen: &str) -> Result<FenBoard, String> {
    let rows: Vec<&str> = fen.split_whitespace().next().unwrap_or(fen).split('/').collect();

    if rows.len() != 8 {
        return Err(format!("Invalid FEN: Expected 8 rows, got {}", rows.len()));
    }

    let mut position: HashMap<String, String> = HashMap::new();
    let mut current_row = 8;
    let mut white_c = false;
    let mut black_c = false;
    let player_turn = fen.split_whitespace().nth(1).unwrap_or("").to_string();
    let castling_rights = fen.split_whitespace().nth(2).unwrap_or("").to_string();
    let en_passant = fen.split_whitespace().nth(3).unwrap_or("").to_string();
    let king_in_check = fen.split_whitespace().nth(4).unwrap_or("").to_string();

    for row in rows.iter() {
        let mut col_idx = 0;
        for c in row.chars() {
            if c.is_digit(10) {
                col_idx += c.to_digit(10).expect("Error occurred parsing c to digit");
            } else {
                let square = format!("{}{}", FILES[col_idx as usize], current_row);
                if c.is_uppercase() {
                    position.insert(square, format!("w{}", c.to_string()));
                } else {
                    position.insert(square, format!("b{}", c.to_uppercase().to_string()));
                }
                col_idx += 1;
            }
        }

        current_row -= 1;
    }

    white_c = castling_rights.contains('K');
    black_c = castling_rights.contains('k');

    Ok(FenBoard { position, player_turn, white_c, black_c, en_passant, king_in_check })
}
