use std::{fmt::Display, str::FromStr};

use serde::{Deserialize, Serialize};

use crate::board::piece::Piece;

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq)]
#[repr(u8)]
pub enum Color {
    #[default]
    White = 0,
    Black = 1,
}

impl Display for Color {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let c = match self {
            Color::White => "White",
            Color::Black => "Black",
        };
        write!(f, "{}", c)
    }
}

impl Color {
    pub fn opposite(self) -> Self {
        unsafe { std::mem::transmute::<u8, Color>((self as u8) ^ 1) }
    }

    pub fn pawn(self) -> Piece {
        match self {
            Color::White => Piece::WhitePawn,
            Color::Black => Piece::BlackPawn,
        }
    }

    pub fn index(self) -> usize {
        self as usize
    }
}

impl From<Color> for char {
    fn from(color: Color) -> Self {
        match color {
            Color::White => 'w',
            Color::Black => 'b',
        }
    }
}

impl FromStr for Color {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "w" | "W" => Ok(Color::White),
            "b" | "B" => Ok(Color::Black),
            _ => Err(format!("Invalid color: {}", s)),
        }
    }
}
