# niffyinsure — Soroban smart contract

Parametric insurance with DAO-governed claim resolution, compiled to WASM for Stellar Soroban.

## Prerequisites

| Tool | Version |
|------|---------|
| Rust (stable) | ≥ 1.81 (MSRV) |
| wasm32 target | `rustup target add wasm32-unknown-unknown` |
| Stellar CLI | ≥ 21 (`cargo install --locked stellar-cli`) |

Produced with **rustc 1.94.0 (stable, 2026-03-02)**.

## Build

```bash
# from repo root or contracts/niffyinsure/
cargo build --target wasm32-unknown-unknown --release

# artifact
target/wasm32-unknown-unknown/release/niffyinsure.wasm
```

Or via Makefile:

```bash
make build      # compile
make sha        # build + print SHA-256
```

## Test

```bash
cargo test
```

Tests run on the native target using `soroban-sdk`'s `testutils` feature.

## Deploy

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/niffyinsure.wasm \
  --network testnet \
  --source <ACCOUNT_SECRET_KEY>
```

Record the contract ID and the SHA-256 from `make sha` in your release notes so deployed binaries are traceable.

## Common failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `error[E0463]: can't find crate for std` | Missing wasm32 target | `rustup target add wasm32-unknown-unknown` |
| `soroban_sdk` version conflict | Mismatched SDK pin | Ensure `Cargo.lock` is committed and `=23.5.3` is pinned |
| `stellar contract deploy` fails | Wrong CLI version | `stellar --version` must be ≥ 21 |
| Tests fail with `no_std` errors | Running `cargo test --target wasm32` | Tests run on native; omit `--target` flag |

## Module map

```
src/
  lib.rs       # contract entry, initialize
  types.rs     # Policy, Claim, VoteOption, ClaimStatus
  storage.rs   # DataKey, typed read/write helpers
  premium.rs   # compute_premium (risk factors → stroops)
  policy.rs    # generate_premium, initiate, renew, terminate
  claim.rs     # file_claim, vote_on_claim
  token.rs     # token transfer wrapper
```
