use chess_lib::board::{bitboard::BitBoard, chessboard::ChessBoard};

fn main() {
    let res = ChessBoard::new();
    println!("FEN {:?}", res.to_fen(&20, &59));
    print_bitboard(res.all_pieces());
}

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
            // print!("  {}  ", piece);
        }
        println!("        {}", rank + 1);
    }
}
