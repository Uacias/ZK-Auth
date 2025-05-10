use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Thing,
    pub name: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterPayload {
    pub name: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginPayload {
    pub name: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub id: String,
    pub name: String,
}
