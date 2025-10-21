use std::collections::HashMap;

use serde::Serialize;
use serde_wasm_bindgen::Serializer;
use utils::FenBoard;
use wasm_bindgen::prelude::*;
use web_sys::{window, MouseEvent, Element, Document};

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
    let board: FenBoard = match utils::fen_to_board(fen) {
        Ok(board) => board,
        Err(e) => return Err(JsValue::from_str(&e)),
    };

    let serializer = Serializer::json_compatible();
    match board.serialize(&serializer) {
        Ok(js_value) => Ok(js_value),
        Err(_) => Err(JsValue::from_str("Serialization error")),
    }
}

// JavaScript `console.log` binding
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Function to handle mouse events
#[wasm_bindgen]
pub fn start_listening() {
    let closure = Closure::wrap(Box::new(move |event: MouseEvent| {
        let x = event.client_x();
        let y = event.client_y();
        log(&format!("Mouse moved: x = {}, y = {}", x, y));
    }) as Box<dyn FnMut(MouseEvent)>);

    let window = window().unwrap();
    window
        .add_event_listener_with_callback("mousemove", closure.as_ref().unchecked_ref())
        .unwrap();

    closure.forget(); // Prevent the closure from being dropped
}
