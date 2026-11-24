# ProcureAI

ProcureAI is a local-first procurement quote comparison platform scaffold designed for AI-assisted supplier quotation extraction, product matching, deterministic price comparison, and human review.

## Repository Structure

- `apps/web` - Next.js frontend shell
- `services/api` - FastAPI backend shell
- `services/worker` - background worker placeholder
- `packages/domain` - shared domain models and enums
- `packages/quote-rules` - deterministic comparison rule package placeholder
- `tests/fixtures` - synthetic test fixtures placeholder
- `docs` - architecture and local development documentation
- `infra` - Terraform scaffolding placeholder

## Local-First MVP Scope

This scaffold establishes:

- backend API health endpoint
- typed procurement domain models
- frontend dashboard shell
- environment template for Gemini-only AI integration
- local-first project structure aligned with future Google Cloud deployment boundaries

## Planned Next Steps

1. Implement case creation and dashboard APIs.
2. Add secure multi-supplier upload flow.
3. Introduce Gemini extraction orchestration and structured validation.
4. Add deterministic comparison logic using decimal arithmetic.
5. Build review, approval, export and audit workflows.
