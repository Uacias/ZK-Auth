fn main(password: u64, salt: pub u64, commitment: pub u64) {
    // Simple demo: verify password + salt equals commitment
    assert(password + salt == commitment);
}
