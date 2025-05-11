use backend::args;
use backend::errors;
use backend::routes;
use backend::utils;
use backend::utils::db::state::AppState;

use args::CliArgs;
use axum::Router;
use clap::Parser;
use errors::ServerError;
use routes::auth::auth_routes;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};
use utils::db::connect::DbInitializer;

#[tokio::main]
async fn main() -> Result<(), ServerError> {
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(fmt::layer())
        .init();

    let args = CliArgs::parse();
    let db = DbInitializer::from_args(args.clone()).connect().await?;

    let state = AppState { db };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST])
        .allow_headers(Any);

    let app = Router::new()
        .nest("/auth", auth_routes())
        .with_state(state.clone())
        .layer(cors);

    let listener = TcpListener::bind(&args.bind).await?;
    info!("🚀 Server running at http://{}", args.bind);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(ServerError::from)
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Failed to listen for Ctrl+C");
    info!("🛑 Shutdown signal received, stopping server...");
}
