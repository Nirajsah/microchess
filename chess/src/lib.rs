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
pub enum Operation {
    NewGame,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct Board {
    pub board: Vec<String>,
}
