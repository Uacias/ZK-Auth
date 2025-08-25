use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use validator_derive::Validate;

#[derive(Debug, Serialize, Deserialize)]
pub struct ZkUser {
    pub id: Option<Thing>,
    pub username: String,
    pub salt: String,
    pub commitment: String,
    pub nonce: Option<String>,
    pub nonce_expires: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct ZkRegisterPayload {
    #[validate(length(min = 3, message = "Username must be at least 3 characters long"))]
    pub username: String,
    pub salt: String,
    pub commitment: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct ZkLoginPayload {
    #[validate(length(min = 3, message = "Username must be at least 3 characters long"))]
    pub username: String,
    pub proof: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ZkChallengeResponse {
    pub nonce: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ZkLoginResponse {
    pub id: String,
    pub username: String,
}