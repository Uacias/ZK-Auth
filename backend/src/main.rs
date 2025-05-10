mod args;
mod errors;
mod models;
mod routes;
mod services;
mod utils;

use args::CliArgs;
use axum::Router;
use clap::Parser;
use errors::ServerError;
use routes::auth::auth_routes;
use tokio::net::TcpListener;
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
    DbInitializer::from_args(args.clone()).connect().await?;

    let app = Router::new().nest("/auth", auth_routes());
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
