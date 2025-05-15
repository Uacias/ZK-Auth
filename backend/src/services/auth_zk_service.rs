use serde_json::json;
use surrealdb::Surreal;
use tracing::info;
use validator::Validate;

use crate::{
    errors::ServerError,
    models::user::{ZkRegisterPayload, ZkUser},
};

pub async fn zk_register_user<C>(
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

        tracing::warn!("❌ Register validation error: {:?}", details);

        ServerError::BadRequest {
            message: "Invalid input".to_string(),
            details,
        }
    })?;

    // Check if the user already exists
    let exists = db
        .query("SELECT * FROM user WHERE name = $name")
        .bind(("name", payload.name.clone()))
        .await?
        .take::<Option<serde_json::Value>>(0)?;

    if exists.is_some() {
        return Err(ServerError::BadRequest {
            message: "User already exists".into(),
            details: vec![],
        });
    }

    let created: Option<ZkUser> = db
        .create("zkuser")
        .content(json!({
            "name": payload.name,
            "salt": payload.salt.to_string(),
            "commitment": payload.commitment.to_string(),
        }))
        .await
        .map_err(|e| ServerError::Db(e.to_string()))?;
    info!("created {:?}", created.as_ref().unwrap());
    created.ok_or(ServerError::NoRecordCreated)
}
