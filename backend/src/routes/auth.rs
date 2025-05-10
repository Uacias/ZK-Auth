use crate::{
    errors::ServerError,
    models::user::{RegisterPayload, User},
    services::auth_service::register_user,
    utils::db::state::AppState,
};
use axum::{Json, Router, extract::State, routing::post};
use surrealdb::Connection;

pub fn auth_routes<C: Connection + Clone + Send + Sync + 'static>() -> Router<AppState<C>> {
    Router::new().route("/register", post(register::<C>))
}

async fn register<C: Connection + Clone + Send + Sync + 'static>(
    State(state): State<AppState<C>>,
    Json(payload): Json<RegisterPayload>,
) -> Result<Json<User>, ServerError> {
    let user = register_user(&state.db, payload).await?;
    Ok(Json(user))
}
