# Local Development

## Backend

1. Create a Python virtual environment.
2. Install dependencies from `services/api/requirements.txt`.
3. Copy `.env.example` to `.env`.
4. Run `uvicorn app.main:app --reload` from `services/api`.

## Frontend

1. Install dependencies in `apps/web`.
2. Run `npm run dev`.

## Current Status

This repository currently provides the initial scaffold only. Procurement cases, uploads, extraction workflows and reports are planned next.
