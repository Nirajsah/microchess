use crate::{
    piece::{Color, Piece},
    prng::*,
    square::Square,
};
use lazy_static::lazy_static;

lazy_static! {
    pub static ref PIECE_KEYS: [[u64; 12]; 64] = {
        let mut t = [[0; 12]; 64];
        for row in t.iter_mut() {
            for p in row.iter_mut() {
                *p = get_random_u64();
            }
        }
        t
    };
    pub static ref EP_KEYS: [u64; 64] = {
        let mut t = [0; 64];
        for i in t.iter_mut() {
            *i = get_random_u64();
        }
        t
    };
    pub static ref CASTLE_KEYS: [u64; 4] = {
        let mut t = [0; 4];
        for i in t.iter_mut() {
            *i = get_random_u64();
        }
        t
    };
    pub static ref BLACK_TO_MOVE: u64 = get_random_u64();
}

// A function to update piece hashing
pub fn update_piece_hash(sq: Square, p: Piece, hash: &mut u64) {
    *hash ^= PIECE_KEYS[sq as usize][p as usize];
}

// A function to update en_passant hashing
pub fn update_ep_hash(sq: Square, hash: &mut u64) {
    *hash ^= EP_KEYS[sq as usize];
}

// A function to update castling_rights hashing
pub fn update_castle_hash(new_rights: [bool; 4], hash: &mut u64) {
    for i in 0..4 {
        if new_rights[i] {
            // XOR the key only if the castling right is currently true
            *hash ^= CASTLE_KEYS[i];
        }
    }
}

// A function to update active_player hashing
pub fn update_side_hash(side: Color, hash: &mut u64) {
    if side == Color::White {
        *hash ^= *BLACK_TO_MOVE;
    }
}
