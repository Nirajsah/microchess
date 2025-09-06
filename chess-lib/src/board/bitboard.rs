use serde::{Deserialize, Serialize};
use std::ops::{BitAnd, BitOr, BitOrAssign};

#[derive(Copy, Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
pub struct BitBoard(pub u64);

impl BitBoard {
    pub const EMPTY: Self = BitBoard(0);

    #[inline]
    pub fn set(&mut self, sq: u8) {
        self.0 |= 1u64 << sq;
    }

    #[inline]
    pub fn clear(&mut self, sq: u8) {
        self.0 &= !(1u64 << sq);
    }

    #[inline]
    pub fn is_set(&self, sq: u8) -> bool {
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
        BitBoard(self.0 | rhs)
    }
}

impl PartialEq<u64> for BitBoard {
    fn eq(&self, other: &u64) -> bool {
        self.0 == *other
    }
}
