use clap::Parser;
use std::net::SocketAddr;

#[derive(Parser, Debug)]
#[command(
    name = "zk-auth-backend",
    author = "Uacias",
    about = "Zero-Knowledge Auth Backend"
)]
pub struct CliArgs {
    // Server address
    #[arg(long, short, env, default_value = "0.0.0.0:8080")]
    bind: SocketAddr,
    // DB address
    #[arg(long, env, default_value = "localhost:8000")]
    pub surreal_url: String,
    // DB credentials
    #[arg(long, env, default_value = "test")]
    pub surreal_pass: String,
    #[arg(long, env, default_value = "test")]
    pub surreal_user: String,
    #[arg(long, env, default_value = "test")]
    pub surreal_namespace: String,
    #[arg(long, env, default_value = "test")]
    pub surreal_database: String,
}
