# OpenTelemetry Tracing

## Overview

The backend uses the OpenTelemetry Node.js SDK (`@opentelemetry/sdk-node`) with OTLP HTTP export.
Auto-instrumentation covers HTTP (Express), PostgreSQL (via `pg`), and Redis out of the box.
A custom span wraps every Soroban RPC simulation call with `contractId`, `method`, and `network` attributes.
`x-request-id` is propagated as the `http.request_id` span attribute so traces correlate with structured logs.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | _(unset)_ | OTLP collector base URL. When unset, a no-op exporter is used — no spans are emitted. |
| `OTEL_SERVICE_NAME` | `niffyinsure-backend` | Service name tag on every span. |
| `OTEL_SAMPLE_RATE` | `1.0` | Fraction of traces to sample (0.0–1.0). Change without redeployment via env var. |

### Production sampling

Set `OTEL_SAMPLE_RATE=0.1` (10 %) for steady-state production traffic.
Raise to `1.0` temporarily during an incident by updating the env var and restarting the process.
No code change or redeploy is required.

## Local Jaeger Setup

Run the all-in-one Jaeger container (includes collector + UI):

```bash
docker run --rm -d \
  --name jaeger \
  -p 4318:4318 \   # OTLP HTTP receiver
  -p 16686:16686 \ # Jaeger UI
  jaegertracing/all-in-one:latest
```

Then set the following in your `.env.local`:

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SAMPLE_RATE=1.0
```

Open the Jaeger UI at **http://localhost:16686** and select the `niffyinsure-backend` service.

### docker-compose snippet

Add to `docker-compose.yml` for a persistent dev environment:

```yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  ports:
    - "4318:4318"   # OTLP HTTP
    - "16686:16686" # UI
```

## Trace Structure for a Quote Request

A single `POST /quote` request produces the following span tree:

```
POST /quote                          (HTTP auto-instrumentation)
  └─ prisma:query SELECT policies    (Prisma auto-instrumentation)
  └─ redis GET cache:quote:<key>     (Redis auto-instrumentation)
  └─ soroban.simulate generate_premium
       soroban.contract_id = C...
       soroban.method      = generate_premium
       stellar.network     = testnet
```

## Correlating Traces with Logs

Every request receives an `x-request-id` header (generated if absent).
The `RequestIdMiddleware` writes it to the active span as `http.request_id`.
Structured log entries should include `requestId` from `req.headers['x-request-id']`
so that a single trace ID links to all log lines for that request.
