use crate::{
    errors::ServerError,
    models::zk_user::{
        ZkChallengeResponse, ZkLoginPayload, ZkLoginResponse, ZkRegisterPayload, ZkUser,
    },
};
use chrono::{Duration, Utc};
use rand::Rng;
use serde_json::json;
use surrealdb::Surreal;
use validator::Validate;

const NONCE_EXPIRY_MINUTES: i64 = 5;

fn generate_nonce() -> String {
    const CHARSET: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::rng();
    (0..25) // Reduced from 32 to 25 chars to fit BN254 field limit
        .map(|_| {
            let idx = rng.random_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

pub async fn register_zk_user<C>(
    db: &Surreal<C>,
    payload: ZkRegisterPayload,
) -> Result<ZkUser, ServerError>
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

        tracing::warn!("❌ ZK Register validation error: {:?}", details);

        ServerError::BadRequest {
            message: "Invalid input".to_string(),
            details,
        }
    })?;

    // Check if username already exists
    let sql = "SELECT * FROM zk_user WHERE username = $username";
    let mut response = db
        .query(sql)
        .bind(("username", payload.username.clone()))
        .await
        .map_err(|e| {
            tracing::error!("❌ DB query error: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    let existing_users: Vec<ZkUser> = response.take(0).map_err(|e| {
        tracing::error!("❌ Failed to extract user list from query result: {:?}", e);
        ServerError::Db(e.to_string())
    })?;

    if !existing_users.is_empty() {
        return Err(ServerError::BadRequest {
            message: "Username already exists".to_string(),
            details: vec!["Choose a different username".to_string()],
        });
    }

    let now = Utc::now();
    let created: Option<ZkUser> = db
        .create("zk_user")
        .content(json!({
            "username": payload.username,
            "salt": payload.salt,
            "commitment": payload.commitment,
            "nonce": serde_json::Value::Null,
            "nonce_expires": serde_json::Value::Null,
            "created_at": now,
        }))
        .await
        .map_err(|e| {
            tracing::error!("❌ Failed to create ZK user: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    created.ok_or(ServerError::NoRecordCreated)
}

pub async fn get_user_salt<C>(
    db: &Surreal<C>,
    username: String,
) -> Result<String, ServerError>
where
    C: surrealdb::Connection,
{
    use serde_json::Value;
    
    let sql = "SELECT salt FROM zk_user WHERE username = $username LIMIT 1";
    let mut response = db
        .query(sql)
        .bind(("username", username.clone()))
        .await
        .map_err(|e| {
            tracing::error!("❌ DB query error: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    let results: Vec<Value> = response.take(0).map_err(|e| {
        tracing::error!("❌ Failed to extract salt from query: {:?}", e);
        ServerError::Db(format!("Failed to query salt: {}", e))
    })?;

    let result = results
        .into_iter()
        .next()
        .ok_or_else(|| ServerError::BadRequest {
            message: "User not found".to_string(),
            details: vec!["Username does not exist".to_string()],
        })?;

    let salt = result["salt"].as_str()
        .ok_or_else(|| ServerError::InternalServerError("Salt field not found".to_string()))?
        .to_string();

    tracing::info!("✅ Retrieved salt for user: {}", username);
    Ok(salt)
}

pub async fn get_challenge<C>(
    db: &Surreal<C>,
    username: String,
) -> Result<ZkChallengeResponse, ServerError>
where
    C: surrealdb::Connection,
{
    // Check if user exists
    let sql = "SELECT * FROM zk_user WHERE username = $username";
    let mut response = db
        .query(sql)
        .bind(("username", username.clone()))
        .await
        .map_err(|e| {
            tracing::error!("❌ DB query error: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    let users: Vec<ZkUser> = response.take(0).map_err(|e| {
        tracing::error!("❌ Failed to extract user list from query result: {:?}", e);
        ServerError::Db(e.to_string())
    })?;

    let _user = users
        .into_iter()
        .next()
        .ok_or_else(|| ServerError::BadRequest {
            message: "User not found".to_string(),
            details: vec!["Username does not exist".to_string()],
        })?;

    // Generate new nonce
    let nonce = generate_nonce();
    let expires_at = Utc::now() + Duration::minutes(NONCE_EXPIRY_MINUTES);

    // Update user with new nonce
    let update_sql =
        "UPDATE zk_user SET nonce = $nonce, nonce_expires = $expires WHERE username = $username";
    db.query(update_sql)
        .bind(("nonce", nonce.clone()))
        .bind(("expires", expires_at))
        .bind(("username", username.clone()))
        .await
        .map_err(|e| {
            tracing::error!("❌ Failed to update nonce: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    tracing::info!("🔑 Generated challenge for user: {}", username);

    Ok(ZkChallengeResponse {
        nonce: nonce.clone(),
        expires_at,
    })
}

pub async fn verify_zk_proof<C>(
    db: &Surreal<C>,
    payload: ZkLoginPayload,
) -> Result<ZkLoginResponse, ServerError>
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

        tracing::warn!("❌ ZK Login validation error: {:?}", details);

        ServerError::BadRequest {
            message: "Invalid input".to_string(),
            details,
        }
    })?;

    // Get user with current nonce
    let sql = "SELECT * FROM zk_user WHERE username = $username";
    let mut response = db
        .query(sql)
        .bind(("username", payload.username.clone()))
        .await
        .map_err(|e| {
            tracing::error!("❌ DB query error: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    let users: Vec<ZkUser> = response.take(0).map_err(|e| {
        tracing::error!("❌ Failed to extract user list from query result: {:?}", e);
        ServerError::Db(e.to_string())
    })?;

    let user = users
        .into_iter()
        .next()
        .ok_or(ServerError::InvalidCredentials)?;

    // Verify nonce exists and hasn't expired
    let stored_nonce = user.nonce.ok_or_else(|| {
        tracing::warn!("❌ No active challenge for user: {}", payload.username);
        ServerError::BadRequest {
            message: "No active challenge".to_string(),
            details: vec!["Request a new challenge first".to_string()],
        }
    })?;

    let nonce_expires = user.nonce_expires.ok_or_else(|| {
        tracing::error!(
            "❌ Nonce without expiry time for user: {}",
            payload.username
        );
        ServerError::InternalServerError("Invalid nonce state".to_string())
    })?;

    if Utc::now() > nonce_expires {
        tracing::warn!("❌ Expired challenge for user: {}", payload.username);
        return Err(ServerError::BadRequest {
            message: "Challenge expired".to_string(),
            details: vec!["Request a new challenge".to_string()],
        });
    }

    if stored_nonce != payload.nonce {
        tracing::warn!("❌ Invalid nonce for user: {}", payload.username);
        return Err(ServerError::InvalidCredentials);
    }

    // TODO: Verify the ZK proof here
    // For now, we'll just validate that proof is not empty
    if payload.proof.is_empty() {
        return Err(ServerError::BadRequest {
            message: "Invalid proof".to_string(),
            details: vec!["Proof cannot be empty".to_string()],
        });
    }

    // Clear the used nonce
    let clear_nonce_sql =
        "UPDATE zk_user SET nonce = null, nonce_expires = null WHERE username = $username";
    db.query(clear_nonce_sql)
        .bind(("username", payload.username.clone()))
        .await
        .map_err(|e| {
            tracing::error!("❌ Failed to clear nonce: {:?}", e);
            ServerError::Db(e.to_string())
        })?;

    tracing::info!("✅ ZK proof verified for user: {}", payload.username);

    Ok(ZkLoginResponse {
        id: match &user.id.as_ref().unwrap().id {
            surrealdb::sql::Id::String(s) => s.clone(),
            _ => user.id.unwrap().to_string(),
        },
        username: user.username,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use surrealdb::Surreal;
    use surrealdb::engine::local::Mem;
    use tracing_subscriber::{self, EnvFilter};

    #[tokio::test]
    async fn test_zk_register_and_challenge() {
        let _ = tracing_subscriber::fmt()
            .with_env_filter(EnvFilter::from_default_env())
            .with_test_writer()
            .try_init();

        let db = Surreal::new::<Mem>(()).await.unwrap();
        db.use_ns("test").use_db("test").await.unwrap();

        // Test registration
        let payload = ZkRegisterPayload {
            username: "testuser".to_string(),
            salt: "testsalt123".to_string(),
            commitment: "testcommitment456".to_string(),
        };

        let user = register_zk_user(&db, payload).await.unwrap();
        assert_eq!(user.username, "testuser");
        assert_eq!(user.salt, "testsalt123");
        assert_eq!(user.commitment, "testcommitment456");

        // Test challenge generation
        let challenge = get_challenge(&db, "testuser".to_string()).await.unwrap();
        assert!(!challenge.nonce.is_empty());
        assert!(challenge.expires_at > Utc::now());
    }
}
