/*  
    1. generate possible moves
    2. FEN to obj
    3. Timer function if possible
*/
#[allow(dead_code)]

use std::collections::HashMap;

const FILES: [char; 8] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS: [char; 8] = ['1', '2', '3', '4', '5', '6', '7', '8'];

pub fn generate_possible_moves(
    piece: &str,
    square: &str,
    board: &HashMap<String, String>,
    white_castle: bool,
    black_castle: bool,
    en_passant: &str
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
        } else if piece_at_new_square.unwrap().chars().nth(0).unwrap() != piece.chars().nth(0).unwrap() {
            possible_moves.push(new_square);
            return false;
        }
        return false;
    };

    let add_moves_in_direction = |dx: i8, dy: i8, max_steps: i8| {
        for i in 1..=max_steps {
            if !add_move((file_index as i8 + i * dx) as u8, (rank_index as i8 + i * dy) as u8) {
                break;
            }
        }
    };

    let is_square_under_attack = |square: &str, is_white: bool| -> bool {
        for (sq, pc) in board.iter() {
            if pc.is_empty() || pc.chars().nth(0).unwrap() == if is_white { 'w' } else { 'b' } {
                continue;
            }
            let attacking_moves = generate_possible_moves(
                pc,
                sq,
                board,
                white_castle,
                black_castle,
                en_passant
            );
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
        // [-1, 1].iter().for_each(|&dx| {
        //     let capture_square = format!("{}{}", FILES[(file_index as i8 + dx) as usize], RANKS[(rank_index as i8 + direction) as usize]);
        //     if capture_square.is_empty() {
        //         return;
        //     }
        //     if let Some(piece_at_capture_square) = board.get(&capture_square) {
        //         if piece_at_capture_square.is_empty() || piece_at_capture_square.chars().nth(0).unwrap() != piece.chars().nth(0).unwrap() {
        //             possible_moves.push(capture_square.clone());
        //         }
        //     }

        //     if capture_square == en_passant && ((is_white_piece && rank == '5') || (!is_white_piece && rank == '4')) {
        //         possible_moves.push(capture_square);
        //     }
        // });
      },
      _ => {}
    }

    possible_moves
}