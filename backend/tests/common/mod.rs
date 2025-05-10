use axum::Router;
use backend::routes::auth::auth_routes;
use backend::utils::db::state::AppState; // <- Twój AppState struct
use rand::{Rng, distr::Alphanumeric};
use surrealdb::Surreal;
use surrealdb::engine::local::Mem;
use tokio::task::JoinHandle;
use tracing_subscriber::{self, EnvFilter};

/// Generates a random alphanumeric string of given length.
pub fn random_string(len: usize) -> String {
    rand::rng()
        .sample_iter(&Alphanumeric)
        .take(len)
        .map(char::from)
        .collect()
}

/// Spawns the test server with in-memory DB.
/// Returns (base_url, server_handle)
pub async fn spawn_test_server() -> (String, JoinHandle<Result<(), std::io::Error>>) {
    // Initialize tracing once (for pretty logs in tests)
    let _ = tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_test_writer()
        .try_init();

    // In-memory DB (for isolated tests)
    let db = Surreal::new::<Mem>(()).await.expect("Failed to init MemDB");
    db.use_ns("test")
        .use_db("test")
        .await
        .expect("Failed to set namespace");

    // AppState wrapping our in-memory DB
    let state = AppState { db: db.clone() };

    // Build router with state
    let app = Router::new().nest("/auth", auth_routes()).with_state(state);

    // Bind to a random available port
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("Failed to bind");
    let addr = listener.local_addr().unwrap();
    let base_url = format!("http://{}", addr);

    // Run the server in background
    let server = axum::serve(listener, app.into_make_service()).into_future();
    let handle = tokio::spawn(server);

    (base_url, handle)
}
