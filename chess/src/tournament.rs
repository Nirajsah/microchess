use async_graphql::{Enum, InputObject, SimpleObject};
use linera_sdk::linera_base_types::{AccountOwner, ChainId, Timestamp};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// The main Tournament object used for output (Queries).
#[derive(Debug, Serialize, Deserialize, Clone, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Tournament {
    // --- Identity ---
    pub organiser_chain: ChainId,
    pub organiser_id: AccountOwner,
    pub organiser_name: String,
    pub tournament_id: String,
    pub tournament_name: String,
    pub tournament_description: Option<String>,

    // --- Format & Rules ---
    pub tournament_format: TournamentFormat,
    pub match_type: MatchType,
    pub game_mode: GameMode,
    pub time_control: TimeControl,
    pub max_players: Option<u32>,
    pub min_players: Option<u32>,
    pub round_count: Option<u16>,
    pub allow_late_join: bool,

    // --- Schedule ---
    pub starting_time: Timestamp,
    pub end_time: Timestamp,
    pub round_time_limit_minutes: Timestamp,
    pub check_in_time: Timestamp,

    // --- Rewards ---
    pub prize_type: Vec<PrizeType>,
    pub prize_pool_description: Option<String>,

    // --- Access & Privacy ---
    pub visibility: Visibility,
    pub invite_only: bool,
    pub access_code: Option<String>,

    // --- Branding ---
    pub banner_image_url: Option<String>,
    pub sponsor_logo_url: Option<String>,
    pub custom_tags: Vec<String>,

    // --- System Metadata ---
    pub version: String,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub status: TournamentStatus,
}

/// Input object for creating a new Tournament (Mutations).
#[derive(Debug, Serialize, Deserialize, Clone, InputObject)]
pub struct TournamentInput {
    // --- Identity ---
    pub organiser_chain: ChainId,
    pub organiser_id: AccountOwner,
    pub organiser_name: String,
    pub tournament_id: Option<String>, // Generated system-side if not provided
    pub tournament_name: String,
    pub tournament_description: Option<String>,

    // --- Format & Rules ---
    pub tournament_format: TournamentFormat,
    pub match_type: MatchType,
    pub game_mode: GameMode,
    pub time_control: TimeControlInput,
    pub max_players: Option<u32>,
    pub min_players: Option<u32>,
    pub round_count: Option<u16>,
    pub allow_late_join: bool,

    // --- Schedule ---
    pub starting_time: Timestamp,
    pub end_time: Timestamp,
    pub round_time_limit_minutes: Timestamp,
    pub check_in_time: Timestamp,

    // --- Rewards ---
    pub prize_type: Vec<PrizeType>,
    pub prize_pool_description: Option<String>,

    // --- Access & Privacy ---
    pub visibility: Visibility,
    pub invite_only: bool,
    pub access_code: Option<String>,

    // --- Branding ---
    pub banner_image_url: Option<String>,
    pub sponsor_logo_url: Option<String>,
    pub custom_tags: Vec<String>,

    // --- System Metadata (Optional on input) ---
    pub version: Option<String>,
    pub created_at: Option<Timestamp>,
    pub updated_at: Option<Timestamp>,
    pub status: TournamentStatus,
}

/// Input object for updating a Tournament.
#[derive(Debug, Serialize, Deserialize, Clone, InputObject)]
pub struct TournamentUpdate {
    pub update_type: TournamentUpdates,

    // --- Branding Updates ---
    pub banner_image_url: Option<String>,
    pub sponsor_logo_url: Option<String>,
    pub custom_tags: Vec<String>,

    // --- System Status Updates ---
    pub status: Option<TournamentStatus>,
    pub visibility: Option<Visibility>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Copy, Enum, Eq)]
pub enum TournamentUpdates {
    // Branding
    BannerImage,
    SponsorLogo,
    CustomTags,

    // System
    Status,
    Visibility,
}

const TOURNAMENT_VERSION: &str = "v1";

