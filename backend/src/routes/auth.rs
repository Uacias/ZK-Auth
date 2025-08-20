use crate::{
    errors::ServerError,
    models::{
        user::{LoginPayload, LoginResponse, RegisterPayload, User},
        zk_user::{ZkRegisterPayload, ZkLoginPayload, ZkChallengeResponse, ZkLoginResponse, ZkUser},
    },
    services::{
        auth_hashing_service::{login_user_hashed, register_user_hashed},
        auth_service::{login_user, register_user},
        zk_auth_service::{register_zk_user, get_challenge, verify_zk_proof, get_user_salt},
    },
    utils::db::state::AppState,
};
use axum::{Json, Router, extract::{State, Path}, routing::{post, get}};
use surrealdb::Connection;

pub fn auth_routes<C: Connection + Clone + Send + Sync + 'static>() -> Router<AppState<C>> {
    Router::new()
        .route("/register", post(register::<C>))
        .route("/login", post(login))
        .route("/register_hashed", post(register_hashed::<C>))
        .route("/login_hashed", post(login_hashed))
        .route("/zk/register", post(zk_register::<C>))
        .route("/zk/login", post(zk_login))
        .route("/zk/challenge/{username}", get(zk_challenge))
        .route("/zk/salt/{username}", get(zk_get_salt))
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

async fn zk_register<C: Connection + Clone + Send + Sync + 'static>(
    State(state): State<AppState<C>>,
    Json(payload): Json<ZkRegisterPayload>,
) -> Result<Json<ZkUser>, ServerError> {
    let user = register_zk_user(&state.db, payload).await?;
    Ok(Json(user))
}

async fn zk_login(
    State(state): State<AppState<impl Connection + Clone + Send + Sync + 'static>>,
    Json(payload): Json<ZkLoginPayload>,
) -> Result<Json<ZkLoginResponse>, ServerError> {
    let db = &state.db;
    let result = verify_zk_proof(db, payload).await?;
    Ok(Json(result))
}

async fn zk_challenge(
    State(state): State<AppState<impl Connection + Clone + Send + Sync + 'static>>,
    Path(username): Path<String>,
) -> Result<Json<ZkChallengeResponse>, ServerError> {
    let db = &state.db;
    let result = get_challenge(db, username).await?;
    Ok(Json(result))
}

async fn zk_get_salt(
    State(state): State<AppState<impl Connection + Clone + Send + Sync + 'static>>,
    Path(username): Path<String>,
) -> Result<Json<String>, ServerError> {
    let db = &state.db;
    let salt = get_user_salt(db, username).await?;
    Ok(Json(salt))
}
