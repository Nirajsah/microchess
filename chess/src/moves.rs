use crate::{piece::Piece, prng::generate_magic_number, Bitboard, Color, Square};

pub const NOT_A_FILE: Bitboard = 0xFEFEFEFEFEFEFEFE;
pub const NOT_H_FILE: Bitboard = 0x7F7F7F7F7F7F7F7F;
pub const NOT_HG_FILE: Bitboard = 0x3F3F3F3F3F3F3F3F;
pub const NOT_AB_FILE: Bitboard = 0xFCFCFCFCFCFCFCFC;

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
/// possible rook attacks
pub fn rook_attacks_on_the_fly(square: Square, block: Bitboard) -> Bitboard {
    let mut attacks = 0u64;

    let target_rank = square as u8 / 8;
    let target_file = square as u8 % 8;

    // Up
    for rank in (target_rank + 1)..8 {
        let square = 1u64 << rank * 8 + target_file;
        attacks |= square;
        if rank <= 7 && (block & square) != 0 {
            break;
        }
    }
    // Down
    for rank in (0..target_rank).rev() {
        let square = 1u64 << rank * 8 + target_file;
        attacks |= square;
        if (block & square) != 0 {
            break;
        }
    }
    // Right
    for file in (target_file + 1)..8 {
        let square = 1u64 << target_rank * 8 + file;
        attacks |= square;
        if file <= 7 && (block & square) != 0 {
            break;
        }
    }
    // Left
    for file in (0..target_file).rev() {
        let square = 1u64 << target_rank * 8 + file;
        // if file >= 0 {
        attacks |= square;
        if (block & square) != 0 {
            break;
        }
    }
    attacks
}

/// possible bishop attacks
pub fn bishop_attacks_on_the_fly(square: Square, block: Bitboard) -> Bitboard {
    let mut attacks = 0u64;

    let target_rank = square as u8 / 8;
    let target_file = square as u8 % 8;

    // Up-right
    for rank in (target_rank + 1)..8 {
        let file = target_file as i8 + ((rank - target_rank) as i8);
        let square = rank * 8 + file as u8;
        if file >= 0 && file < 8 {
            attacks |= 1u64 << square;
            if (block & (1u64 << square)) != 0 {
                break;
            }
        } else {
            break;
        }
    }
    // Up-left
    for rank in (target_rank + 1)..8 {
        let file = target_file as i8 - ((rank - target_rank) as i8);
        let square = rank * 8 + file as u8;
        if rank <= 7 && file >= 0 {
            attacks |= 1u64 << square;
            if (block & (1u64 << square)) != 0 {
                break;
            }
        } else {
            break;
        }
    }

    // Down-right
    for rank in (0..target_rank).rev() {
        let file = target_file as i8 + ((target_rank - rank) as i8);

        let square = rank * 8 + file as u8;
        if file <= 7 {
            attacks |= 1u64 << (rank * 8 + file as u8);
            if (block & (1u64 << square)) != 0 {
                break;
            }
        } else {
            break;
        }
    }

    // Down-left
    for rank in (0..target_rank).rev() {
        let file = target_file as i8 - ((target_rank - rank) as i8);
        let square = rank * 8 + file as u8;
        if file >= 0 {
            attacks |= 1u64 << (rank * 8 + file as u8);
            if (block & (1u64 << square)) != 0 {
                break;
            }
        } else {
            break;
        }
    }
    attacks
}

pub fn queen_attacks_on_the_fly(square: Square, block: Bitboard) -> Bitboard {
    let mut attacks = 0u64;

    attacks |= rook_attacks_on_the_fly(square, block);
    attacks |= bishop_attacks_on_the_fly(square, block);

    attacks
}