impl From<TournamentInput> for Tournament {
    fn from(input: TournamentInput) -> Self {
        Tournament {
            // Identity
            organiser_chain: input.organiser_chain,
            organiser_id: input.organiser_id,
            organiser_name: input.organiser_name,
            tournament_id: input.tournament_id.unwrap_or_default(), // Should be set before conversion if using new(), otherwise default
            tournament_name: input.tournament_name,
            tournament_description: input.tournament_description,

            // Format
            tournament_format: input.tournament_format,
            match_type: input.match_type,
            game_mode: input.game_mode,
            time_control: input.time_control.into(),
            max_players: input.max_players,
            min_players: input.min_players,
            round_count: input.round_count,
            allow_late_join: input.allow_late_join,

            // Schedule
            starting_time: input.starting_time,
            end_time: input.end_time,
            round_time_limit_minutes: input.round_time_limit_minutes,
            check_in_time: input.check_in_time,

            // Rewards
            prize_type: input.prize_type,
            prize_pool_description: input.prize_pool_description,

            // Access
            visibility: input.visibility,
            invite_only: input.invite_only,
            access_code: input.access_code,

            // Branding
            banner_image_url: input.banner_image_url,
            sponsor_logo_url: input.sponsor_logo_url,
            custom_tags: input.custom_tags,

            // System
            version: TOURNAMENT_VERSION.to_string(),
            created_at: input.created_at.unwrap_or_else(Timestamp::now),
            updated_at: input.updated_at.unwrap_or_else(Timestamp::now),
            status: input.status, // Use input status, likely Draft
        }
    }
}

impl TournamentInput {
    pub fn new(value: Self, chain_id: ChainId, now: Timestamp, owner: AccountOwner) -> Self {
        use base64::engine::{general_purpose::STANDARD_NO_PAD, Engine as _};
        let tournament_id = STANDARD_NO_PAD.encode(value.tournament_name.clone());
        let mut tournament = value;

        tournament.organiser_id = owner;
        tournament.organiser_chain = chain_id;
        tournament.tournament_id = Some(tournament_id);
        tournament.version = Some(TOURNAMENT_VERSION.to_string());
        tournament.created_at = Some(now);
        tournament.updated_at = Some(now);

        tournament
    }
}

/// Supported tournament formats
#[derive(Debug, Clone, PartialEq, Copy, Enum, Eq)]
pub enum TournamentFormat {
    Swiss,
    RoundRobin,
    Arena,
    SingleElim,
    DoubleElim,
}

impl serde::Serialize for TournamentFormat {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // GraphQL typically outputs SCREAMING_SNAKE_CASE, but we can stick to snake_case for internal logic
        // or align with what GraphQL is doing. Since the error was "expected swiss", the test JSON deserializer
        // was looking for "swiss", but GraphQL returned "SWISS".
        // Let's standardise on what matches async-graphql's default if we want zero-config, or force snake_case.
        // Given we are writing manual impls, let's output snake_case which is usually preferred in JSON.
        let s = match self {
            TournamentFormat::Swiss => "swiss",
            TournamentFormat::RoundRobin => "round_robin",
            TournamentFormat::Arena => "arena",
            TournamentFormat::SingleElim => "single_elim",
            TournamentFormat::DoubleElim => "double_elim",
        };
        serializer.serialize_str(s)
    }
}

impl<'de> Deserialize<'de> for TournamentFormat {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let raw = String::deserialize(deserializer)?;
        let normalized = raw.to_lowercase(); // Handle SWISS -> swiss

        match normalized.as_str() {
            "swiss" => Ok(TournamentFormat::Swiss),
            "round_robin" | "roundrobin" => Ok(TournamentFormat::RoundRobin),
            "arena" => Ok(TournamentFormat::Arena),
            "single_elim" | "singleelim" => Ok(TournamentFormat::SingleElim),
            "double_elim" | "doubleelim" => Ok(TournamentFormat::DoubleElim),
            _ => Err(serde::de::Error::unknown_variant(
                &raw,
                &[
                    "swiss",
                    "round_robin",
                    "arena",
                    "single_elim",
                    "double_elim",
                ],
            )),
        }
    }
}

/// Match type / series
#[derive(Debug, Clone, PartialEq, Copy, Enum, Eq)]
pub enum MatchType {
    Bo1,
    Bo3,
    Bo5,
}

impl serde::Serialize for MatchType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = match self {
            MatchType::Bo1 => "bo1",
            MatchType::Bo3 => "bo3",
            MatchType::Bo5 => "bo5",
        };
        serializer.serialize_str(s)
    }
}

impl<'de> Deserialize<'de> for MatchType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let raw = String::deserialize(deserializer)?;

        let normalized = raw.to_lowercase().replace('_', "").replace('-', "");

        match normalized.as_str() {
            "bo1" => Ok(MatchType::Bo1),
            "bo3" => Ok(MatchType::Bo3),
            "bo5" => Ok(MatchType::Bo5),
            _ => Err(serde::de::Error::unknown_variant(
                &raw,
                &["bo1", "bo3", "bo5"],
            )),
        }
    }
}
/// Simple time control representation (e.g., 3+2)
#[derive(Debug, Serialize, Deserialize, Clone, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct TimeControl {
    pub base_minutes: u32,
    pub increment_seconds: u32,
    pub mode_label: Option<String>, // optional human readable like "3+2"
}

