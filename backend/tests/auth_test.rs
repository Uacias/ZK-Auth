mod common;
use common::{random_string, spawn_test_server};

use reqwest::Client;
use serde_json::json;

mod auth_plain {
    use super::*;

    #[tokio::test]
    async fn test_register_endpoint() {
        let (base_url, _server_handle) = spawn_test_server().await;

        let client = Client::new();
        let random_name = random_string(10);
        let random_pass = random_string(15);

        let res = client
            .post(format!("{}/auth/register", base_url))
            .json(&json!({
                "name": random_name,
                "password": random_pass
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert!(res.status().is_success(), "Status: {}", res.status());
        let body: serde_json::Value = res.json().await.expect("Invalid JSON");
        println!("Register response: {:?}", body);
    }

    #[tokio::test]
    async fn test_login_endpoint() {
        let (base_url, _server_handle) = spawn_test_server().await;
        let client = Client::new();

        let random_name = random_string(10);
        let random_pass = random_string(15);

        let res = client
            .post(format!("{}/auth/register", base_url))
            .json(&json!({
                "name": random_name,
                "password": random_pass
            }))
            .send()
            .await
            .expect("Failed to send register request");

        assert!(
            res.status().is_success(),
            "Register failed: {}",
            res.status()
        );

        let res = client
            .post(format!("{}/auth/login", base_url))
            .json(&json!({
                "name": random_name,
                "password": random_pass
            }))
            .send()
            .await
            .expect("Failed to send login request");

        assert!(res.status().is_success(), "Login failed: {}", res.status());
        let body: serde_json::Value = res.json().await.expect("Invalid JSON");
        println!("Login response: {:?}", body);
    }
}
