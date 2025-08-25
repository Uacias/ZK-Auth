use poseidon::poseidon::bn254::hash_2;

// Simple ZK Auth Circuit - strings limited to 15 chars for easy BigInt conversion
fn main(
    password: Field,      // Private: user's password as BigInt
    username: pub Field,  // Public: username as BigInt  
    salt: pub Field,      // Public: unique salt as BigInt
    expected_hash: pub Field // Public: expected hash result
) {
    // Hash password with salt first
    let password_salt_hash = hash_2([password, salt]);
    
    // Then hash with username
    let final_hash = hash_2([password_salt_hash, username]);
    
    // Verify the computed hash matches expected
    assert(final_hash == expected_hash);
}
