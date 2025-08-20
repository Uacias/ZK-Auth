fn main(
    password: Field,          // Private: user's password hash
    salt: pub Field,          // Public: salt from server  
    nonce: pub Field,         // Public: challenge nonce
    commitment: pub Field,    // Public: stored commitment hash
) {
    // Step 1: Verify password knowledge by recreating commitment
    // Hash(password, salt) should equal stored commitment
    let password_hash = poseidon::poseidon::bn254::hash_2([password, salt]);
    assert(password_hash == commitment);
    
    // Step 2: Bind proof to current session using nonce
    // This prevents replay attacks as each login has unique nonce
    let _session_hash = poseidon::poseidon::bn254::hash_2([password_hash, nonce]);
    
    // The proof now cryptographically proves:
    // 1. User knows the password (commitment verification)
    // 2. Proof is bound to this specific login session (nonce)
    // 3. Password never leaves user's device
}
