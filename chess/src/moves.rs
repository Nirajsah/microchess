use crate::{Bitboard, Color, Square};

const NOT_A_FILE: Bitboard = 0xFEFEFEFEFEFEFEFE;
const NOT_H_FILE: Bitboard = 0x7F7F7F7F7F7F7F7F;
const NOT_HG_FILE: Bitboard = 0x3F3F3F3F3F3F3F3F;
const NOT_AB_FILE: Bitboard = 0xFCFCFCFCFCFCFCFC;

/// A function to compute all possible pawn moves
pub fn computed_pawn_moves(color: &Color) -> Vec<Bitboard> {
    let mut pawn_moves = Vec::new();
    for i in 0..64 {
        let boards = check_pawn_moves(i, &color);
        pawn_moves.push(boards);
    }
    pawn_moves
}

/// A function to compute pawn attacks
pub fn computed_pawn_attacks(color: &Color) -> Vec<Bitboard> {
    let mut pawn_moves = Vec::new();
    for i in 0..64 {
        let boards = mask_pawn_attacks(i, &color);
        pawn_moves.push(boards);
    }
    pawn_moves
}

/// A function to compute knight attacks
pub fn computed_knight_attacks() -> Vec<Bitboard> {
    let mut moves = Vec::new();
    for i in 0..64 {
        let boards = attacks_knight_moves(i);
        moves.push(boards);
    }
    moves
}
/// A function to compute king moves
pub fn computed_king_moves() -> Vec<Bitboard> {
    let mut moves = Vec::new();
    for i in 0..64 {
        let boards = attacks_king_moves(i);
        moves.push(boards);
    }
    moves
}

/// possible pawn_moves
pub fn check_pawn_moves(square: u8, color: &Color) -> Bitboard {
    let mut moves = 0u64;
    let mut board: Bitboard = 0u64;

    board |= 1u64 << square as u64; // Set the bit at the square

    match color {
        Color::White => {
            if square < (Square::A3 as u8) {
                moves |= board << 16; // Initial double step move
                moves |= board << 8; // White pawns move up the board
            }
            moves |= board << 8; // White pawns move up the board
        }
        Color::Black => {
            if square > (Square::H6 as u8) {
                moves |= board >> 16; // Initial double step move
                moves |= board >> 8; // Black pawns move down the board
            }
            moves |= board >> 8; // Black pawns move down the board
        }
    }
    moves
}

/// possible pawn_attacks
pub fn mask_pawn_attacks(square: u8, color: &Color) -> Bitboard {
    let mut attacks = 0u64;
    let mut board: Bitboard = 0u64;

    board |= 1u64 << square as u64; // Set the bit at the square

    match color {
        Color::White => {
            attacks |= (board << 9) & NOT_A_FILE; // White pawns attack up-right
            attacks |= (board << 7) & NOT_H_FILE; // White pawns attack up-left
        }
        Color::Black => {
            attacks |= (board >> 9) & NOT_H_FILE; // Black pawns attack down-left
            attacks |= (board >> 7) & NOT_A_FILE; // Black pawns attack down-right
        }
    }
    attacks
}

/// possible knight attacks
pub fn attacks_knight_moves(square: u8) -> Bitboard {
    let mut attacks = 0u64;
    let mut board: Bitboard = 0u64;

    board |= 1u64 << square as u64; // Set the bit at the square

    attacks |= (board >> 17) & NOT_H_FILE; // Knight attacks up-right
    attacks |= (board >> 15) & NOT_A_FILE; // Knight attacks up-left
    attacks |= (board >> 10) & NOT_HG_FILE; // Knight attacks right-up
    attacks |= (board >> 6) & NOT_AB_FILE; // Knight attacks left-up
    attacks |= (board << 17) & NOT_A_FILE; // Knight attacks down-left
    attacks |= (board << 15) & NOT_H_FILE; // Knight attacks down-right
    attacks |= (board << 10) & NOT_AB_FILE; // Knight attacks left-down
    attacks |= (board << 6) & NOT_HG_FILE; // Knight attacks right-down

    attacks
}

/// possible king moves
pub fn attacks_king_moves(square: u8) -> Bitboard {
    let mut attacks = 0u64;
    let mut board: Bitboard = 0u64;

    board |= 1u64 << square as u64; // Set the bit at the square

    attacks |= (board >> 9) & NOT_H_FILE; // King attacks up-right
    attacks |= board >> 8; // King attacks up
    attacks |= (board >> 7) & NOT_A_FILE; // King attacks up-left
    attacks |= (board >> 1) & NOT_H_FILE; // King attacks right
    attacks |= (board << 1) & NOT_A_FILE; // King attacks left
    attacks |= (board << 7) & NOT_H_FILE; // King attacks
    attacks |= board << 8; // King attacks down
    attacks |= (board << 9) & NOT_A_FILE; // King

    attacks
}
