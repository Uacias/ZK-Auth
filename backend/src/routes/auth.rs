use axum::{Json, Router, routing::post};

use crate::{
    errors::ServerError,
    models::user::{RegisterPayload, User},
    services::auth_service::register_user,
    utils::db::connect::DB,
};

pub fn auth_routes() -> Router {
    Router::new().route("/register", post(register))
}

async fn register(Json(payload): Json<RegisterPayload>) -> Result<Json<User>, ServerError> {
    let user = register_user(&DB, payload).await?;
    Ok(Json(user))
}
