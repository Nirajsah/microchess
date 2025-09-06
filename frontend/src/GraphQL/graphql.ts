/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A unique identifier for a user or an application. */
  AccountOwner: { input: any; output: any; }
  /** A non-negative amount of tokens. */
  Amount: { input: any; output: any; }
  /** The unique identifier (UID) of a chain. This is currently computed as the hash value of a ChainDescription. */
  ChainId: { input: any; output: any; }
  Rank: { input: any; output: any; }
  /** A duration in microseconds */
  TimeDelta: { input: any; output: any; }
  /** A timestamp, in microseconds since the Unix epoch */
  Timestamp: { input: any; output: any; }
};

export type ChessService = {
  __typename?: 'ChessService';
  capturedPieces: Array<Piece>;
  gameData: GameData;
  getGameChain: Array<GameChain>;
  owners: Array<Scalars['AccountOwner']['output']>;
  timeLeft: PlayerTime;
  timer: Clock;
};


export type ChessServiceGameDataArgs = {
  player: Scalars['AccountOwner']['input'];
};


export type ChessServiceGetGameChainArgs = {
  pubKey: Scalars['AccountOwner']['input'];
};

/** A struct to represent a Clock */
export type Clock = {
  __typename?: 'Clock';
  blockDelay: Scalars['TimeDelta']['output'];
  currentTurnStart: Scalars['Timestamp']['output'];
  timeLeft: Array<Scalars['TimeDelta']['output']>;
};

/** A struct to represent a color */
export enum Color {
  Black = 'BLACK',
  White = 'WHITE'
}

export type FriendIdInput = {
  id: Scalars['String']['input'];
};

/** The IDs of a temporary chain for a single game. */
export type GameChain = {
  __typename?: 'GameChain';
  /**
   * The ID of the `OpenChain` message that created the chain.
   * The ID of the temporary game chain itself.
   */
  chainId: Scalars['ChainId']['output'];
};

export type GameData = {
  __typename?: 'GameData';
  board: Scalars['String']['output'];
  gameState: GameState;
  moves: Array<Move>;
  opponent: Scalars['AccountOwner']['output'];
  player: Color;
  playerTurn: Color;
};

export enum GameState {
  Checkmate = 'CHECKMATE',
  Draw = 'DRAW',
  InPlay = 'IN_PLAY',
  Resign = 'RESIGN',
  Stalemate = 'STALEMATE'
}

export type Move = {
  __typename?: 'Move';
  black?: Maybe<Scalars['String']['output']>;
  white?: Maybe<Scalars['String']['output']>;
};

export type OperationMutationRoot = {
  __typename?: 'OperationMutationRoot';
  capturePiece: Array<Scalars['Int']['output']>;
  friendlyGame: Array<Scalars['Int']['output']>;
  makeMove: Array<Scalars['Int']['output']>;
  newGame: Array<Scalars['Int']['output']>;
  pawnPromotion: Array<Scalars['Int']['output']>;
  requestGame: Array<Scalars['Int']['output']>;
  resign: Array<Scalars['Int']['output']>;
  startFriendlyGame: Array<Scalars['Int']['output']>;
  startGame: Array<Scalars['Int']['output']>;
};


export type OperationMutationRootCapturePieceArgs = {
  capturedPiece: Scalars['String']['input'];
  from: Scalars['String']['input'];
  piece: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type OperationMutationRootFriendlyGameArgs = {
  player: Scalars['AccountOwner']['input'];
  timer: Scalars['TimeDelta']['input'];
};


export type OperationMutationRootMakeMoveArgs = {
  from: Scalars['String']['input'];
  piece: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type OperationMutationRootNewGameArgs = {
  player: Scalars['AccountOwner']['input'];
};


export type OperationMutationRootPawnPromotionArgs = {
  from: Scalars['String']['input'];
  piece: Scalars['String']['input'];
  promotedPiece: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type OperationMutationRootRequestGameArgs = {
  player: Scalars['AccountOwner']['input'];
  rank: Scalars['Rank']['input'];
  timer: Scalars['TimeDelta']['input'];
};


export type OperationMutationRootStartFriendlyGameArgs = {
  hash: FriendIdInput;
  player: Scalars['AccountOwner']['input'];
};


export type OperationMutationRootStartGameArgs = {
  amount: Scalars['Amount']['input'];
  matchTime: Scalars['TimeDelta']['input'];
  players: Array<Scalars['AccountOwner']['input']>;
};

export enum Piece {
  BlackBishop = 'BLACK_BISHOP',
  BlackKing = 'BLACK_KING',
  BlackKnight = 'BLACK_KNIGHT',
  BlackPawn = 'BLACK_PAWN',
  BlackQueen = 'BLACK_QUEEN',
  BlackRook = 'BLACK_ROOK',
  WhiteBishop = 'WHITE_BISHOP',
  WhiteKing = 'WHITE_KING',
  WhiteKnight = 'WHITE_KNIGHT',
  WhitePawn = 'WHITE_PAWN',
  WhiteQueen = 'WHITE_QUEEN',
  WhiteRook = 'WHITE_ROOK'
}

export type PlayerTime = {
  __typename?: 'PlayerTime';
  black: Scalars['TimeDelta']['output'];
  white: Scalars['TimeDelta']['output'];
};
