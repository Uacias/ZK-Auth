use crate::{
    errors::ServerError,
    models::user::{LoginPayload, LoginResponse, RegisterPayload, User},
};
use serde_json::json;
use surrealdb::Surreal;
use validator::Validate;

pub async fn register_user<C>(
    db: &Surreal<C>,
    payload: RegisterPayload,
) -> Result<User, ServerError>
where
    C: surrealdb::Connection,
{
    payload.validate().map_err(|e| {
        let details = e
            .field_errors()
            .iter()
            .flat_map(|(_, errs)| {
                errs.iter()
                    .map(|err| err.message.clone().unwrap_or_default().to_string())
            })
            .collect::<Vec<_>>();

        tracing::warn!("❌ Register validation error: {:?}", details);

        ServerError::BadRequest {
            message: "Invalid input".to_string(),
            details,
        }
    })?;

    let created: Option<User> = db
        .create("user")
        .content(json!({
            "name": payload.name,
            "password": payload.password,
        }))
        .await
        .map_err(|e| {
            tracing::error!("❌ Failed to create user: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    created.ok_or(ServerError::NoRecordCreated)
}

pub async fn login_user<C>(
    db: &Surreal<C>,
    payload: LoginPayload,
) -> Result<LoginResponse, ServerError>
where
    C: surrealdb::Connection,
{
    payload.validate().map_err(|e| {
        let details = e
            .field_errors()
            .iter()
            .flat_map(|(_, errs)| {
                errs.iter()
                    .map(|err| err.message.clone().unwrap_or_default().to_string())
            })
            .collect::<Vec<_>>();

        tracing::warn!("❌ Login validation error: {:?}", details);

        ServerError::BadRequest {
            message: "Invalid input".to_string(),
            details,
        }
    })?;

    let sql = "SELECT * FROM user WHERE name = $name";
    let mut response = db
        .query(sql)
        .bind(("name", payload.name.clone()))
        .await
        .map_err(|e| {
            tracing::error!("❌ DB query error: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    let users: Vec<User> = response.take(0).map_err(|e| {
        tracing::error!("❌ Failed to extract user list from query result: {:?}", e);
        ServerError::Db(e.to_string())
    })?;

    let user = users
        .into_iter()
        .next()
        .ok_or(ServerError::InvalidCredentials)?;

    if user.password != payload.password {
        return Err(ServerError::InvalidCredentials);
    }

    Ok(LoginResponse {
        id: match &user.id.id {
            surrealdb::sql::Id::String(s) => s.clone(),
            _ => user.id.to_string(),
        },
        name: user.name,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::user::RegisterPayload;
    use rand::{Rng, distr::Alphanumeric};
    use surrealdb::Surreal;
    use surrealdb::engine::local::Mem;
    use tracing_subscriber::{self, EnvFilter};

    fn random_string(len: usize) -> String {
        rand::rng()
            .sample_iter(&Alphanumeric)
            .take(len)
            .map(char::from)
            .collect()
    }

    #[tokio::test]
    async fn test_register_user_fuzzy() {
        let _ = tracing_subscriber::fmt()
            .with_env_filter(EnvFilter::from_default_env())
            .with_test_writer()
            .try_init();

        let db = Surreal::new::<Mem>(()).await.unwrap();
        db.use_ns("test").use_db("test").await.unwrap();

        for i in 0..10 {
            let name_len = rand::rng().random_range(10..=30);
            let password_len = rand::rng().random_range(8..=50);

            let random_name = random_string(name_len);
            let random_password = random_string(password_len);

            let payload = RegisterPayload {
                name: random_name.clone(),
                password: random_password.clone(),
            };

            let result = register_user(&db, payload).await;

            assert!(
                result.is_ok(),
                "Run {}: Register user failed: {:?}",
                i,
                result
            );
            let user = result.unwrap();
            assert_eq!(user.name, random_name);
            assert_eq!(user.password, random_password);

            println!(
                "✅ [{}] Created user: {} (len: {}), password: {} (len: {})",
                i,
                user.name,
                user.name.len(),
                user.password,
                user.password.len()
            );
        }
    }
}
