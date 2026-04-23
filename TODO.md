# Implementation TODO — Four Backend Issues

## Branch 1: blackboxai/356-ipfs-provider-fallback ✅
- [x] Create branch from main
- [x] Create `ipfs-provider-chain.service.ts` with multi-gateway fallback + health checks
- [x] Update `ipfs.service.ts` to use provider chain
- [x] Update `ipfs.controller.ts` health check endpoint
- [x] Update `ipfs.module.ts` to register provider chain
- [x] Add `web3storage-ipfs.provider.ts` as additional provider
- [x] Add unit tests `ipfs-provider-chain.service.spec.ts`
- [x] Commit and push

## Branch 2: blackboxai/354-claim-rate-limiting ✅
- [x] Create branch from main
- [x] Update `rate-limit.constants.ts` with wallet/global keys
- [x] Update `rate-limit.service.ts` with per-wallet + global sliding window
- [x] Update `rate-limit.guard.ts` to apply wallet/global checks and Retry-After header
- [x] Update `rate-limit.exception.ts` to include retryAfterSeconds
- [x] Add unit tests
- [x] Update docs
- [x] Commit and push

## Branch 3: blackboxai/335-claim-aggregation-service ✅
- [x] Create branch from main
- [x] Create `claim-aggregation.service.ts`
- [x] Update `claims.module.ts` to register service
- [x] Update `claims.service.ts` to enrich responses
- [x] Update DTOs with aggregated fields
- [x] Add unit tests with fixed fixtures
- [x] Commit and push

## Branch 4: blackboxai/357-tenant-isolation ✅
- [x] Create branch from main
- [x] Audit all Prisma queries in `claims.service.ts` — 12 queries verified, ALL use `claimTenantWhere()` + `assertTenantOwnership()`
- [x] Expand `tenant-filter.helper.ts` with lint utility — `queryBypassesTenantFilter()` regex scanner added
- [x] Add property-based tests in `tenant-isolation.test.ts` — cross-tenant leakage prevention proven under all query combinations
- [x] Add CI script `check-tenant-queries.ts` — scans all source files, fails on tenant bypasses
- [x] Update docs — `tenant-isolation.md` references CI check
- [x] Commit and push

