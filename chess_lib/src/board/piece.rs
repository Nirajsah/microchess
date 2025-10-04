use serde::{Deserialize, Serialize};

use crate::pieces::Color;
#[repr(u8)]
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub enum Piece {
    WhitePawn = 0,
    WhiteKnight = 1,
    WhiteBishop = 2,
    WhiteRook = 3,
    WhiteQueen = 4,
    WhiteKing = 5,
    BlackPawn = 6,
    BlackKnight = 7,
    BlackBishop = 8,
    BlackRook = 9,
    BlackQueen = 10,
    BlackKing = 11,
}

impl Piece {
    #[rustfmt::skip]
    pub fn color(&self) -> Color {
      match self {
        Piece::WhitePawn | Piece::WhiteKnight | Piece::WhiteBishop | Piece::WhiteRook | Piece::WhiteQueen | Piece::WhiteKing => Color::White,
        Piece::BlackPawn | Piece::BlackKnight | Piece::BlackBishop | Piece::BlackRook | Piece::BlackQueen | Piece::BlackKing => Color::Black,
      }
    }

    #[inline]
    pub fn index(self) -> usize {
        self as usize
    }

    pub fn move_index(&self) -> usize {
        match self {
            Piece::WhitePawn => 0,
            Piece::BlackPawn => 1,
            Piece::WhiteKnight | Piece::BlackKnight => 2,
            Piece::WhiteBishop | Piece::BlackBishop => 3,
            Piece::WhiteRook | Piece::BlackRook => 4,
            Piece::WhiteQueen | Piece::BlackQueen => 5,
            Piece::WhiteKing | Piece::BlackKing => 6,
        }
    }

    pub fn is_white(&self) -> bool {
        self.color() == Color::White
    }

    pub fn is_black(&self) -> bool {
        self.color() == Color::Black
    }

    pub fn is_pawn(&self) -> bool {
        match *self {
            Self::WhitePawn => true,
            Self::BlackPawn => true,
            _ => false,
        }
    }

    pub fn is_king(&self) -> bool {
        match *self {
            Self::WhiteKing => true,
            Self::BlackKing => true,
            _ => false,
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        let bytes = s.as_bytes();
        if bytes.len() != 2 {
            return None;
        }

        let color = match bytes[0] {
            b'w' | b'W' => Color::White,
            b'b' | b'B' => Color::Black,
            _ => return None,
        };

        match (color, bytes[1]) {
            (Color::White, b'P') => Some(Piece::WhitePawn),
            (Color::White, b'N') => Some(Piece::WhiteKnight),
            (Color::White, b'B') => Some(Piece::WhiteBishop),
            (Color::White, b'R') => Some(Piece::WhiteRook),
            (Color::White, b'Q') => Some(Piece::WhiteQueen),
            (Color::White, b'K') => Some(Piece::WhiteKing),

            (Color::Black, b'P') => Some(Piece::BlackPawn),
            (Color::Black, b'N') => Some(Piece::BlackKnight),
            (Color::Black, b'B') => Some(Piece::BlackBishop),
            (Color::Black, b'R') => Some(Piece::BlackRook),
            (Color::Black, b'Q') => Some(Piece::BlackQueen),
            (Color::Black, b'K') => Some(Piece::BlackKing),

            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_piece_move_index_table() {
        let cases = vec![
            (Piece::WhitePawn, 0),
            (Piece::BlackPawn, 1),
            (Piece::WhiteKnight, 2),
            (Piece::BlackKnight, 2),
            (Piece::WhiteBishop, 3),
            (Piece::BlackBishop, 3),
            (Piece::WhiteRook, 4),
            (Piece::BlackRook, 4),
            (Piece::WhiteQueen, 5),
            (Piece::BlackQueen, 5),
            (Piece::WhiteKing, 6),
            (Piece::BlackKing, 6),
        ];

        for (piece, expected_index) in cases {
            assert_eq!(piece.move_index(), expected_index, "Failed for {:?}", piece);
        }
    }
}
