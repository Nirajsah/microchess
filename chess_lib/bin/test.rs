use chess_lib::{
    board::{bitboard::BitBoard, chessboard::ChessBoard},
    pieces::Color,
};

fn main() {
    let res = ChessBoard::with_fen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq d4 0 1");
    let result = ChessBoard::new();
    println!("FEN {:?}", result.to_fen(Color::White, &20, &59));

    println!("FEN {:?}", res);
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
        }
        println!("        {}", rank + 1);
    }
}
