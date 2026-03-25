use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::Policy;

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    /// (holder, policy_id) — policy_id is per-holder u32
    Policy(Address, u32),
    /// Per-holder policy counter; next policy_id = counter + 1
    PolicyCounter(Address),
    /// Active in-force policies per holder (denormalized for voter registry).
    HolderActivePolicyCount(Address),
    /// Non-terminal claims filed against this policy (claim module maintains).
    OpenClaimCount(Address, u32),
    Claim(u64),
    /// (claim_id, voter_address) → VoteOption
    Vote(u64, Address),
    /// Addresses that hold at least one active policy (voter membership).
    Voters,
    /// Global monotonic claim id counter
    ClaimCounter,
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

/// Used by claim payout (feat/claim-voting).
#[allow(dead_code)]
pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn get_policy(env: &Env, holder: &Address, policy_id: u32) -> Option<Policy> {
    env.storage()
        .persistent()
        .get(&DataKey::Policy(holder.clone(), policy_id))
}

pub fn set_policy(env: &Env, policy: &Policy) {
    env.storage().persistent().set(
        &DataKey::Policy(policy.holder.clone(), policy.policy_id),
        policy,
    );
}

pub fn next_policy_id(env: &Env, holder: &Address) -> u32 {
    let key = DataKey::PolicyCounter(holder.clone());
    let next: u32 = env.storage().persistent().get(&key).unwrap_or(0) + 1;
    env.storage().persistent().set(&key, &next);
    next
}

pub fn get_holder_active_policy_count(env: &Env, holder: &Address) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::HolderActivePolicyCount(holder.clone()))
        .unwrap_or(0u32)
}

fn set_holder_active_policy_count(env: &Env, holder: &Address, count: u32) {
    env.storage()
        .persistent()
        .set(&DataKey::HolderActivePolicyCount(holder.clone()), &count);
}

pub fn increment_holder_active_policies(env: &Env, holder: &Address) {
    let c = get_holder_active_policy_count(env, holder);
    set_holder_active_policy_count(env, holder, c + 1);
}

pub fn decrement_holder_active_policies(env: &Env, holder: &Address) {
    let c = get_holder_active_policy_count(env, holder);
    set_holder_active_policy_count(env, holder, c.saturating_sub(1));
}

pub fn get_open_claim_count(env: &Env, holder: &Address, policy_id: u32) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::OpenClaimCount(holder.clone(), policy_id))
        .unwrap_or(0u32)
}

pub fn set_open_claim_count(env: &Env, holder: &Address, policy_id: u32, count: u32) {
    env.storage()
        .persistent()
        .set(&DataKey::OpenClaimCount(holder.clone(), policy_id), &count);
}

pub fn voters_ensure_holder(env: &Env, holder: &Address) {
    let old: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::Voters)
        .unwrap_or_else(|| Vec::new(env));

    let len = old.len();
    let mut i = 0u32;
    while i < len {
        if old.get(i).unwrap() == *holder {
            return;
        }
        i += 1;
    }

    let mut new_v = Vec::new(env);
    i = 0;
    while i < len {
        new_v.push_back(old.get(i).unwrap());
        i += 1;
    }
    new_v.push_back(holder.clone());
    env.storage().instance().set(&DataKey::Voters, &new_v);
}

pub fn voters_remove_holder(env: &Env, holder: &Address) {
    let old: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::Voters)
        .unwrap_or_else(|| Vec::new(env));
    let len = old.len();
    let mut new_v = Vec::new(env);
    let mut i = 0u32;
    while i < len {
        let a = old.get(i).unwrap();
        if a != *holder {
            new_v.push_back(a);
        }
        i += 1;
    }
    env.storage().instance().set(&DataKey::Voters, &new_v);
}

pub fn voters_len(env: &Env) -> u32 {
    let v: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::Voters)
        .unwrap_or_else(|| Vec::new(env));
    v.len()
}

pub fn voters_contains(env: &Env, holder: &Address) -> bool {
    let v: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::Voters)
        .unwrap_or_else(|| Vec::new(env));
    let len = v.len();
    let mut i = 0u32;
    while i < len {
        if v.get(i).unwrap() == *holder {
            return true;
        }
        i += 1;
    }
    false
}

/// Returns the next global claim_id and increments the counter.
/// Used by feat/claim-voting.
#[allow(dead_code)]
pub fn next_claim_id(env: &Env) -> u64 {
    let next: u64 = env
        .storage()
        .instance()
        .get(&DataKey::ClaimCounter)
        .unwrap_or(0u64)
        + 1;
    env.storage().instance().set(&DataKey::ClaimCounter, &next);
    next
}

pub fn get_claim_counter(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::ClaimCounter)
        .unwrap_or(0u64)
}

pub fn get_policy_counter(env: &Env, holder: &Address) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::PolicyCounter(holder.clone()))
        .unwrap_or(0u32)
}

pub fn has_policy(env: &Env, holder: &Address, policy_id: u32) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Policy(holder.clone(), policy_id))
}
