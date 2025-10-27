use crate::board::bitboard::BitBoard;

pub fn print_bitboard(board: BitBoard) {
    println!("    a    b    c    d    e    f    g    h\n");
    for rank in (0..8).rev() {
        print!("{} ", rank + 1);
        for file in 0..8 {
            let square = rank * 8 + file;
            let piece = board.0 & (1u64 << square) != 0;
            if piece {
                print!("  1  ");
            } else {
                print!("  0  ");
            }
        }
        println!("        {}", rank + 1);
    }
}

/// Create an algebraic capture string like "cxb4".
pub fn create_capture_string(from: &str, to: &str) -> String {
    let from_file = &from[0..1];
    format!("{}x{}", from_file, to)
}
