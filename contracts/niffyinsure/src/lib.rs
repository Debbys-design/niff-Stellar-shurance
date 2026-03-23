#![no_std]
#![allow(dead_code)] // stub modules; removed once domain features are implemented

mod claim;
mod policy;
mod premium;
mod storage;
mod token;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct NiffyInsure;

/// Entry-point contract.
///
/// Method stubs are intentionally minimal; each domain module
/// (policy, claim, token) will attach its implementation here
/// without renaming these symbols or changing the deployed contract ID.
#[contractimpl]
impl NiffyInsure {
    /// One-time initialisation: store admin and token contract address.
    /// Must be called immediately after deployment.
    pub fn initialize(env: Env, admin: Address, token: Address) {
        storage::set_admin(&env, &admin);
        storage::set_token(&env, &token);
    }

    // ── Policy domain ────────────────────────────────────────────────────
    // policy::generate_premium, policy::initiate_policy,
    // policy::renew_policy, policy::terminate_policy  →  policy.rs

    // ── Claim domain ─────────────────────────────────────────────────────
    // claim::file_claim, claim::vote_on_claim  →  claim.rs

    // ── Admin / treasury ─────────────────────────────────────────────────
    // token::drain  →  token.rs
}
