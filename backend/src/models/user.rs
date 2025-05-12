use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use validator_derive::Validate;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Thing,
    pub name: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct RegisterPayload {
    #[validate(length(min = 3, message = "Name must be at least 3 characters long"))]
    pub name: String,
    #[validate(length(min = 6, message = "Password must be at least 6 characters long"))]
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct LoginPayload {
    #[validate(length(min = 3, message = "Name must be at least 3 characters long"))]
    pub name: String,

    #[validate(length(min = 6, message = "Password must be at least 6 characters long"))]
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub id: String,
    pub name: String,
}
