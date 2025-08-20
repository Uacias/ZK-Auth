use poseidon::poseidon::bn254::hash_2;

// Final ZK Authentication Circuit with Nonce Protection
// Proves: "I know the password for user_id with salt + nonce"
// Without revealing the password! Prevents proof replay attacks.
fn main(
    password: Field,           // Private: user's password (never revealed)
    salt: pub Field,          // Public: unique salt for this user
    user_id: pub Field,       // Public: user identifier
    nonce: pub Field,         // Public: challenge nonce (prevents replay)
    expected_hash: pub Field  // Public: stored password hash (with nonce)
) {
    // Multi-layer Poseidon hashing for maximum security
    // Layer 1: Hash password with salt
    let password_salt_hash = hash_2([password, salt]);
    
    // Layer 2: Hash with nonce (prevents proof replay attacks)
    let nonce_hash = hash_2([password_salt_hash, nonce]);
    
    // Layer 3: Hash with user_id (prevents cross-user attacks)
    let final_hash = hash_2([nonce_hash, user_id]);
    
    // Verify the computed hash matches expected
    assert(final_hash == expected_hash);
}
