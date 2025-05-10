use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use thiserror::Error;
use tracing::error;

#[derive(Error, Debug)]
pub enum ServerError {
    #[error("database error")]
    Db,
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(self.to_string())).into_response()
    }
}

impl From<surrealdb::Error> for ServerError {
    fn from(error: surrealdb::Error) -> Self {
        error!("{error}");
        Self::Db
    }
}
