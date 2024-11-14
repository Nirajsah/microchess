use std::str::FromStr;

use async_graphql::Enum;
use serde::{Deserialize, Serialize};

/// A struct to represent a color
#[derive(Debug, Default, Copy, Clone, PartialEq, Eq, Serialize, Deserialize, Enum)]
pub enum Color {
    #[default]
    White,
    Black,
}

#[derive(Ord, PartialOrd, Eq, PartialEq, Debug, Clone, Copy, Serialize, Deserialize, Enum)]
pub enum Piece {
    WhitePawn,
    WhiteKnight,
    WhiteBishop,
    WhiteRook,
    WhiteQueen,
    WhiteKing,
    BlackPawn,
    BlackKnight,
    BlackBishop,
    BlackRook,
    BlackQueen,
    BlackKing,
}

impl Piece {
    #[rustfmt::skip]
    pub fn color(&self) -> Color {
      match self {
        Piece::WhitePawn | Piece::WhiteKnight | Piece::WhiteBishop | Piece::WhiteRook | Piece::WhiteQueen | Piece::WhiteKing => Color::White,
        Piece::BlackPawn | Piece::BlackKnight | Piece::BlackBishop | Piece::BlackRook | Piece::BlackQueen | Piece::BlackKing => Color::Black,
      }
    }
    /// A function to get the opposite piece
    pub fn opp_piece(&self) -> Piece {
        match self {
            Piece::WhitePawn => Piece::BlackPawn,
            Piece::BlackPawn => Piece::WhitePawn,
            Piece::WhiteKnight => Piece::BlackKnight,
            Piece::BlackKnight => Piece::WhiteKnight,
            Piece::WhiteBishop => Piece::BlackBishop,
            Piece::BlackBishop => Piece::WhiteBishop,
            Piece::WhiteRook => Piece::BlackRook,
            Piece::BlackRook => Piece::WhiteRook,
            Piece::WhiteQueen => Piece::BlackQueen,
            Piece::BlackQueen => Piece::WhiteQueen,
            Piece::WhiteKing => Piece::BlackKing,
            Piece::BlackKing => Piece::WhiteKing,
        }
    }

    pub fn index(&self) -> usize {
        match self {
            Piece::WhitePawn => 0,
            Piece::WhiteKnight => 1,
            Piece::WhiteBishop => 2,
            Piece::WhiteRook => 3,
            Piece::WhiteQueen => 4,
            Piece::WhiteKing => 5,
            Piece::BlackPawn => 6,
            Piece::BlackKnight => 7,
            Piece::BlackBishop => 8,
            Piece::BlackRook => 9,
            Piece::BlackQueen => 10,
            Piece::BlackKing => 11,
        }
    }
}

impl Color {
    /// A function to get the opposite color
    pub fn opposite(&self) -> Self {
        match self {
            Color::White => Color::Black,
            Color::Black => Color::White,
        }
    }

    /// A function to get the index of the color
    pub fn index(&self) -> usize {
        match self {
            Color::White => 0,
            Color::Black => 1,
        }
    }
}

impl FromStr for Piece {
    type Err = String;

#[rustfmt::skip]
    fn from_str(p: &str) -> Result<Self, Self::Err> {
        match p {
           "wP" => Ok(Piece::WhitePawn), "wN" => Ok(Piece::WhiteKnight), "wB" => Ok(Piece::WhiteBishop),
           "wR" => Ok(Piece::WhiteRook), "wQ" => Ok(Piece::WhiteQueen), "wK" => Ok(Piece::WhiteKing),
           "bP" => Ok(Piece::BlackPawn), "bN" => Ok(Piece::BlackKnight), "bB" => Ok(Piece::BlackBishop),
           "bR" => Ok(Piece::BlackRook), "bQ" => Ok(Piece::BlackQueen), "bK" => Ok(Piece::BlackKing),
           _ => Err("Invalid piece".to_string()),
        }
    }
}
