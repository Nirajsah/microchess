use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[repr(u8)]
pub enum Color {
    White,
    Black,
}

impl Color {
    pub fn opposite(self) -> Self {
        match self {
            Self::White => Self::Black,
            Self::Black => Self::White,
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
