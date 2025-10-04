use async_graphql::Enum;
use serde::{Deserialize, Serialize};
use std::hash::Hash;
use std::ops::{Add, BitAnd, Shl, Shr, Sub};
use std::str::FromStr;

#[rustfmt::skip]
#[repr(u8)]
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

impl From<Square> for u8 {
    fn from(value: Square) -> Self {
        value as u8
    }
}

impl PartialEq<u8> for Square {
    fn eq(&self, rhs: &u8) -> bool {
        self == rhs
    }
}

impl PartialOrd<u8> for Square {
    fn partial_cmp(&self, other: &u8) -> Option<std::cmp::Ordering> {
        (*self as u8).partial_cmp(other)
    }
}

impl Add<u8> for Square {
    type Output = Self;

    fn add(self, rhs: u8) -> Self::Output {
        let val = self as u8 + rhs;
        // SAFETY: `Square` is #[repr(u8)] and contiguous from 0..63
        unsafe { std::mem::transmute::<u8, Square>(val) }
    }
}

impl Sub<u8> for Square {
    type Output = Self;

    fn sub(self, rhs: u8) -> Self::Output {
        let val = self as u8 - rhs;
        // SAFETY: `Square` is #[repr(u8)] and contiguous from 0..63
        unsafe { std::mem::transmute::<u8, Square>(val) }
    }
}
impl BitAnd<u8> for Square {
    type Output = Self;

    fn bitand(self, rhs: u8) -> Self::Output {
        Square::uint_to_square((self as u8) & rhs)
    }
}

impl Shl<Square> for u64 {
    type Output = Self;

    #[inline(always)]
    fn shl(self, sq: Square) -> Self::Output {
        self << (sq as u32)
    }
}

impl Shr<Square> for u64 {
    type Output = Self;

    #[inline(always)]
    fn shr(self, sq: Square) -> Self::Output {
        self >> (sq as u32)
    }
}

impl FromStr for Square {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s.len() != 2 {
            return Err("Invalid square length".to_string());
        }
        let file = s.chars().next().unwrap();
        let rank = s.chars().nth(1).unwrap();

        if !('a'..='h').contains(&file) || !('1'..='8').contains(&rank) {
            return Err("Invalid square".to_string());
        }

        let file_idx = (file as u8 - b'a') as u8;
        let rank_idx = (rank as u8 - b'1') as u8;

        let index = rank_idx * 8 + file_idx;
        Ok(Square::uint_to_square(index))
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

    pub const fn index(&self) -> usize {
        *self as usize
    }

    pub const fn rank(&self) -> u8 {
        ((*self as usize / 8) as u8) + 1
    }

    pub const fn file(&self) -> u8 {
        ((*self as usize % 8) as u8) + 1
    }

    pub const fn uint_to_square(i: u8) -> Self {
        debug_assert!(i < 64, "Square value must be 0-63");
        // SAFETY: `Square` is #[repr(u8)] and contiguous from 0..63
        unsafe { std::mem::transmute(i) }
    }

    pub fn usize_to_string(i: usize) -> String {
        assert!(i < 64, "square index out of bounds: {}", i);

        let file = (b'a' + (i % 8) as u8) as char;
        let rank = (1 + (i / 8)) as u8;

        format!("{}{}", file, rank)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_shl_and_shr_with_square() {
        let x: u64 = 1;
        let sq = Square::E4; // index 28
        assert_eq!(x << sq, 1u64 << 28);
        assert_eq!(1u64 << 28 >> sq, x);
    }

    #[test]
    fn test_from_str_valid() {
        let sq = Square::from_str("a1").unwrap();
        assert_eq!(sq, Square::A1);

        let sq = Square::from_str("h8").unwrap();
        assert_eq!(sq, Square::H8);

        let sq = Square::from_str("e4").unwrap();
        assert_eq!(sq, Square::E4);
    }

    #[test]
    fn test_from_str_invalid() {
        assert!(Square::from_str("i1").is_err());
        assert!(Square::from_str("a9").is_err());
        assert!(Square::from_str("a").is_err());
        assert!(Square::from_str("").is_err());
    }

    #[test]
    fn test_mirror() {
        assert_eq!(Square::A1.mirror(), Square::A8);
        assert_eq!(Square::H1.mirror(), Square::H8);
        assert_eq!(Square::E4.mirror(), Square::E5);
        assert_eq!(Square::D5.mirror(), Square::D4);
    }

    #[test]
    fn test_rank() {
        assert_eq!(Square::A1.rank(), 1);
        assert_eq!(Square::H1.rank(), 1);
        assert_eq!(Square::A8.rank(), 8);
        assert_eq!(Square::E4.rank(), 4);
        assert_eq!(Square::D5.rank(), 5);
    }

    #[test]
    fn test_uint_to_square() {
        for i in 0..64 {
            let sq = Square::uint_to_square(i);
            assert_eq!(sq as u8, i);
        }
    }

    #[test]
    fn test_usize_to_string() {
        assert_eq!(Square::usize_to_string(0), "a1");
        assert_eq!(Square::usize_to_string(7), "h1");
        assert_eq!(Square::usize_to_string(8), "a2");
        assert_eq!(Square::usize_to_string(63), "h8");
        assert_eq!(Square::usize_to_string(27), "d4");
    }

    #[test]
    fn test_shl_and_shr_consistency() {
        for i in 0..64 {
            let sq = Square::uint_to_square(i);
            let x: u64 = 1;
            assert_eq!(x << sq >> sq, x);
        }
    }
}
