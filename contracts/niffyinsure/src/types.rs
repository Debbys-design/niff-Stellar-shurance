use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone)]
pub enum PolicyType {
    Auto,
    Health,
    Property,
}

#[contracttype]
#[derive(Clone)]
pub enum ClaimStatus {
    Processing,
    Approved,
    Rejected,
}

#[contracttype]
#[derive(Clone)]
pub enum VoteOption {
    Approve,
    Reject,
}

#[contracttype]
#[derive(Clone)]
pub struct Policy {
    pub holder: Address,
    pub policy_id: u64,
    pub policy_type: PolicyType,
    pub premium: i128,
    pub coverage: i128,
    pub is_active: bool,
    pub start_ledger: u32,
    pub end_ledger: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Claim {
    pub claim_id: u64,
    pub policy_id: u64,
    pub claimant: Address,
    pub amount: i128,
    pub details: String,
    pub image_urls: Vec<String>,
    pub status: ClaimStatus,
    pub approve_votes: u32,
    pub reject_votes: u32,
}
