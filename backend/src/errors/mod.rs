use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use thiserror::Error;
use tracing::error;

#[derive(Debug, Error)]
pub enum ServerError {
    #[error("Database error: {0}")]
    Db(String),

    #[error("Could not create record")]
    NoRecordCreated,

    #[error("Invalid login credentials")]
    InvalidCredentials,

    #[error("Bad request")]
    BadRequest {
        message: String,
        details: Vec<String>,
    },

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        let (status, message, details) = match self {
            ServerError::InvalidCredentials => (StatusCode::UNAUTHORIZED, self.to_string(), vec![]),
            ServerError::NoRecordCreated => {
                (StatusCode::INTERNAL_SERVER_ERROR, self.to_string(), vec![])
            }
            ServerError::Db(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database error".to_string(),
                vec![msg],
            ),
            ServerError::BadRequest { message, details } => {
                (StatusCode::BAD_REQUEST, message, details)
            }
            ServerError::Io(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "IO error".to_string(),
                vec![e.to_string()],
            ),
        };

        let body = serde_json::json!({
            "error": {
                "message": message,
                "details": details
            },
            "code": status.as_u16(),
        });

        (status, Json(body)).into_response()
    }
}

impl From<surrealdb::Error> for ServerError {
    fn from(err: surrealdb::Error) -> Self {
        error!("❌ SurrealDB error: {:?}", err);
        ServerError::Db(err.to_string())
    }
}
