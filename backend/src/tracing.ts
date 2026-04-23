/**
 * OpenTelemetry SDK bootstrap.
 * MUST be imported as the very first statement in the process entry-point
 * (before NestJS / Express / Prisma are loaded) so auto-instrumentation
 * patches can wrap the modules at require-time.
 *
 * Usage in main.ts / index.ts:
 *   import './tracing';
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor, NoopSpanExporter } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const SAMPLE_RATE = parseFloat(process.env.OTEL_SAMPLE_RATE ?? '1.0');

const exporter = OTLP_ENDPOINT
  ? new OTLPTraceExporter({ url: `${OTLP_ENDPOINT}/v1/traces` })
  : new NoopSpanExporter();

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'niffyinsure-backend',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
  }),
  spanProcessor: new SimpleSpanProcessor(exporter),
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(SAMPLE_RATE),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy fs instrumentation; keep HTTP, pg, redis
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
