mod args;
mod errors;
mod utils;

use args::CliArgs;
use clap::Parser;
use errors::ServerError;
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};
use utils::db::connect::DbClient;

#[tokio::main]
async fn main() -> Result<(), ServerError> {
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(fmt::layer())
        .init();

    let args = CliArgs::parse();

    let db_client = DbClient::from_args(args);
    db_client.connect().await?;

    Ok(())
}
