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
  /** The unique identifier (UID) of a chain. This is currently computed as the hash value of a ChainDescription. */
  ChainId: { input: any; output: any; }
  /** Hash of a Data Blob */
  DataBlobHash: { input: any; output: any; }
  /** A duration in microseconds */
  TimeDelta: { input: any; output: any; }
  /** A timestamp, in microseconds since the Unix epoch */
  Timestamp: { input: any; output: any; }
};

export type ChessService = {
  __typename?: 'ChessService';
  capturedPieces: Array<Scalars['String']['output']>;
  count: Scalars['Int']['output'];
  friendId?: Maybe<Scalars['String']['output']>;
  gameChain?: Maybe<Scalars['ChainId']['output']>;
  gameData: GameData;
  isGameChain: Scalars['Boolean']['output'];
  leaderboard: Array<Leaderboard>;
  /** called by the user/player_chain */
  matchHistoryAll: Array<MatchHistory>;
  /** called by the subscriber chain to update the db */
  matchHistoryLast?: Maybe<MatchHistory>;
  mvString: Array<Scalars['String']['output']>;
  myTournament?: Maybe<Tournament>;
  myTournaments: Array<Tournament>;
  notifications: Array<Notification>;
  opponentProfile?: Maybe<PlayerInfo>;
  participants?: Maybe<Scalars['String']['output']>;
  profile?: Maybe<PlayerProfile>;
  /** Read moves from datablob */
  readMoves: Array<Scalars['String']['output']>;
  timer: PlayersTime;
  tournament?: Maybe<Tournament>;
  tournamentChains: Array<Scalars['ChainId']['output']>;
  tournamentMatches?: Maybe<Array<Match>>;
};


export type ChessServiceGameDataArgs = {
  player: Scalars['AccountOwner']['input'];
};


export type ChessServiceMyTournamentArgs = {
  tournamentId: Scalars['String']['input'];
};


export type ChessServiceOpponentProfileArgs = {
  opponent: Scalars['AccountOwner']['input'];
};


export type ChessServiceReadMovesArgs = {
  hash: Scalars['DataBlobHash']['input'];
};


export type ChessServiceTournamentMatchesArgs = {
  id: Scalars['String']['input'];
};

export type GameData = {
  __typename?: 'GameData';
  color: Scalars['String']['output'];
  fen: Scalars['String']['output'];
  gameState: Scalars['String']['output'];
  lastMove?: Maybe<LastMove>;
  opponent: Scalars['AccountOwner']['output'];
  winner?: Maybe<Scalars['AccountOwner']['output']>;
};

/** Optional game mode (for variants) */
export enum GameMode {
  Crazyhouse = 'CRAZYHOUSE',
  Microchess = 'MICROCHESS',
  Standard = 'STANDARD'
}

export type LastMove = {
  __typename?: 'LastMove';
  from: Scalars['String']['output'];
  to: Scalars['String']['output'];
};

export type Leaderboard = {
  __typename?: 'Leaderboard';
  elo: Scalars['Int']['output'];
  id: Scalars['AccountOwner']['output'];
  lost: Scalars['Int']['output'];
  matches: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  won: Scalars['Int']['output'];
};

export type Match = {
  __typename?: 'Match';
  matchId: Scalars['Int']['output'];
  playerA: Scalars['AccountOwner']['output'];
  playerB: Scalars['AccountOwner']['output'];
  result?: Maybe<Scalars['AccountOwner']['output']>;
  round: Scalars['Int']['output'];
  tournamentId: Scalars['String']['output'];
};

export type MatchHistory = {
  __typename?: 'MatchHistory';
  blobHash: Scalars['DataBlobHash']['output'];
  opponent: Player;
  you: Player;
};

/** Match type / series */
export enum MatchType {
  Bo_1 = 'BO_1',
  Bo_3 = 'BO_3',
  Bo_5 = 'BO_5'
}

