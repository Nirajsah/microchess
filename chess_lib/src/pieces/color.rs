use std::str::FromStr;

use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq)]
#[repr(u8)]
pub enum Color {
    #[default]
    White = 0,
    Black = 1,
}

impl Color {
    pub fn opposite(self) -> Self {
        unsafe { std::mem::transmute::<u8, Color>((self as u8) ^ 1) }
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
