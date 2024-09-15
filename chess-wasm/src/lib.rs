use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub fn get_moves(piece: &str, pos: &str) -> Vec<Square> {
    if piece == "wN" || piece == "bN" {
        if let Ok(square) = Square::from_str(pos) {
            generate_knight_moves(square)
        } else {
            console_error_panic_hook::set_once();
            console::log_1(&"Error getting the squares 1st!".into());
            vec![] // Return an empty vector if pos is invalid
        }
    } else {
        console::log_1(&"Error getting the squares 2nd!".into());
        vec![]
    }
}
/// Generate all possible non-capture moves for a pawn located at `pawn_square`
// pub fn generate_pawn_move(pawn_square: Square, color: Color) -> Vec<Square> {
//     let mut possible_moves = Vec::new();
//     let pawn_square = pawn_square as usize;

//     // Determine direction of movement based on color
//     let direction: isize = match color {
//         Color::White => 8,  // Move up the board (for white)
//         Color::Black => -8, // Move down the board (for black)
//     };

//     // Calculate the forward move
//     let target_square = pawn_square as isize + direction;
//     if self.is_square_empty(target_square) {
//         possible_moves.push(Square::usize_to_square(target_square as usize));

//         // Check for initial double move
//         let initial_rank = match color {
//             Color::White => 1,
//             Color::Black => 6,
//         };
//         if self.rank_of(pawn_square) == initial_rank {
//             let double_move_square = pawn_square as isize + 2 * direction;
//             if self.is_square_empty(double_move_square) {
//                 possible_moves.push(Square::usize_to_square(double_move_square as usize));
//             }
//         }
//     }

//     // Check for promotions
//     let promotion_rank = match color {
//         Color::White => 7,
//         Color::Black => 0,
//     };
//     if self.rank_of(target_square as usize) == promotion_rank {
//         // Push promotion move (basic example without specific piece choice)
//         possible_moves.push(Square::usize_to_square(target_square as usize));
//     }

//     possible_moves
// }

#[wasm_bindgen]
pub fn generate_knight_moves(knight_square: Square) -> Vec<Square> {
    let mut possible_moves = Vec::new();
    let knight_moves = [15, 17, 6, 10, -15, -17, -6, -10];

    for &offset in &knight_moves {
        let target_square = knight_square as isize + offset;
        possible_moves.push(Square::usize_to_square(target_square as usize));
    }

    possible_moves
}

// /// Generate all possible non-capture moves for a king located at `king_square`
// pub fn generate_king_moves(king_square: Square) -> Vec<Square> {
//     let mut possible_moves = Vec::new();
//     let directions: [(isize, isize); 8] = [
//         (-1, -1),
//         (-1, 0),
//         (-1, 1),
//         (0, -1),
//         (0, 1),
//         (1, -1),
//         (1, 0),
//         (1, 1),
//     ]; // All surrounding squares

//     let current_square = king_square as isize;
//     for (dx, dy) in directions.iter() {
//         let target_square = current_square + dx * 8 + dy;
//         if self.is_square_empty(target_square) && self.is_square_empty(target_square) {
//             possible_moves.push(Square::usize_to_square(target_square as usize));
//         }
//     }

//     possible_moves
// }
