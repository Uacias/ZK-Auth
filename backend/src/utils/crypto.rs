use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
};
use password_hash::rand_core::OsRng;

// BN254 field modulus is too large for u128, so we use string conversion and validation
const MAX_STRING_CHARS: usize = 30;

pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| format!("Hashing error: {}", e))
}

pub fn verify_password(password: &str, hashed: &str) -> Result<bool, String> {
    let parsed_hash =
        PasswordHash::new(hashed).map_err(|e| format!("Failed to parse hash: {}", e))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

pub fn string_to_field(s: &str) -> Result<u128, String> {
    if s.len() > MAX_STRING_CHARS {
        return Err(format!(
            "String too long! Maximum supported length: {} characters. Your string: '{}' ({} chars)",
            MAX_STRING_CHARS, s, s.len()
        ));
    }
    
    let mut result = 0u128;
    for byte in s.bytes() {
        result = result.checked_mul(256)
            .ok_or("String too long for BN254 field")?
            .checked_add(byte as u128)
            .ok_or("String too long for BN254 field")?;
    }
    
    Ok(result)
}
