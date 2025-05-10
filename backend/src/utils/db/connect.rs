use crate::{args::CliArgs, errors::ServerError};
use std::sync::LazyLock;
use surrealdb::{
    Surreal,
    engine::remote::ws::{Client, Ws},
    opt::auth::Root,
};
use tracing::info;

pub static DB: LazyLock<Surreal<Client>> = LazyLock::new(Surreal::init);

#[derive(Debug)]
pub struct DbInitializer {
    url: String,
    user: String,
    password: String,
    namespace: String,
    database: String,
}

impl DbInitializer {
    pub fn from_args(args: CliArgs) -> Self {
        Self {
            url: args.surreal_url,
            user: args.surreal_user,
            password: args.surreal_pass,
            namespace: args.surreal_namespace,
            database: args.surreal_database,
        }
    }

    pub async fn connect(&self) -> Result<(), ServerError> {
        DB.connect::<Ws>(&self.url).await?;
        DB.signin(Root {
            username: &self.user,
            password: &self.password,
        })
        .await?;
        DB.use_ns(&self.namespace).use_db(&self.database).await?;
        info!(
            "Successfully connected to SurrealDB at {} (namespace: {}, database: {})",
            self.url, self.namespace, self.database
        );
        Ok(())
    }
}
