use poseidon::poseidon::bn254::hash_2;

// Final ZK Authentication Circuit
// Proves: "I know the password for user_id with salt"
// Without revealing the password!
fn main(
    password: Field,           // Private: user's password (never revealed)
    salt: pub Field,          // Public: unique salt for this user
    user_id: pub Field,       // Public: user identifier
    expected_hash: pub Field  // Public: stored password hash
) {
    // Multi-layer Poseidon hashing for security
    // Layer 1: Hash password with salt
    let password_salt_hash = hash_2([password, salt]);
    
    // Layer 2: Hash with user_id for binding
    let final_hash = hash_2([password_salt_hash, user_id]);
    
    // Verify the computed hash matches expected
    assert(final_hash == expected_hash);
}
