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
  /** A non-negative amount of tokens. */
  Amount: { input: any; output: any; }
  /** The owner of a chain. This is currently the hash of the owner's public key used to verify signatures. */
  Owner: { input: any; output: any; }
  /** A signature public key */
  PublicKey: { input: any; output: any; }
  /** A duration in microseconds */
  TimeDelta: { input: any; output: any; }
  /** A timestamp, in microseconds since the Unix epoch */
  Timestamp: { input: any; output: any; }
};

export type ChessService = {
  __typename?: 'ChessService';
  capturedPieces: Array<Piece>;
  gameData: GameData;
  getLeaderboard: Array<PlayerStats>;
  timeLeft: PlayerTime;
  timer: Clock;
};


export type ChessServiceGameDataArgs = {
  player: Scalars['Owner']['input'];
};

/** A struct to represent a Clock */
export type Clock = {
  __typename?: 'Clock';
  blockDelay: Scalars['TimeDelta']['output'];
  currentTurnStart: Scalars['Timestamp']['output'];
  increment: Scalars['TimeDelta']['output'];
  timeLeft: Array<Scalars['TimeDelta']['output']>;
};

/** A struct to represent a color */
export enum Color {
  Black = 'BLACK',
  White = 'WHITE'
}

export type GameData = {
  __typename?: 'GameData';
  board: Scalars['String']['output'];
  gameState: GameState;
  moves: Array<Move>;
  opponent: Scalars['Owner']['output'];
  player: Color;
  playerTurn: Color;
};

export enum GameState {
  Checkmate = 'CHECKMATE',
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
  makeMove: Array<Scalars['Int']['output']>;
  newGame: Array<Scalars['Int']['output']>;
  pawnPromotion: Array<Scalars['Int']['output']>;
  resign: Array<Scalars['Int']['output']>;
  startGame: Array<Scalars['Int']['output']>;
};


export type OperationMutationRootCapturePieceArgs = {
  capturedPiece: Scalars['String']['input'];
  from: Scalars['String']['input'];
  piece: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type OperationMutationRootMakeMoveArgs = {
  from: Scalars['String']['input'];
  piece: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type OperationMutationRootNewGameArgs = {
  player: Scalars['Owner']['input'];
};


export type OperationMutationRootPawnPromotionArgs = {
  from: Scalars['String']['input'];
  piece: Scalars['String']['input'];
  promotedPiece: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type OperationMutationRootStartGameArgs = {
  amount: Scalars['Amount']['input'];
  matchTime: Scalars['TimeDelta']['input'];
  players: Array<Scalars['PublicKey']['input']>;
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

export type PlayerStats = {
  __typename?: 'PlayerStats';
  draws: Scalars['Int']['output'];
  gamesPlayed: Scalars['Int']['output'];
  losses: Scalars['Int']['output'];
  playerId: Scalars['String']['output'];
  winRate: Scalars['Float']['output'];
  wins: Scalars['Int']['output'];
};

export type PlayerTime = {
  __typename?: 'PlayerTime';
  black: Scalars['TimeDelta']['output'];
  white: Scalars['TimeDelta']['output'];
};
