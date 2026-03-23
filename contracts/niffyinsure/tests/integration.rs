#![cfg(test)]

use niffyinsure::NiffyInsureClient;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn initialize_stores_admin_and_token() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(niffyinsure::NiffyInsure, ());
    let client = NiffyInsureClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin, &token);
    // If initialize panics or the contract ID is wrong the test fails.
    // Deeper state assertions are added per-module as features land.
}
