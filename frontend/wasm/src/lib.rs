use std::collections::HashMap;

use wasm_bindgen::prelude::*;

mod utils;

#[wasm_bindgen]
pub fn generate_possible_moves(
    piece: &str,
    square: &str,
    board: &JsValue,
    white_castle: bool,
    black_castle: bool,
    en_passant: &str
) -> Result<Vec<String>, JsValue> {
    let board: HashMap<String, String> = serde_wasm_bindgen::from_value(board.clone())
        .map_err(|e| JsValue::from_str(&format!("Failed to deserialize board: {}", e)))?;

    let possible_moves = utils::generate_possible_moves(piece, square, &board, white_castle, black_castle, en_passant);
    
    Ok(possible_moves)
}