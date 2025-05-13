use crate::{
    errors::ServerError,
    models::user::{LoginPayload, LoginResponse, RegisterPayload, User},
    services::{
        auth_hashing_service::{login_user_hashed, register_user_hashed},
        auth_service::{login_user, register_user},
    },
    utils::db::state::AppState,
};
use axum::{Json, Router, extract::State, routing::post};
use surrealdb::Connection;

pub fn auth_routes<C: Connection + Clone + Send + Sync + 'static>() -> Router<AppState<C>> {
    Router::new()
        .route("/register", post(register::<C>))
        .route("/login", post(login))
        .route("/register_hashed", post(register_hashed::<C>))
        .route("/login_hashed", post(login_hashed))
}

async fn register<C: Connection + Clone + Send + Sync + 'static>(
    State(state): State<AppState<C>>,
    Json(payload): Json<RegisterPayload>,
) -> Result<Json<User>, ServerError> {
    let user = register_user(&state.db, payload).await?;
    Ok(Json(user))
}

async fn login(
    State(state): State<AppState<impl Connection + Clone + Send + Sync + 'static>>,
    Json(payload): Json<LoginPayload>,
) -> Result<Json<LoginResponse>, ServerError> {
    let db = &state.db;
    let result = login_user(db, payload).await?;
    Ok(Json(result))
}

async fn register_hashed<C: Connection + Clone + Send + Sync + 'static>(
    State(state): State<AppState<C>>,
    Json(payload): Json<RegisterPayload>,
) -> Result<Json<User>, ServerError> {
    let user = register_user_hashed(&state.db, payload).await?;
    Ok(Json(user))
}

async fn login_hashed(
    State(state): State<AppState<impl Connection + Clone + Send + Sync + 'static>>,
    Json(payload): Json<LoginPayload>,
) -> Result<Json<LoginResponse>, ServerError> {
    let db = &state.db;
    let result = login_user_hashed(db, payload).await?;
    Ok(Json(result))
}