export type Notification = {
  __typename?: 'Notification';
  createdAt: Scalars['Timestamp']['output'];
  data: Scalars['String']['output'];
  notificationType: NotificationType;
  read: Scalars['Boolean']['output'];
  sender: Scalars['ChainId']['output'];
  title: Scalars['String']['output'];
};

export enum NotificationType {
  MatchCreated = 'MATCH_CREATED',
  MatchResult = 'MATCH_RESULT',
  PlayerRegistered = 'PLAYER_REGISTERED',
  RoundExpired = 'ROUND_EXPIRED',
  RoundStarted = 'ROUND_STARTED',
  TournamentCreated = 'TOURNAMENT_CREATED',
  TournamentFinished = 'TOURNAMENT_FINISHED',
  TournamentPublished = 'TOURNAMENT_PUBLISHED'
}

export type OperationMutationRoot = {
  __typename?: 'OperationMutationRoot';
  deleteChainMetadata: Array<Scalars['Int']['output']>;
  frGameHash: Array<Scalars['Int']['output']>;
  hostTournament: Array<Scalars['Int']['output']>;
  makeMove: Array<Scalars['Int']['output']>;
  newGame: Array<Scalars['Int']['output']>;
  pawnPromotion: Array<Scalars['Int']['output']>;
  profile: Array<Scalars['Int']['output']>;
  resign: Array<Scalars['Int']['output']>;
  subscribe: Array<Scalars['Int']['output']>;
  tournamentRegistration: Array<Scalars['Int']['output']>;
  tournamentWithDraw: Array<Scalars['Int']['output']>;
  updateTournament: Array<Scalars['Int']['output']>;
  updateTournamentLocal: Array<Scalars['Int']['output']>;
};


export type OperationMutationRootFrGameHashArgs = {
  token: Scalars['String']['input'];
};


export type OperationMutationRootHostTournamentArgs = {
  value: TournamentInput;
};


