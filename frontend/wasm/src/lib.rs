use std::collections::{BTreeMap, HashMap};

use serde::Serialize;
use serde_wasm_bindgen::Serializer;
use wasm_bindgen::prelude::*;

mod utils;

#[wasm_bindgen]
pub fn generate_possible_moves(
    piece: &str,
    square: &str,
    board: &JsValue,
    white_castle: bool,
    black_castle: bool,
    en_passant: &str,
) -> Result<Vec<String>, JsValue> {
    let board: HashMap<String, String> = match serde_wasm_bindgen::from_value(board.clone()) {
        Ok(board) => board,
        Err(_) => return Err(JsValue::from_str(&format!("board value after error: {:?}", &board))),
    };

    let possible_moves = utils::generate_possible_moves(
        piece,
        square,
        &board,
        white_castle,
        black_castle,
        en_passant,
    );

    Ok(possible_moves)
}

#[wasm_bindgen]
pub fn fen_to_board(fen: &str) -> Result<JsValue, JsValue> {
    let board: BTreeMap<String, String> = match utils::fen_to_board(fen) {
        Ok(board) => board.into_iter().collect(),
        Err(_) => return Err(JsValue::from_str("Invalid FEN")),
    };

    let serializer = Serializer::json_compatible();
    match board.serialize(&serializer) {
        Ok(js_value) => Ok(js_value),
        Err(_) => Err(JsValue::from_str("Serialization error")),
    }
}