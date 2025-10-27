use crate::{board::bitboard::BitBoard, pieces::Color};

// File masks as compile-time constants
pub const NOT_A_FILE: BitBoard = BitBoard(0xFEFEFEFEFEFEFEFE);
pub const NOT_H_FILE: BitBoard = BitBoard(0x7F7F7F7F7F7F7F7F);
pub const NOT_HG_FILE: BitBoard = BitBoard(0x3F3F3F3F3F3F3F3F);
pub const NOT_AB_FILE: BitBoard = BitBoard(0xFCFCFCFCFCFCFCFC);

// Rank and file masks for boundary checking

/* const RANK_1: BitBoard = BitBoard(0x00000000000000FF);
const RANK_2: BitBoard = BitBoard(0x000000000000FF00);
const RANK_7: BitBoard = BitBoard(0x00FF000000000000);
const RANK_8: BitBoard = BitBoard(0xFF00000000000000); */

/// Precomputed pawn moves for all squares (avoids Vec allocations)
#[inline(always)]
pub fn computed_pawn_moves(color: &Color) -> [BitBoard; 64] {
    let mut pawn_moves = [BitBoard::EMPTY; 64];

    #[allow(clippy::needless_range_loop)]
    for i in 0..64 {
        pawn_moves[i] = pawn_moves_fast(i, color);
    }
    pawn_moves
}

/// Precomputed pawn attacks for all squares
#[inline(always)]
pub fn computed_pawn_attacks(color: &Color) -> [BitBoard; 64] {
    let mut pawn_attacks = [BitBoard::EMPTY; 64];

    #[allow(clippy::needless_range_loop)]
    for i in 0..64 {
        pawn_attacks[i] = pawn_attacks_fast(i as u8, color);
    }
    pawn_attacks
}

/// Precomputed knight attacks for all squares
#[inline(always)]
pub fn computed_knight_attacks() -> [BitBoard; 64] {
    let mut knight_attacks = [BitBoard::EMPTY; 64];

    #[allow(clippy::needless_range_loop)]
    for i in 0..64 {
        knight_attacks[i] = knight_attacks_fast(i as u8);
    }
    knight_attacks
}

/// Precomputed king moves for all squares
#[inline(always)]
pub fn computed_king_moves() -> [BitBoard; 64] {
    let mut king_moves = [BitBoard::EMPTY; 64];

    #[allow(clippy::needless_range_loop)]
    for i in 0..64 {
        king_moves[i] = king_attacks_fast(i as u8);
    }
    king_moves
}

/// Optimized pawn moves - no intermediate bitboard creation
#[inline(always)]
pub fn pawn_moves_fast(square: usize, color: &Color) -> BitBoard {
    let mut moves = BitBoard::EMPTY;
    let square_bb = 1u64 << square;

    match color {
        Color::White => {
            // Single step forward
            if square < 56 {
                // Not on 8th rank
                moves |= square_bb << 8;
            }

            // Double step from starting position
            if (8..=15).contains(&square) {
                // On 2nd rank
                moves |= square_bb << 16;
            }
        }
        Color::Black => {
            // Single step forward
            if square >= 8 {
                // Not on 1st rank
                moves |= square_bb >> 8;
            }

            // Double step from starting position
            if (48..=55).contains(&square) {
                // On 7th rank
                moves |= square_bb >> 16;
            }
        }
    }
    moves
}

/// Optimized pawn attacks - branchless where possible
#[inline(always)]
pub fn pawn_attacks_fast(square: u8, color: &Color) -> BitBoard {
    let square_bb = 1u64 << square;
    let file = square & 7; // square % 8

    match color {
        Color::White => {
            let mut attacks = BitBoard::EMPTY;
            // Attack up-left (avoid A-file wrap)
            if file != 0 && square < 56 {
                attacks |= square_bb << 7;
            }
            // Attack up-right (avoid H-file wrap)
            if file != 7 && square < 56 {
                attacks |= square_bb << 9;
            }
            attacks
        }
        Color::Black => {
            let mut attacks = BitBoard::EMPTY;
            // Attack down-left (avoid H-file wrap)
            if file != 7 && square >= 8 {
                attacks |= square_bb >> 7;
            }
            // Attack down-right (avoid A-file wrap)
            if file != 0 && square >= 8 {
                attacks |= square_bb >> 9;
            }
            attacks
        }
    }
}

