use std::cell::RefCell;
use std::fmt::Write;
use wasm_bindgen::prelude::*;

mod utils;
use utils::*;

// Store board state on Rust side - avoid expensive boundary crossing
thread_local! {
    static BOARD_STATE: RefCell<Option<FenBoard>> = RefCell::new(None);
}

/// Initialize board from FEN string - call once at game start
#[wasm_bindgen]
pub fn init_board(fen: &str) -> Result<String, JsValue> {
    let board = fen_to_board(fen).map_err(|e| JsValue::from_str(&e))?;

    let json = board.to_json();

    BOARD_STATE.with(|state| {
        *state.borrow_mut() = Some(board);
    });

    Ok(json)
}

/// Update board with new FEN after a move
#[wasm_bindgen]
pub fn update_board(fen: &str) -> Result<(), JsValue> {
    let board = fen_to_board(fen).map_err(|e| JsValue::from_str(&e))?;

    BOARD_STATE.with(|state| {
        *state.borrow_mut() = Some(board);
    });

    Ok(())
}

/// Generate all possible moves for a piece at given square
/// Returns JSON array string: ["e3", "e4"]
#[wasm_bindgen]
pub fn generate_moves(square: &str) -> Result<String, JsValue> {
    BOARD_STATE.with(|state| {
        let board_ref = state.borrow();
        let board = board_ref
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Board not initialized"))?;

        let bytes = square.as_bytes();
        if bytes.len() != 2 {
            return Err(JsValue::from_str("Invalid square format"));
        }

        let file_idx = (bytes[0] - b'a') as usize;
        let rank_idx = (bytes[1] - b'1') as usize;

        if file_idx >= 8 || rank_idx >= 8 {
            return Err(JsValue::from_str("Square out of bounds"));
        }

        let piece = board.position[rank_idx][file_idx]
            .ok_or_else(|| JsValue::from_str("No piece at square"))?;

        let moves = generate_possible_moves(piece, file_idx, rank_idx, board);

        // Return JSON array string
        let mut json = String::with_capacity(moves.len() * 4);
        json.push('[');
        for (i, mv) in moves.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push('"');
            json.push_str(mv);
            json.push('"');
        }
        json.push(']');

        Ok(json)
    })
}

/// Get current board position as JSON string
#[wasm_bindgen]
pub fn get_board() -> Result<String, JsValue> {
    BOARD_STATE.with(|state| {
        let board_ref = state.borrow();
        let board = board_ref
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Board not initialized"))?;

        Ok(board.to_json())
    })
}

/// Get piece at square (format: "wP" for white pawn, "bR" for black rook, "" for empty)
#[wasm_bindgen]
pub fn get_piece_at(square: &str) -> Result<String, JsValue> {
    BOARD_STATE.with(|state| {
        let board_ref = state.borrow();
        let board = board_ref
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Board not initialized"))?;

        let bytes = square.as_bytes();
        if bytes.len() != 2 {
            return Ok(String::new());
        }

        let file_idx = (bytes[0] - b'a') as usize;
        let rank_idx = (bytes[1] - b'1') as usize;

        if file_idx >= 8 || rank_idx >= 8 {
            return Ok(String::new());
        }

        match board.position[rank_idx][file_idx] {
            Some((is_white, piece)) => Ok(format!("{}{}", if is_white { 'w' } else { 'b' }, piece)),
            None => Ok(String::new()),
        }
    })
}

/* /// Check if a square is under attack by opponent
/// take (square, by_white: bool) -> if by_white pass true else false
#[wasm_bindgen]
pub fn is_square_attacked(square: &str, by_white: bool) -> Result<bool, JsValue> {
    BOARD_STATE.with(|state| {
        let board_ref = state.borrow();
        let board = board_ref
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Board not initialized"))?;

        Ok(is_square_under_attack(square, by_white, board))
    })
} */

/// Get game metadata
#[wasm_bindgen]
pub fn get_game_state() -> Result<String, JsValue> {
    BOARD_STATE.with(|state| {
        let board_ref = state.borrow();
        let board = board_ref
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Board not initialized"))?;

        let mut json = String::with_capacity(128);

        // Append all scalar fields efficiently
        let _ = write!(
            json,
            "}},\"player_turn\":\"{}\",\"en_passant\":",
            board.player_turn
        );

        if let Some(ref ep) = board.en_passant {
            let _ = write!(json, "\"{}\"", ep);
        } else {
            json.push_str("null");
        }

        json.push_str(",\"king_in_check\":");
        if let Some(ref king) = board.king_in_check {
            let _ = write!(json, "\"{}\"", king);
        } else {
            json.push_str("null");
        }
        json.push('}');

        Ok(json)
    })
}

/// Perft test for debugging move generation
#[wasm_bindgen]
pub fn perft(depth: u8) -> Result<u64, JsValue> {
    BOARD_STATE.with(|state| {
        let board_ref = state.borrow();
        let board = board_ref
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Board not initialized"))?;

        Ok(perft_internal(board, depth))
    })
}