export type OperationMutationRootMakeMoveArgs = {
  from: Scalars['String']['input'];
  piece: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type OperationMutationRootPawnPromotionArgs = {
  from: Scalars['String']['input'];
  piece: Scalars['String']['input'];
  promotedPiece: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type OperationMutationRootProfileArgs = {
  name: Scalars['String']['input'];
};


export type OperationMutationRootTournamentRegistrationArgs = {
  organiserChain: Scalars['ChainId']['input'];
  tournamentId: Scalars['String']['input'];
};


export type OperationMutationRootTournamentWithDrawArgs = {
  tournamentId: Scalars['String']['input'];
};


export type OperationMutationRootUpdateTournamentArgs = {
  tournamentId: Scalars['String']['input'];
  update: TournamentUpdate;
};


export type OperationMutationRootUpdateTournamentLocalArgs = {
  tournamentId: Scalars['String']['input'];
  update: TournamentUpdate;
};

export type Player = {
  __typename?: 'Player';
  id: Scalars['AccountOwner']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type PlayerHash = {
  __typename?: 'PlayerHash';
  value: Scalars['String']['output'];
};

/** This struct is mainly used to display user profile to opponent player */
export type PlayerInfo = {
  __typename?: 'PlayerInfo';
  ath: Scalars['Int']['output'];
  elo: Scalars['Int']['output'];
  matches: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type PlayerProfile = {
  __typename?: 'PlayerProfile';
  ath: Scalars['Int']['output'];
  chainId: Scalars['ChainId']['output'];
  elo: Scalars['Int']['output'];
  id: Scalars['AccountOwner']['output'];
  lost: Scalars['Int']['output'];
  matches: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  playerHash?: Maybe<PlayerHash>;
  won: Scalars['Int']['output'];
};

export type PlayersTime = {
  __typename?: 'PlayersTime';
  black: Scalars['TimeDelta']['output'];
  white: Scalars['TimeDelta']['output'];
};

/** Prize types supported */
export enum PrizeType {
  Nft = 'NFT',
  Tokens = 'TOKENS'
}

/** Simple time control representation (e.g., 3+2) */
export type TimeControl = {
  __typename?: 'TimeControl';
  baseMinutes: Scalars['Int']['output'];
  incrementSeconds: Scalars['Int']['output'];
  modeLabel?: Maybe<Scalars['String']['output']>;
};

/** Simple time control representation (e.g., 3+2) */
export type TimeControlInput = {
  baseMinutes: Scalars['Int']['input'];
  incrementSeconds: Scalars['Int']['input'];
  modeLabel?: InputMaybe<Scalars['String']['input']>;
};

/** The main Tournament object used for output (Queries). */
export type Tournament = {
  __typename?: 'Tournament';
  bannerImageUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  customTags: Array<Scalars['String']['output']>;
  endTime: Scalars['Timestamp']['output'];
  gameMode: GameMode;
  matchType: MatchType;
  maxPlayers: Scalars['Int']['output'];
  minPlayers: Scalars['Int']['output'];
  organiserChain: Scalars['ChainId']['output'];
  organiserId: Scalars['AccountOwner']['output'];
  organiserName: Scalars['String']['output'];
  prizePool: Scalars['Int']['output'];
  prizePoolDescription?: Maybe<Scalars['String']['output']>;
  prizeType: PrizeType;
  roundCount?: Maybe<Scalars['Int']['output']>;
  sponsorLogoUrl?: Maybe<Scalars['String']['output']>;
  startingTime: Scalars['Timestamp']['output'];
  status: TournamentStatus;
  timeControl: TimeControl;
  tournamentDescription?: Maybe<Scalars['String']['output']>;
  tournamentFormat: TournamentFormat;
  tournamentId: Scalars['String']['output'];
  tournamentName: Scalars['String']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  version: Scalars['String']['output'];
  visibility: Visibility;
};

/** Supported tournament formats */
export enum TournamentFormat {
  Arena = 'ARENA',
  DoubleElim = 'DOUBLE_ELIM',
  RoundRobin = 'ROUND_ROBIN',
  SingleElim = 'SINGLE_ELIM',
  Swiss = 'SWISS'
}

/** Input object for creating a new Tournament (Mutations). */
export type TournamentInput = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['Timestamp']['input']>;
  customTags: Array<Scalars['String']['input']>;
  endTime: Scalars['Int']['input'];
  gameMode: GameMode;
  matchType: MatchType;
  maxPlayers: Scalars['Int']['input'];
  minPlayers: Scalars['Int']['input'];
  organiserChain?: InputMaybe<Scalars['ChainId']['input']>;
  organiserId?: InputMaybe<Scalars['AccountOwner']['input']>;
  organiserName: Scalars['String']['input'];
  prizePool: Scalars['Int']['input'];
  prizePoolDescription?: InputMaybe<Scalars['String']['input']>;
  prizeType: PrizeType;
  roundCount?: InputMaybe<Scalars['Int']['input']>;
  sponsorLogoUrl?: InputMaybe<Scalars['String']['input']>;
  startingTime: Scalars['Int']['input'];
  status: TournamentStatus;
  timeControl: TimeControlInput;
  tournamentDescription?: InputMaybe<Scalars['String']['input']>;
  tournamentFormat: TournamentFormat;
  tournamentId?: InputMaybe<Scalars['String']['input']>;
  tournamentName: Scalars['String']['input'];
  updatedAt?: InputMaybe<Scalars['Timestamp']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  visibility: Visibility;
};

/** Tournament status lifecycle */
export enum TournamentStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Draft = 'DRAFT',
  InProgress = 'IN_PROGRESS',
  RegistrationClosed = 'REGISTRATION_CLOSED',
  RegistrationOpen = 'REGISTRATION_OPEN'
}

/** Input object for updating a Tournament. */
export type TournamentUpdate = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  customTags?: InputMaybe<Array<Scalars['String']['input']>>;
  prizePool?: InputMaybe<Scalars['Int']['input']>;
  prizeType?: InputMaybe<PrizeType>;
  sponsorLogoUrl?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TournamentStatus>;
  tournamentDescription?: InputMaybe<Scalars['String']['input']>;
  tournamentName?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<Visibility>;
};

/** Tournament visibility */
export enum Visibility {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}
