#![allow(non_snake_case)]
use async_graphql::{Request, Response, SimpleObject};
use linera_sdk::base::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};
pub struct ChessAbi;
use linera_sdk::graphql::GraphQLMutationRoot;

impl ContractAbi for ChessAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for ChessAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, Clone, GraphQLMutationRoot)]
#[serde(rename_all = "camelCase")]
pub enum Operation {
    NewGame,
    MakeMove { from: String, to: String },
}

pub type Bitboard = u64;

#[derive(Clone, Default, Debug, Deserialize, Serialize, SimpleObject)]
pub struct ChessBoard {
    pub wP: Bitboard,
    pub wN: Bitboard,
    pub wB: Bitboard,
    pub wR: Bitboard,
    pub wQ: Bitboard,
    pub wK: Bitboard,
    pub bP: Bitboard,
    pub bN: Bitboard,
    pub bB: Bitboard,
    pub bR: Bitboard,
    pub bQ: Bitboard,
    pub bK: Bitboard,
}

#[derive(Clone, Default, Deserialize, Serialize, SimpleObject)]
pub struct Game {
    pub board: ChessBoard,
}

impl ChessBoard {
    pub fn new() -> Self {
        ChessBoard {
            wP: 0x000000000000FF00,
            wN: 0x0000000000000042,
            wB: 0x0000000000000024,
            wR: 0x0000000000000081,
            wQ: 0x0000000000000008,
            wK: 0x0000000000000010,
            bP: 0x00FF000000000000,
            bN: 0x4200000000000000,
            bB: 0x2400000000000000,
            bR: 0x8100000000000000,
            bQ: 0x0800000000000000,
            bK: 0x1000000000000000,
        }
    }

    pub fn move_piece(&mut self, from_square: u64, to_square: u64, bitboard: &mut Bitboard) {
        let from_bit = 1u64 << from_square as u32;
        let to_bit = 1u64 << to_square as u32;

        // Clear the bit at the original position
        *bitboard &= !from_bit;

        // Set the bit at the new position
        *bitboard |= to_bit;
    }
}
