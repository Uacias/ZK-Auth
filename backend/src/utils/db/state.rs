use surrealdb::Connection;
use surrealdb::Surreal;

#[derive(Clone)]
pub struct AppState<C: Connection + Clone + Send + Sync + 'static> {
    pub db: Surreal<C>,
}
