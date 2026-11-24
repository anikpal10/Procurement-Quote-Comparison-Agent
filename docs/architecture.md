# ProcureAI Local-First Architecture

## Principles

- Google Gemini is the only AI model used for document understanding, matching assistance and procurement insights.
- Financial arithmetic remains deterministic and will be implemented in Python using decimal-safe rules.
- Local development uses filesystem-backed artifacts and local service execution while preserving interfaces for future Google Cloud adapters.

## Initial Components

- frontend dashboard in `apps/web`
- backend API in `services/api`
- future worker runtime in `services/worker`
- shared schemas in `packages/domain`
- deterministic comparison rules in `packages/quote-rules`

## Planned Adapter Boundaries

- storage adapter: local filesystem now, Google Cloud Storage later
- task adapter: local job runner now, Cloud Tasks later
- audit sink: local structured events now, BigQuery later
