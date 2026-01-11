pub mod utils;

use async_graphql::{Enum, InputObject, SimpleObject};
use base64::{engine::general_purpose, Engine};
use linera_sdk::linera_base_types::{AccountOwner, ChainId, Timestamp};
use serde::{Deserialize, Serialize};

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
    pub tournament_chain: Option<ChainId>,

    // --- Format & Rules ---
    pub tournament_format: TournamentFormat,
    pub match_type: MatchType,
    pub game_mode: GameMode,
    pub time_control: TimeControl,
    pub max_players: u32,
    pub min_players: u32,
    pub round_count: Option<u8>,

    // --- Schedule ---
    pub starting_time: Timestamp,
    pub end_time: Timestamp,

    // --- Rewards ---
    pub prize_type: PrizeType,
    pub prize_pool: u32,
    pub prize_pool_description: Option<String>,

    // --- Access & Privacy ---
    pub visibility: Visibility,
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

impl Tournament {
    pub fn update(&mut self, update: &TournamentUpdate, now: Timestamp) {
        if let Some(tournament_name) = &update.tournament_name {
            self.tournament_name = tournament_name.to_string();
        }

        if let Some(tournament_desc) = &update.tournament_description {
            self.tournament_description = Some(tournament_desc.to_string());
        }

        if let Some(banner) = &update.banner_image_url {
            self.banner_image_url = Some(banner.to_string());
        }

        if let Some(logo) = &update.sponsor_logo_url {
            self.sponsor_logo_url = Some(logo.to_string());
        }

        if let Some(custom_tags) = &update.custom_tags {
            if !custom_tags.is_empty() {
                self.custom_tags = custom_tags.to_vec();
            }
        }

        if self.status == TournamentStatus::Draft {
            if let Some(status) = update.status {
                self.status = status;
            }
        }

        if self.status == TournamentStatus::Draft {
            if let Some(prize_type) = update.prize_type {
                self.prize_type = prize_type;
            }
        }

        if self.status == TournamentStatus::Draft && self.prize_type == PrizeType::Tokens {
            if let Some(prize_pool) = update.prize_pool {
                self.prize_pool = prize_pool;
            }
        }

        if let Some(visibility) = update.visibility {
            self.visibility = visibility;
        }
        self.updated_at = now;
    }
}

/// Input object for creating a new Tournament (Mutations).
#[derive(Debug, Serialize, Deserialize, Clone, InputObject)]
pub struct TournamentInput {
    // --- Identity ---
    pub organiser_chain: Option<ChainId>,
    pub organiser_id: Option<AccountOwner>,
    pub organiser_name: String,
    pub tournament_id: Option<String>, // Generated system-side
    pub tournament_name: String,
    pub tournament_description: Option<String>,
    // --- Format & Rules ---
    pub tournament_format: TournamentFormat,
    pub match_type: MatchType,
    pub game_mode: GameMode,
    pub time_control: TimeControlInput,
    pub max_players: u32,
    pub min_players: u32,
    pub round_count: Option<u8>,

    // --- Schedule ---
    pub starting_time: u64,
    pub end_time: u64,

    // --- Rewards ---
    pub prize_type: PrizeType,
    pub prize_pool: u32,
    pub prize_pool_description: Option<String>,

    // --- Access & Privacy ---
    pub visibility: Visibility,

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
    // --- Branding Updates ---
    pub tournament_name: Option<String>,
    pub tournament_description: Option<String>,
    pub banner_image_url: Option<String>,
    pub sponsor_logo_url: Option<String>,
    pub custom_tags: Option<Vec<String>>,
    pub prize_pool: Option<u32>,
    pub prize_type: Option<PrizeType>,

    // --- System Status Updates ---
    pub status: Option<TournamentStatus>,
    pub visibility: Option<Visibility>,
}

const TOURNAMENT_VERSION: &str = "v1";

impl From<TournamentInput> for Tournament {
    fn from(input: TournamentInput) -> Self {
        Tournament {
            // Identity
            organiser_chain: input.organiser_chain.expect("failed to get oraniser_chain"),
            organiser_id: input.organiser_id.unwrap(),
            organiser_name: input.organiser_name,
            tournament_id: input.tournament_id.unwrap_or_default(), // Should be set before conversion if using new(), otherwise default
            tournament_name: input.tournament_name,
            tournament_description: input.tournament_description,
            tournament_chain: None,

            // Format
            tournament_format: input.tournament_format,
            match_type: input.match_type,
            game_mode: input.game_mode,
            time_control: input.time_control.into(),
            max_players: input.max_players,
            min_players: input.min_players,
            round_count: input.round_count,

            // Schedule
            starting_time: Timestamp::from(input.starting_time),
            end_time: Timestamp::from(input.end_time),

            // Rewards
            prize_type: input.prize_type,
            prize_pool: input.prize_pool,
            prize_pool_description: input.prize_pool_description,

            // Access
            visibility: input.visibility,

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
        let unique = format!("{}{}{}", now, owner, value.tournament_name.clone()); // keeping it simple
        let bytes = postcard::to_allocvec(&unique).expect("postcard serialization failed");
        let tournament_id = general_purpose::STANDARD.encode(&bytes);

        let mut tournament = value;

        tournament.organiser_id = Some(owner);
        tournament.organiser_chain = Some(chain_id);
        tournament.tournament_id = Some(tournament_id);
        tournament.version = Some(TOURNAMENT_VERSION.to_string());
        tournament.created_at = Some(now);
        tournament.updated_at = Some(now);

        tournament
    }
}

/// Supported tournament formats
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Copy, Enum, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TournamentFormat {
    Swiss,
    RoundRobin,
    Arena,
    SingleElim,
    DoubleElim,
}

/// Match type / series
#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Copy, Enum, Eq)]
pub enum MatchType {
    #[serde(rename = "BO_1")]
    Bo1,
    #[serde(rename = "BO_3")]
    Bo3,
    #[serde(rename = "BO_5")]
    Bo5,
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
#[derive(Debug, Default, Serialize, Deserialize, Clone, InputObject)]
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
#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Copy, Enum, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum GameMode {
    Standard,
    Microchess,
    Crazyhouse,
}

/// Prize types supported
#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Copy, Enum, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PrizeType {
    Nft,
    Tokens,
}

/// Tournament visibility
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Copy, Enum, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Visibility {
    Public,
    Private,
}

/// Tournament status lifecycle
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Copy, Enum, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TournamentStatus {
    Draft,
    RegistrationOpen,
    RegistrationClosed,
    InProgress,
    Completed,
    Cancelled,
}
