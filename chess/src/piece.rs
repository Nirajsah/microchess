use std::str::FromStr;

use async_graphql::Enum;
use serde::{Deserialize, Serialize};

#[derive(Ord, PartialOrd, Eq, PartialEq, Debug, Clone, Copy, Serialize, Deserialize, Enum)]
pub enum Color {
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
