use crate::types::PolicyType;

/// Base annual premium in stroops (1 XLM = 10_000_000 stroops).
const BASE: i128 = 10_000_000;

/// Returns the annual premium for the given risk profile.
pub fn compute_premium(
    policy_type: &PolicyType,
    age: u32,
    risk_score: u32, // 1–10; higher = riskier
) -> i128 {
    let type_factor = match policy_type {
        PolicyType::Auto => 15,
        PolicyType::Health => 20,
        PolicyType::Property => 10,
    };
    let age_factor = if age < 25 {
        15
    } else if age > 60 {
        13
    } else {
        10
    };
    BASE * (type_factor + age_factor + risk_score as i128) / 10
}
