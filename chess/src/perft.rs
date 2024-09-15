// use crate::{chessboard::ChessBoard, piece::Piece, square::Square, ChessError, Game, MoveType};
//
// pub fn perft(depth: u32) -> (u32, u64, u64, u64) {
//     let mut game = Game::new();
//     perft_helper(&mut game, depth)
// }
//
// fn perft_helper(game: &mut Game, depth: u32) -> (u32, u64, u64, u64) {
//     if depth == 0 {
//         return (depth, 1, 0, 0);
//     }
//
//     let mut nodes = 0;
//     let mut captures = 0;
//     let mut moves_made = 0;
//     let mut pieces = game.board.all_pieces();
//
//     while pieces != 0 {
//         let from_square = Square::usize_to_square(pieces.trailing_zeros() as usize);
//         let mut m = MoveType::Move;
//         if let Some(piece) = game.board.get_piece_at(from_square) {
//             if let Some(moves) = get_possible_moves(&game.board, from_square, piece) {
//                 log::info!("{:?}: {:?}", piece, moves);
//                 for to in moves {
//                     // Save the current state for undoing
//                     let captured_piece = game.board.get_piece_at(to);
//                     if captured_piece.is_some() {
//                         captures += 1;
//                         m = MoveType::Capture(captured_piece.unwrap());
//                     }
//
//                     let result = game.make_move(from_square, to, piece, m);
//
//                     match result {
//                         Ok(_) => {
//                             let (_d, n, _c, m) = perft_helper(game, depth - 1);
//                             nodes += n;
//                             moves_made += 1;
//
//                             game.board
//                                 .undo_move(from_square, to, &piece, captured_piece)
//                                 .unwrap();
//                         }
//                         Err(e) => {
//                             if e == ChessError::InvalidCapture {
//                                 // Handle invalid capture specifically
//                                 // This assumes `captured_piece` needs to be adjusted
//                                 captures -= 1;
//                             } else {
//                                 // Handle other errors or decrement moves_made if needed
//                                 moves_made -= 1; // Adjust this if `moves_made` should reflect something else
//                             }
//                         }
//                     }
//                     break;
//                 }
//             }
//         }
//
//         pieces &= pieces - 1;
//     }
//
//     (depth, nodes, captures, moves_made)
// }
//
// fn get_possible_moves(board: &ChessBoard, from: Square, piece: Piece) -> Option<Vec<Square>> {
//     let color = piece.color();
//     match piece {
//         Piece::WhitePawn | Piece::BlackPawn => board.get_pawn_moves(from, color),
//         Piece::WhiteKnight | Piece::BlackKnight => board.get_knight_moves(from, color),
//         Piece::WhiteKing | Piece::BlackKing => board.get_king_moves(from, color),
//         Piece::WhiteBishop | Piece::BlackBishop => board.get_bishop_moves(from, color),
//         Piece::WhiteRook | Piece::BlackRook => board.get_rook_moves(from, color),
//         Piece::WhiteQueen | Piece::BlackQueen => board.get_queen_moves(from, color),
//     }
// }

use std::collections::HashSet;

use crate::{
    chessboard::ChessBoard, piece::Piece, square::Square, ChessError, Game, MoveData, MoveType,
};

pub fn perft(depth: u32, game: &mut Game) -> (u32, u64, u64, u64) {
    perft_helper(game, depth)
}

fn perft_helper(game: &mut Game, depth: u32) -> (u32, u64, u64, u64) {
    if depth == 0 {
        return (depth, 1, 0, 0);
    }

    let mut nodes = 0;
    let mut captures = 0;
    let mut moves_made = 0;
    let mut pieces = game.board.all_pieces();
    let mut move_count: u8 = 0;
    let mut undo_count: u8 = 0;

    // while pieces != 0 {
    //     let from_square = Square::usize_to_square(pieces.trailing_zeros() as usize);
    //     if let Some(piece) = game.board.get_piece_at(from_square) {
    //         if let Some(moves) = get_possible_moves(&game.board, from_square, piece) {
    //             for mv in moves {
    //                 let result =
    //                     game.make_move(mv.from, mv.to, mv.piece, mv.move_type, &mut move_count);
    //                 match result {
    //                     Ok(_) => {
    //                         let (_d, n, _c, _m) = perft_helper(game, depth - 1);
    //                         nodes += n;
    //                         moves_made += 1;

    //                         game.board
    //                             .undo_move(&mv, &mut undo_count)
    //                             .expect("Undo failed");
    //                     }
    //                     Err(e) => {
    //                         if e == ChessError::InvalidCapture {
    //                             // Handle invalid capture specifically
    //                             // This assumes `captured_piece` needs to be adjusted
    //                             // captures -= 1;
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     pieces &= pieces - 1;
    // }

    let possible_moves = generate_all_legal_moves(&game.board);

    for move_data in possible_moves {
        let result = game.make_move(
            move_data.from,
            move_data.to,
            move_data.piece,
            move_data.move_type,
            &mut move_count,
        );
        match result {
            Ok(_) => {
                let (_d, n, c, m) = perft_helper(game, depth - 1);
                nodes += n;
                captures += c;
                moves_made += m + 1;
                log::info!("Move made: {:?}", move_data);

                game.board
                    .undo_move(&move_data, &mut undo_count)
                    .expect("Undo failed");
            }
            Err(e) => {
                log::warn!("Invalid move: {:?}", e);
            }
        }
    }

    log::info!("Moves count: {:?} Undo Moves: {:?}", move_count, undo_count);

    (depth, nodes, captures, moves_made)
}

fn get_possible_moves(board: &ChessBoard, from: Square, piece: Piece) -> Option<Vec<Square>> {
    let color = piece.color();
    let moves = match piece {
        Piece::WhitePawn | Piece::BlackPawn => board.get_pawn_moves(from, color),
        Piece::WhiteKnight | Piece::BlackKnight => board.get_knight_moves(from, color),
        Piece::WhiteKing | Piece::BlackKing => board.get_king_moves(from, color),
        Piece::WhiteBishop | Piece::BlackBishop => board.get_bishop_moves(from, color),
        Piece::WhiteRook | Piece::BlackRook => board.get_rook_moves(from, color),
        Piece::WhiteQueen | Piece::BlackQueen => board.get_queen_moves(from, color),
    };

    moves
}

/// Generate all possible Moves
pub fn generate_all_legal_moves(board: &ChessBoard) -> Vec<MoveData> {
    let mut all_moves: Vec<MoveData> = Vec::new();

    for sq in 0..64 {
        let from = Square::usize_to_square(sq);
        if let Some(piece) = board.get_piece_at(from) {
            if let Some(moves) = get_possible_moves(&board, from, piece) {
                log::info!("Possible moves found at: {:?} for piece: {:?}", from, piece);
                all_moves.extend(
                    moves
                        .into_iter()
                        .map(|to| MoveData::new(from, to, piece, &board)),
                );
            }
        }
    }
    all_moves
}