/// Optimized knight attacks using bit shifts and masks
#[inline(always)]
pub fn knight_attacks_fast(square: u8) -> BitBoard {
    let square_bb = 1u64 << square;
    let file = square & 7;
    let mut attacks = BitBoard::EMPTY;

    // Use conditional compilation or bit manipulation to avoid branches

    // Up-Up-Right (+17)
    if square < 48 && file < 7 {
        attacks |= square_bb << 17;
    }

    // Up-Up-Left (+15)
    if square < 48 && file > 0 {
        attacks |= square_bb << 15;
    }

    // Right-Right-Up (+10)
    if square < 56 && file < 6 {
        attacks |= square_bb << 10;
    }

    // Right-Right-Down (-6)
    if square >= 8 && file < 6 {
        attacks |= square_bb >> 6;
    }

    // Down-Down-Right (-15)
    if square >= 16 && file < 7 {
        attacks |= square_bb >> 15;
    }

    // Down-Down-Left (-17)
    if square >= 16 && file > 0 {
        attacks |= square_bb >> 17;
    }

    // Left-Left-Down (-10)
    if square >= 8 && file > 1 {
        attacks |= square_bb >> 10;
    }

    // Left-Left-Up (+6)
    if square < 56 && file > 1 {
        attacks |= square_bb << 6;
    }

    attacks
}

/// Optimized king attacks
#[inline(always)]
pub fn king_attacks_fast(square: u8) -> BitBoard {
    let square_bb = 1u64 << square;
    let file = square & 7;
    let rank = square >> 3;
    let mut attacks = BitBoard::EMPTY;

    // North (+8)
    if rank < 7 {
        attacks |= square_bb << 8;
    }

    // South (-8)
    if rank > 0 {
        attacks |= square_bb >> 8;
    }

    // East (+1)
    if file < 7 {
        attacks |= square_bb << 1;
    }

    // West (-1)
    if file > 0 {
        attacks |= square_bb >> 1;
    }

    // Northeast (+9)
    if rank < 7 && file < 7 {
        attacks |= square_bb << 9;
    }

    // Northwest (+7)
    if rank < 7 && file > 0 {
        attacks |= square_bb << 7;
    }

    // Southeast (-7)
    if rank > 0 && file < 7 {
        attacks |= square_bb >> 7;
    }

    // Southwest (-9)
    if rank > 0 && file > 0 {
        attacks |= square_bb >> 9;
    }

    attacks
}

/// Optimized rook attacks with minimal memory allocation
#[inline(always)]
pub fn rook_attacks_on_the_fly(square: u8, blockers: BitBoard) -> BitBoard {
    let mut attacks = BitBoard::EMPTY;
    let rank = square >> 3; // square / 8
    let file = square & 7; // square % 8

    // North (up ranks)
    for r in (rank + 1)..8 {
        let target_square = (r << 3) | file;
        let target_bb = 1u64 << target_square;
        attacks |= target_bb;
        if blockers & target_bb != 0 {
            break;
        }
    }

    // South (down ranks)
    for r in (0..rank).rev() {
        let target_square = (r << 3) | file;
        let target_bb = 1u64 << target_square;
        attacks |= target_bb;
        if blockers & target_bb != 0 {
            break;
        }
    }

    // East (right files)
    for f in (file + 1)..8 {
        let target_square = (rank << 3) | f;
        let target_bb = 1u64 << target_square;
        attacks |= target_bb;
        if blockers & target_bb != 0 {
            break;
        }
    }

    // West (left files)
    for f in (0..file).rev() {
        let target_square = (rank << 3) | f;
        let target_bb = 1u64 << target_square;
        attacks |= target_bb;
        if blockers & target_bb != 0 {
            break;
        }
    }

    attacks
}

