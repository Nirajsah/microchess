use serde::{Deserialize, Serialize};
use std::ops::{BitAnd, BitOr, BitOrAssign};

use super::square::Square;

#[derive(Copy, Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
pub struct BitBoard(pub u64);

impl BitBoard {
    pub const EMPTY: Self = BitBoard(0);

    #[inline]
    pub fn set(&mut self, sq: Square) {
        self.0 |= 1u64 << sq;
    }

    #[inline]
    pub fn clear(&mut self, sq: Square) {
        self.0 &= !(1u64 << sq);
    }

    #[inline]
    pub fn is_set(&self, sq: Square) -> bool {
        (self.0 >> sq) & 1 == 1
    }

    #[inline]
    pub fn popcount(&self) -> u32 {
        self.0.count_ones()
    }

    #[inline]
    pub fn trailing_zeros(&self) -> u32 {
        self.0.trailing_zeros()
    }

    #[inline]
    pub fn as_u64(&self) -> u64 {
        self.0
    }
}

impl BitOrAssign<u64> for BitBoard {
    fn bitor_assign(&mut self, rhs: u64) {
        self.0 |= rhs;
    }
}

impl BitOr<u64> for BitBoard {
    type Output = BitBoard;
    fn bitor(self, rhs: u64) -> Self::Output {
        BitBoard(self.0 | rhs)
    }
}

impl BitOr<BitBoard> for BitBoard {
    type Output = BitBoard;
    fn bitor(self, rhs: BitBoard) -> Self::Output {
        BitBoard(self.0 | rhs.0)
    }
}

impl BitAnd<u64> for BitBoard {
    type Output = BitBoard;
    fn bitand(self, rhs: u64) -> Self::Output {
        BitBoard(self.0 & rhs)
    }
}

impl PartialEq<u64> for BitBoard {
    fn eq(&self, other: &u64) -> bool {
        self.0 == *other
    }
}

impl From<BitBoard> for u64 {
    fn from(bb: BitBoard) -> u64 {
        bb.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_board() {
        let bb = BitBoard::EMPTY;
        assert_eq!(BitBoard(0), bb);
        assert_eq!(bb.as_u64(), 0);
        assert!(bb.popcount() == 0);
        assert_eq!(bb, 0); // PartialEq<u64>
    }

    #[test]
    fn test_set_and_is_set() {
        let mut bb = BitBoard::EMPTY;
        let square_1 = Square::A1;
        let square_2 = Square::H1;
        bb.set(square_1); // set A1
        assert!(bb.is_set(square_1));
        assert_eq!(bb.as_u64(), 1);

        bb.set(square_2); // set H1
        assert!(bb.is_set(square_2));
        assert_eq!(bb.popcount(), 2);
    }

    #[test]
    fn test_clear() {
        let mut bb = BitBoard::EMPTY;

        let square_1 = Square::A1;
        let square_2 = Square::H1;

        bb.set(square_1);
        bb.set(square_2);
        assert!(bb.is_set(square_1));
        assert!(bb.is_set(square_2));

        bb.clear(square_1);
        assert!(!bb.is_set(square_1));
        assert!(bb.is_set(square_2));
    }

    #[test]
    fn test_popcount_and_trailing_zeros() {
        let mut bb = BitBoard::EMPTY;

        let square_1 = Square::A1;
        let square_2 = Square::H1;
        let square_3 = Square::F2;

        bb.set(square_1);
        bb.set(square_2);
        bb.set(square_3);

        assert_eq!(bb.popcount(), 3);
        assert_eq!(bb.trailing_zeros(), 0);

        let bb2 = BitBoard(1 << 12);
        assert_eq!(bb2.trailing_zeros(), 12);
    }

    #[test]
    fn test_bitor_assign_with_u64() {
        let mut bb = BitBoard::EMPTY;
        let square_1 = Square::A3;
        bb |= 1u64 << square_1 as u64;
        assert!(bb.is_set(square_1));
    }

    #[test]
    fn test_bitor_with_u64() {
        let square_1 = Square::E3;
        let bb = BitBoard::EMPTY | (1u64 << square_1 as u64);
        assert!(bb.is_set(square_1));
    }

    #[test]
    fn test_bitor_with_bitboard() {
        let square_1 = Square::A7;
        let square_2 = Square::B5;
        let bb1 = BitBoard(1 << square_1 as u64);
        let bb2 = BitBoard(1 << square_2 as u64);
        let bb3 = bb1 | bb2;
        assert!(bb3.is_set(square_1));
        assert!(bb3.is_set(square_2));
    }

    #[test]
    fn test_bitand_with_u64() {
        let bb = BitBoard(0b1010);
        let result = bb & 0b1000;
        assert_eq!(result, BitBoard(0b1000));
    }

    #[test]
    fn test_partialeq_with_u64() {
        let bb = BitBoard(42);
        assert_eq!(bb, 42u64);
        assert!(bb != 43u64);
    }

    #[test]
    fn test_from_bitboard_for_u64() {
        let bb = BitBoard(99);
        let raw: u64 = bb.into();
        assert_eq!(raw, 99u64);
    }
}
