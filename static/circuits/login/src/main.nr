fn main(
    username: Field,
    password: Field,
    salt: Field,
    // challenge: Field,
    commitment: pub Field,
    // challenge_hash: pub Field,
) {
    // 1. Calculate hash with salt
    let password_hash = std::hash::poseidon::bn254::hash_2([password, salt]);

    // 2. Calculate commitment
    let computed_commitment = std::hash::poseidon::bn254::hash_2([username, password_hash]);

    // 3. Check if calculated commitment matches the one from db
    assert(computed_commitment == commitment);

    // 4. Make sure challenge is in the proof
    // let expected_challenge_hash = std::hash::poseidon::bn254::hash_2([challenge, challenge]);

    // assert(expected_challenge_hash == challenge_hash);
}
