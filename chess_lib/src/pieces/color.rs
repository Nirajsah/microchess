use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
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
}

impl From<Color> for char {
    fn from(color: Color) -> Self {
        match color {
            Color::White => 'w',
            Color::Black => 'b',
        }
    }
}
