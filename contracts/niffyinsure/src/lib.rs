#![no_std]

mod claim;
mod policy;
mod policy_lifecycle;
#[allow(dead_code)] // used by policy.rs once feat/policy-lifecycle lands
mod premium;
mod storage;
mod token;
pub mod types;
pub mod validate;

use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct NiffyInsure;

#[contractimpl]
impl NiffyInsure {
    /// One-time initialisation: store admin and token contract address.
    /// Must be called immediately after deployment.
    pub fn initialize(env: Env, admin: Address, token: Address) {
        storage::set_admin(&env, &admin);
        storage::set_token(&env, &token);
    }

    /// Pure quote path: reads config and computes premium only.
    /// This entrypoint intentionally performs no persistent writes.
    pub fn generate_premium(
        env: Env,
        policy_type: types::PolicyType,
        region: types::RegionTier,
        age: u32,
        risk_score: u32,
        include_breakdown: bool,
    ) -> Result<types::PremiumQuote, policy::QuoteError> {
        policy::generate_premium(
            &env,
            policy_type,
            region,
            age,
            risk_score,
            include_breakdown,
        )
    }

    /// Converts quote failure codes to support-friendly messages for API layers.
    pub fn quote_error_message(env: Env, code: u32) -> policy::QuoteFailure {
        let err = match code {
            1 => policy::QuoteError::InvalidAge,
            2 => policy::QuoteError::InvalidRiskScore,
            3 => policy::QuoteError::InvalidQuoteTtl,
            _ => policy::QuoteError::ArithmeticOverflow,
        };
        policy::map_quote_error(&env, err)
    }

    /// Read-only helper for monitoring state in tests / ops tooling.
    pub fn get_claim_counter(env: Env) -> u64 {
        storage::get_claim_counter(&env)
    }

    /// Read-only helper for monitoring state in tests / ops tooling.
    pub fn get_policy_counter(env: Env, holder: Address) -> u32 {
        storage::get_policy_counter(&env, &holder)
    }

    /// Read-only helper for monitoring state in tests / ops tooling.
    pub fn has_policy(env: Env, holder: Address, policy_id: u32) -> bool {
        storage::has_policy(&env, &holder, policy_id)
    }

    /// Bind a new policy (holder-auth). Premium settlement is a separate financial flow.
    pub fn initiate_policy(
        env: Env,
        holder: Address,
        policy_type: types::PolicyType,
        region: types::RegionTier,
        coverage: i128,
        premium: i128,
        term_ledgers: u32,
    ) -> Result<u32, policy_lifecycle::PolicyError> {
        policy_lifecycle::initiate_policy(
            &env,
            holder,
            policy_type,
            region,
            coverage,
            premium,
            term_ledgers,
        )
    }

    /// Holder early-terminates; blocked while non-terminal claims are open.
    pub fn terminate_policy(
        env: Env,
        holder: Address,
        policy_id: u32,
        reason: types::TerminationReason,
    ) -> Result<(), policy_lifecycle::PolicyError> {
        policy_lifecycle::terminate_policy(&env, holder, policy_id, reason)
    }

    /// Admin termination with optional bypass of the open-claim guard (audited on-chain).
    pub fn admin_terminate_policy(
        env: Env,
        admin: Address,
        holder: Address,
        policy_id: u32,
        reason: types::TerminationReason,
        allow_open_claims: bool,
    ) -> Result<(), policy_lifecycle::PolicyError> {
        policy_lifecycle::admin_terminate_policy(
            &env,
            admin,
            holder,
            policy_id,
            reason,
            allow_open_claims,
        )
    }

    /// Admin-only: set pending (non-terminal) claim count for a policy. Used until
    /// `file_claim` maintains this counter automatically; enables tests and rare ops.
    pub fn admin_set_open_claim_count(
        env: Env,
        admin: Address,
        holder: Address,
        policy_id: u32,
        count: u32,
    ) -> Result<(), policy_lifecycle::PolicyError> {
        admin.require_auth();
        if admin != storage::get_admin(&env) {
            return Err(policy_lifecycle::PolicyError::Unauthorized);
        }
        storage::set_open_claim_count(&env, &holder, policy_id, count);
        Ok(())
    }

    /// Full policy record for indexers (remains available after termination).
    pub fn get_policy(env: Env, holder: Address, policy_id: u32) -> Option<types::Policy> {
        storage::get_policy(&env, &holder, policy_id)
    }

    pub fn voter_registry_contains(env: Env, holder: Address) -> bool {
        storage::voters_contains(&env, &holder)
    }

    pub fn voter_registry_len(env: Env) -> u32 {
        storage::voters_len(&env)
    }

    pub fn holder_active_policy_count(env: Env, holder: Address) -> u32 {
        storage::get_holder_active_policy_count(&env, &holder)
    }

    // ── Policy domain ────────────────────────────────────────────────────
    // renew_policy — future

    // ── Claim domain ─────────────────────────────────────────────────────
    // file_claim, vote_on_claim
    // implemented in claim.rs — issue: feat/claim-voting

    // ── Admin / treasury ─────────────────────────────────────────────────
    // drain
    // implemented in token.rs — issue: feat/admin
}