/// Optimized bishop attacks
#[inline(always)]
pub fn bishop_attacks_on_the_fly(square: u8, blockers: BitBoard) -> BitBoard {
    let mut attacks = BitBoard::EMPTY;
    let rank = square >> 3;
    let file = square & 7;

    // Northeast diagonal
    let mut r = rank + 1;
    let mut f = file + 1;
    while r < 8 && f < 8 {
        let target_square = (r << 3) | f;
        let target_bb = 1u64 << target_square;
        attacks |= target_bb;
        if blockers & target_bb != 0 {
            break;
        }
        r += 1;
        f += 1;
    }

    // Northwest diagonal
    r = rank + 1;
    f = file.wrapping_sub(1);
    while r < 8 && f < 8 {
        // f < 8 handles underflow
        let target_square = (r << 3) | f;
        let target_bb = 1u64 << target_square;
        attacks |= target_bb;
        if blockers & target_bb != 0 {
            break;
        }
        r += 1;
        f = f.wrapping_sub(1);
    }

    // Southeast diagonal
    r = rank.wrapping_sub(1);
    f = file + 1;
    while r < 8 && f < 8 {
        // r < 8 handles underflow
        let target_square = (r << 3) | f;
        let target_bb = 1u64 << target_square;
        attacks |= target_bb;
        if blockers & target_bb != 0 {
            break;
        }
        r = r.wrapping_sub(1);
        f += 1;
    }

    // Southwest diagonal
    r = rank.wrapping_sub(1);
    f = file.wrapping_sub(1);
    while r < 8 && f < 8 {
        // Both handle underflow
        let target_square = (r << 3) | f;
        let target_bb = 1u64 << target_square;
        attacks |= target_bb;
        if blockers & target_bb != 0 {
            break;
        }
        r = r.wrapping_sub(1);
        f = f.wrapping_sub(1);
    }

    attacks
}

/// Queen attacks = Rook + Bishop
#[inline(always)]
pub fn queen_attacks_on_the_fly(square: u8, blockers: BitBoard) -> BitBoard {
    rook_attacks_on_the_fly(square, blockers) | bishop_attacks_on_the_fly(square, blockers)
}

/// Optimized rook attack masks (for magic bitboard setup if needed later)
#[inline(always)]
pub fn mask_rook_attacks(square: u8) -> BitBoard {
    let mut attacks = BitBoard::EMPTY;
    let rank = square >> 3;
    let file = square & 7;

    // Vertical (exclude edge ranks)
    for r in 1..7 {
        if r != rank {
            attacks |= 1u64 << ((r << 3) | file);
        }
    }

    // Horizontal (exclude edge files)
    for f in 1..7 {
        if f != file {
            attacks |= 1u64 << ((rank << 3) | f);
        }
    }

    attacks
}

/// Optimized bishop attack masks
#[inline(always)]
pub fn mask_bishop_attacks(square: u8) -> BitBoard {
    let mut attacks = BitBoard::EMPTY;
    let rank = square >> 3;
    let file = square & 7;

    // All diagonals, excluding edges
    for i in 1..7 {
        // Northeast
        let ne_rank = rank + i;
        let ne_file = file + i;
        if ne_rank < 7 && ne_file < 7 {
            attacks |= 1u64 << ((ne_rank << 3) | ne_file);
        }

        // Northwest
        let nw_rank = rank + i;
        if nw_rank < 7 && file >= i && (file - i) > 0 {
            let nw_file = file - i;
            attacks |= 1u64 << ((nw_rank << 3) | nw_file);
        }

        // Southeast
        if rank >= i && (rank - i) > 0 {
            let se_rank = rank - i;
            let se_file = file + i;
            if se_file < 7 {
                attacks |= 1u64 << ((se_rank << 3) | se_file);
            }
        }

        // Southwest
        if rank >= i && (rank - i) > 0 && file >= i && (file - i) > 0 {
            let sw_rank = rank - i;
            let sw_file = file - i;
            attacks |= 1u64 << ((sw_rank << 3) | sw_file);
        }
    }

    attacks
}
