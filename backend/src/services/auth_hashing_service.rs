use serde_json::json;
use surrealdb::Surreal;
use validator::Validate;

use crate::{
    errors::ServerError,
    models::user::{LoginPayload, LoginResponse, RegisterPayload, User},
    utils::crypto::{hash_password, verify_password},
};

pub async fn register_user_hashed<C>(
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

    let hashed = hash_password(&payload.password).map_err(ServerError::InternalServerError)?;

    let created: Option<User> = db
        .create("user")
        .content(json!({
            "name": payload.name,
            "password": hashed,
        }))
        .await
        .map_err(|e| ServerError::Db(e.to_string()))?;

    created.ok_or(ServerError::NoRecordCreated)
}

pub async fn login_user_hashed<C>(
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
        .map_err(|e| ServerError::Db(e.to_string()))?;

    let users: Vec<User> = response
        .take(0)
        .map_err(|e| ServerError::Db(e.to_string()))?;

    let user = users
        .into_iter()
        .next()
        .ok_or(ServerError::InvalidCredentials)?;

    let valid = verify_password(&payload.password, &user.password)
        .map_err(ServerError::InternalServerError)?;

    if !valid {
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
    use crate::models::user::{LoginPayload, RegisterPayload};
    use crate::utils::crypto::verify_password;
    use rand::Rng;
    use rand::distr::Alphanumeric;
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
    async fn test_register_user_hashed_fuzzy() {
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

            let result = register_user_hashed(&db, payload).await;

            assert!(
                result.is_ok(),
                "Run {}: register_user_hashed failed: {:?}",
                i,
                result
            );

            let user = result.unwrap();
            assert_eq!(user.name, random_name);

            let valid = verify_password(&random_password, &user.password)
                .expect("Failed to verify hashed password");
            assert!(valid, "Run {}: hashed password is not valid", i);

            println!(
                "✅ [{}] Created user: {}, password hash valid ✅",
                i, user.name
            );
        }
    }

    #[tokio::test]
    async fn test_login_user_hashed_success() {
        let db = Surreal::new::<Mem>(()).await.unwrap();
        db.use_ns("test").use_db("test").await.unwrap();

        let username = "testuser_login";
        let password = "SuperSecretPassword123";

        let reg_payload = RegisterPayload {
            name: username.to_string(),
            password: password.to_string(),
        };

        let user = register_user_hashed(&db, reg_payload).await.unwrap();

        let login_payload = LoginPayload {
            name: username.to_string(),
            password: password.to_string(),
        };

        let login_response = login_user_hashed(&db, login_payload)
            .await
            .expect("Login should succeed");

        assert_eq!(login_response.name, username);
        assert_eq!(
            login_response.id,
            match &user.id.id {
                surrealdb::sql::Id::String(s) => s.clone(),
                _ => panic!("Unexpected user.id format"),
            }
        );

        println!("✅ Login successful for user {}", login_response.name);
    }

    #[tokio::test]
    async fn test_login_user_hashed_fail_on_wrong_password() {
        let db = Surreal::new::<Mem>(()).await.unwrap();
        db.use_ns("test").use_db("test").await.unwrap();

        let username = "testuser_wrongpw";
        let password = "CorrectPassword";

        let reg_payload = RegisterPayload {
            name: username.to_string(),
            password: password.to_string(),
        };

        let _ = register_user_hashed(&db, reg_payload).await.unwrap();

        let login_payload = LoginPayload {
            name: username.to_string(),
            password: "WrongPassword".to_string(),
        };

        let result = login_user_hashed(&db, login_payload).await;

        assert!(
            matches!(result, Err(ServerError::InvalidCredentials)),
            "Expected InvalidCredentials error"
        );

        println!("✅ Rejected invalid login attempt for {}", username);
    }
}
