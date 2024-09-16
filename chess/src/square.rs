use async_graphql::Enum;
use serde::{Deserialize, Serialize};
use std::hash::Hash;
use std::str::FromStr;

#[rustfmt::skip]
#[derive(Clone, Copy, Debug, Deserialize, Serialize, Enum, Eq, PartialEq, Hash)]
pub enum Square {
    A1, B1, C1, D1, E1, F1, G1, H1,
    A2, B2, C2, D2, E2, F2, G2, H2,
    A3, B3, C3, D3, E3, F3, G3, H3,
    A4, B4, C4, D4, E4, F4, G4, H4,
    A5, B5, C5, D5, E5, F5, G5, H5,
    A6, B6, C6, D6, E6, F6, G6, H6,
    A7, B7, C7, D7, E7, F7, G7, H7,
    A8, B8, C8, D8, E8, F8, G8, H8,
}

impl FromStr for Square {
    type Err = String;

#[rustfmt::skip]
    /// Converts a string to a square.
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "a1" => Ok(Square::A1), "b1" => Ok(Square::B1), "c1" => Ok(Square::C1), "d1" => Ok(Square::D1),
            "e1" => Ok(Square::E1), "f1" => Ok(Square::F1), "g1" => Ok(Square::G1), "h1" => Ok(Square::H1),

            "a2" => Ok(Square::A2), "b2" => Ok(Square::B2), "c2" => Ok(Square::C2), "d2" => Ok(Square::D2),
            "e2" => Ok(Square::E2), "f2" => Ok(Square::F2), "g2" => Ok(Square::G2), "h2" => Ok(Square::H2),

            "a3" => Ok(Square::A3), "b3" => Ok(Square::B3), "c3" => Ok(Square::C3), "d3" => Ok(Square::D3),
            "e3" => Ok(Square::E3), "f3" => Ok(Square::F3), "g3" => Ok(Square::G3), "h3" => Ok(Square::H3),

            "a4" => Ok(Square::A4), "b4" => Ok(Square::B4), "c4" => Ok(Square::C4), "d4" => Ok(Square::D4),
            "e4" => Ok(Square::E4), "f4" => Ok(Square::F4), "g4" => Ok(Square::G4), "h4" => Ok(Square::H4),

            "a5" => Ok(Square::A5), "b5" => Ok(Square::B5), "c5" => Ok(Square::C5), "d5" => Ok(Square::D5),
            "e5" => Ok(Square::E5), "f5" => Ok(Square::F5), "g5" => Ok(Square::G5), "h5" => Ok(Square::H5),

            "a6" => Ok(Square::A6), "b6" => Ok(Square::B6), "c6" => Ok(Square::C6), "d6" => Ok(Square::D6),
            "e6" => Ok(Square::E6), "f6" => Ok(Square::F6), "g6" => Ok(Square::G6), "h6" => Ok(Square::H6),

            "a7" => Ok(Square::A7), "b7" => Ok(Square::B7), "c7" => Ok(Square::C7), "d7" => Ok(Square::D7),
            "e7" => Ok(Square::E7), "f7" => Ok(Square::F7), "g7" => Ok(Square::G7), "h7" => Ok(Square::H7),

            "a8" => Ok(Square::A8), "b8" => Ok(Square::B8), "c8" => Ok(Square::C8), "d8" => Ok(Square::D8),
            "e8" => Ok(Square::E8), "f8" => Ok(Square::F8), "g8" => Ok(Square::G8), "h8" => Ok(Square::H8),
            _ => Err("Invalid square".to_string()),
        }
    }
}

use Square::*;
#[rustfmt::skip]
const MIRROR: [Square; 64] =
[
    A8, B8, C8, D8, E8, F8, G8, H8,
    A7, B7, C7, D7, E7, F7, G7, H7,
    A6, B6, C6, D6, E6, F6, G6, H6,
    A5, B5, C5, D5, E5, F5, G5, H5,
    A4, B4, C4, D4, E4, F4, G4, H4,
    A3, B3, C3, D3, E3, F3, G3, H3,
    A2, B2, C2, D2, E2, F2, G2, H2,
    A1, B1, C1, D1, E1, F1, G1, H1,
];

impl Square {
    pub const fn mirror(&self) -> Self {
        MIRROR[*self as usize]
    }

    pub const fn rank(&self) -> u8 {
        ((*self as usize / 8) as u8) + 1
    }

    #[rustfmt::skip]
    pub const fn usize_to_square(i: usize) -> Self {
        match i {
            0 => A1, 1 => B1, 2 => C1, 3 => D1, 4 => E1, 5 => F1, 6 => G1, 7 => H1,
            8 => A2, 9 => B2, 10 => C2, 11 => D2, 12 => E2, 13 => F2, 14 => G2, 15 => H2,
            16 => A3, 17 => B3, 18 => C3, 19 => D3, 20 => E3, 21 => F3, 22 => G3, 23 => H3,
            24 => A4, 25 => B4, 26 => C4, 27 => D4, 28 => E4, 29 => F4, 30 => G4, 31 => H4,
            32 => A5, 33 => B5, 34 => C5, 35 => D5, 36 => E5, 37 => F5, 38 => G5, 39 => H5,
            40 => A6, 41 => B6, 42 => C6, 43 => D6, 44 => E6, 45 => F6, 46 => G6, 47 => H6,
            48 => A7, 49 => B7, 50 => C7, 51 => D7, 52 => E7, 53 => F7, 54 => G7, 55 => H7,
            56 => A8, 57 => B8, 58 => C8, 59 => D8, 60 => E8, 61 => F8, 62 => G8, 63 => H8,
            _ => unreachable!(),
        }
    }
}