/// Simple time control representation (e.g., 3+2)
#[derive(Debug, Serialize, Deserialize, Clone, InputObject)]
#[serde(rename_all = "camelCase")]
pub struct TimeControlInput {
    pub base_minutes: u32,
    pub increment_seconds: u32,
    pub mode_label: Option<String>, // optional human readable like "3+2"
}

impl From<TimeControlInput> for TimeControl {
    fn from(input: TimeControlInput) -> Self {
        Self {
            base_minutes: input.base_minutes,
            increment_seconds: input.increment_seconds,
            mode_label: input.mode_label,
        }
    }
}

/// Optional game mode (for variants)
#[derive(Debug, Clone, PartialEq, Copy, Enum, Eq)]
pub enum GameMode {
    Standard,
    Microchess,
    Crazyhouse,
}

impl serde::Serialize for GameMode {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = match self {
            GameMode::Standard => "standard",
            GameMode::Microchess => "microchess",
            GameMode::Crazyhouse => "crazyhouse",
        };
        serializer.serialize_str(s)
    }
}

impl<'de> Deserialize<'de> for GameMode {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let raw = String::deserialize(deserializer)?;
        match raw.to_lowercase().as_str() {
            "standard" => Ok(GameMode::Standard),
            "microchess" => Ok(GameMode::Microchess),
            "crazyhouse" => Ok(GameMode::Crazyhouse),
            _ => Err(serde::de::Error::unknown_variant(
                &raw,
                &["standard", "microchess", "crazyhouse"],
            )),
        }
    }
}

/// Prize types supported
#[derive(Debug, Clone, PartialEq, Copy, Enum, Eq)]
pub enum PrizeType {
    Nft,
    Tokens,
}

impl serde::Serialize for PrizeType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = match self {
            PrizeType::Nft => "nft",
            PrizeType::Tokens => "tokens",
        };
        serializer.serialize_str(s)
    }
}

impl<'de> Deserialize<'de> for PrizeType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let raw = String::deserialize(deserializer)?;
        match raw.to_lowercase().as_str() {
            "nft" => Ok(PrizeType::Nft),
            "tokens" => Ok(PrizeType::Tokens),
            _ => Err(serde::de::Error::unknown_variant(&raw, &["nft", "tokens"])),
        }
    }
}

/// Tournament visibility
#[derive(Debug, Clone, PartialEq, Copy, Enum, Eq)]
pub enum Visibility {
    Public,
    Private,
}

impl serde::Serialize for Visibility {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = match self {
            Visibility::Public => "public",
            Visibility::Private => "private",
        };
        serializer.serialize_str(s)
    }
}

impl<'de> Deserialize<'de> for Visibility {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let raw = String::deserialize(deserializer)?;
        match raw.to_lowercase().as_str() {
            "public" => Ok(Visibility::Public),
            "private" => Ok(Visibility::Private),
            _ => Err(serde::de::Error::unknown_variant(
                &raw,
                &["public", "private"],
            )),
        }
    }
}

/// Tournament status lifecycle
#[derive(Debug, Clone, PartialEq, Copy, Enum, Eq)]
pub enum TournamentStatus {
    Draft,
    RegistrationOpen,
    RegistrationClosed,
    InProgress,
    Completed,
    Cancelled,
}

impl serde::Serialize for TournamentStatus {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = match self {
            TournamentStatus::Draft => "draft",
            TournamentStatus::RegistrationOpen => "registration_open",
            TournamentStatus::RegistrationClosed => "registration_closed",
            TournamentStatus::InProgress => "in_progress",
            TournamentStatus::Completed => "completed",
            TournamentStatus::Cancelled => "cancelled",
        };
        serializer.serialize_str(s)
    }
}

impl<'de> Deserialize<'de> for TournamentStatus {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let raw = String::deserialize(deserializer)?;
        let normalized = raw.to_lowercase(); // Handle REGISTRATION_CLOSED -> registration_closed
        match normalized.as_str() {
            "draft" => Ok(TournamentStatus::Draft),
            "registration_open" => Ok(TournamentStatus::RegistrationOpen),
            "registration_closed" | "registrationclosed" => {
                Ok(TournamentStatus::RegistrationClosed)
            }
            "in_progress" | "inprogress" => Ok(TournamentStatus::InProgress),
            "completed" => Ok(TournamentStatus::Completed),
            "cancelled" => Ok(TournamentStatus::Cancelled),
            _ => Err(serde::de::Error::unknown_variant(
                &raw,
                &[
                    "draft",
                    "published",
                    "registration_closed",
                    "in_progress",
                    "completed",
                    "cancelled",
                ],
            )),
        }
    }
}

#[cfg(test)]
mod examples {
    #[test]
    fn example_host_tournament_input() {}
}
