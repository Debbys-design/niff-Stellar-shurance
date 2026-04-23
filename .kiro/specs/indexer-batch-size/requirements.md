# Requirements: Configurable Indexer Batch Size

## Problem

A fixed ledger fetch window in the indexer may be too large during catch-up
(causing RPC timeouts) or too small during normal operation (causing excessive
RPC calls and rate-limit exhaustion). Operators need to tune this without a
code change or redeployment.

## Requirements

### R1 — Environment variable

The indexer SHALL read `INDEXER_BATCH_SIZE` from the process environment.

- Default: `10`
- Minimum: `1`
- Maximum: `100`
- If the value is outside `[1, 100]` or is not a valid integer, the process
  SHALL throw a configuration error at startup.

### R2 — Batch loop

The ledger fetch loop SHALL request exactly `INDEXER_BATCH_SIZE` ledgers per
RPC call. Each call consumes one RPC request regardless of batch size.

### R3 — Metric

The indexer SHALL track average batch processing time (ms) and expose it as:
- A structured log entry at `info` level after each batch.
- A Prometheus-compatible gauge `indexer_batch_duration_ms_avg` when a metrics
  endpoint is available.

### R4 — Runbook

`docs/indexer-runbook.md` SHALL document:
- Default and boundary values.
- Impact of batch size on RPC rate-limit consumption.
- A decision tree for tuning based on observed metrics.

## Acceptance Criteria

- [ ] `INDEXER_BATCH_SIZE=5` causes the loop to fetch 5 ledgers per call.
- [ ] `INDEXER_BATCH_SIZE=0` causes startup to fail with a clear error.
- [ ] `INDEXER_BATCH_SIZE=101` causes startup to fail with a clear error.
- [ ] Average batch duration metric is visible in staging Prometheus scrape.
- [ ] Runbook includes a decision tree.