pub fn mask_bishop_attacks(square: u8) -> Bitboard {
    let mut attacks = 0u64;

    let target_rank = square / 8;
    let target_file = square % 8;

    // Up-right
    for rank in (target_rank + 1)..8 {
        let file = target_file as i8 + ((rank - target_rank) as i8);
        if rank <= 6 && file <= 6 {
            attacks |= 1u64 << (rank * 8 + file as u8);
        } else {
            break;
        }
    }
    // Up-left
    for rank in (target_rank + 1)..8 {
        let file = target_file as i8 - ((rank - target_rank) as i8);
        if rank <= 6 && file >= 1 {
            attacks |= 1u64 << (rank * 8 + file as u8);
        } else {
            break;
        }
    }

    // Down-right
    for rank in (0..target_rank).rev() {
        let file = target_file as i8 + ((target_rank - rank) as i8);
        if rank >= 1 && file <= 6 {
            attacks |= 1u64 << (rank * 8 + file as u8);
        } else {
            break;
        }
    }

    // Down-left
    for rank in (0..target_rank).rev() {
        let file = target_file as i8 - ((target_rank - rank) as i8);
        if rank >= 1 && file >= 1 {
            attacks |= 1u64 << (rank * 8 + file as u8);
        } else {
            break;
        }
    }
    attacks
}

pub fn mask_rook_attacks(square: u8) -> Bitboard {
    let mut attacks = 0u64;

    let target_rank = square / 8;
    let target_file = square % 8;

    // Up
    for rank in (target_rank + 1)..8 {
        if rank <= 6 {
            attacks |= 1u64 << (rank * 8 + target_file);
        }
    }
    // Down
    for rank in (0..target_rank).rev() {
        if rank >= 1 {
            attacks |= 1u64 << (rank * 8 + target_file);
        }
    }
    // Right
    for file in (target_file + 1)..8 {
        if file <= 6 {
            attacks |= 1u64 << (target_rank * 8 + file);
        }
    }
    // Left
    for file in (0..target_file).rev() {
        if file >= 1 {
            attacks |= 1u64 << (target_rank * 8 + file);
        }
    }
    attacks
}

#[derive(Debug, Default, Clone, Copy)]
pub struct MagicEntry {
    pub relevant_occupancy: u64,
    pub magic: u64,
    pub index_bits: u8,
    pub offset: usize,
}

pub struct TableFillError;

pub fn magic_index(entry: &MagicEntry, blockers: Bitboard) -> usize {
    let relevant_blockers = blockers & entry.relevant_occupancy;
    let hash = relevant_blockers.wrapping_mul(entry.magic);
    let index = (hash >> (64 - entry.index_bits)) as usize + entry.offset;
    index
}

fn try_make_table(
    sq: usize,
    slider: Piece,
    magic: &MagicEntry,
) -> Result<Vec<Bitboard>, TableFillError> {
    let mut table = vec![0u64; 1 << magic.index_bits];

    let mut subset: u64 = 0;
    loop {
        let table_entry = &mut table[magic_index(magic, subset.into())];
        let moves = match slider {
            Piece::WhiteRook | Piece::BlackRook => mask_rook_attacks(sq as u8),
            Piece::WhiteBishop | Piece::BlackBishop => mask_bishop_attacks(sq as u8),
            _ => panic!("{:?} is not a sliding Piece", slider),
        };

        if *table_entry == 0 {
            *table_entry = moves.into();
        } else if *table_entry != moves {
            return Err(TableFillError);
        }

        subset = subset.wrapping_sub(magic.relevant_occupancy) & magic.relevant_occupancy;
        if subset == 0 {
            break;
        }
    }

    Ok(table)
}

pub fn find_magic(sq: usize, slider: Piece) -> Vec<Bitboard> {
    let relevant_occupancy = match slider.clone() {
        Piece::WhiteRook | Piece::BlackRook => mask_rook_attacks(sq as u8),
        Piece::WhiteBishop | Piece::BlackBishop => mask_bishop_attacks(sq as u8),
        _ => panic!("{:?} is not a sliding Piece", slider),
    };

    loop {
        let magic = generate_magic_number();
        let index_bits = relevant_occupancy.count_ones() as u8;
        let magic_entry = MagicEntry {
            relevant_occupancy,
            magic,
            index_bits,
            offset: 0,
        };
        if let Ok(table) = try_make_table(sq, slider, &magic_entry) {
            return table;
        }
    }
}
