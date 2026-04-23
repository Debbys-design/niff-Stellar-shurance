# Design: Configurable Indexer Batch Size

## Overview

`INDEXER_BATCH_SIZE` is read once at startup by `resolveBatchSize()` in
`backend/src/indexer/indexer.service.ts`. The value is validated (1–100) and
stored on the service instance. The ledger fetch loop passes it directly to the
RPC call.

## Key decisions

| Decision | Rationale |
|---|---|
| Validate at startup, not per-call | Fail fast; avoids silent misconfiguration mid-run |
| Max 100 | Soroban RPC `getLedgers` practical limit; larger windows risk timeouts |
| Default 10 | Balances RPC call frequency vs. per-call latency for normal operation |
| Average duration metric | Simple running average; no external dependency; sufficient for tuning |

## Metric exposure

`IndexerService.getAverageBatchDurationMs()` returns the running average.
Wire it to a Prometheus gauge in the metrics module:

```ts
// In your Prometheus metrics setup:
new Gauge({
  name: 'indexer_batch_duration_ms_avg',
  help: 'Average ledger batch processing time in milliseconds',
  collect() { this.set(indexerService.getAverageBatchDurationMs()); },
});
```

## Sequence

```
startup
  └─ resolveBatchSize()  → validates env var, throws on invalid
  └─ IndexerService.batchSize = N

indexer loop
  └─ processBatch(fromLedger, fetchFn)
       └─ fetchFn(fromLedger, batchSize)  → 1 RPC call
       └─ processLedgers(results)
       └─ recordBatchDuration(elapsed)
       └─ return fromLedger + results.length
```
