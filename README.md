# TrackHire

TrackHire is a job search and recruiting application built with React, FastAPI, and PostgreSQL. The browser client uses the FastAPI API for authentication and data access.

## Features

### Candidates

- Register and sign in with email and password.
- Browse and filter published jobs.
- Save jobs, apply to different postings with a resume and cover letter, and track application status/history. Duplicate applications to the same posting are blocked.
- Manage a candidate profile, upload or remove privately stored resumes, choose a default resume, download files, and change account passwords.
- View interview details and feedback.

### Recruiters

- Register as an HR user, create a company, and receive owner membership.
- Create, edit, publish, close, and delete company jobs.
- Review applicants and their resumes, move applications through review states, and schedule/manage interviews with feedback.

Authentication uses signed JWT bearer tokens issued by FastAPI. API permissions use user roles and company membership. Admin authorization exists in the API, but the frontend does not include an admin dashboard.

## Architecture

```text
React + Vite ── HTTP + JWT ── FastAPI routers ── services ── repositories
                                                   └── SQLAlchemy ── PostgreSQL
```

Resume files are stored outside the public web root under `RESUME_STORAGE_PATH`; the API validates the extension, MIME type, file signature, and size, then checks ownership or application access before serving downloads. Alembic manages database changes.

## Repository layout

- `frontend/` — React/Vite application, API clients, and Vitest/Testing Library tests.
- `backend/app/` — FastAPI routes, schemas, services, repositories, models, and configuration.
- `backend/alembic/` — database migration history.
- `backend/tests/` — PostgreSQL-backed API workflow tests.

## Local development

### Backend

Use Python 3.10 or newer and PostgreSQL. From `backend/`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example` and configure `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`, and `RESUME_STORAGE_PATH`. Then run:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

The API defaults to `http://localhost:8000`; interactive documentation is available at `/docs`.

### Frontend

Use Node.js and npm. Create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:8000`, then from `frontend/`:

```bash
npm install
npm run dev
```

The Vite server defaults to `http://localhost:5173`. The backend CORS configuration allows this local origin.

## Configuration

| Variable | Application | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Backend | PostgreSQL connection string using the `postgresql+psycopg://` driver |
| `TEST_DATABASE_URL` | Backend tests | Dedicated test database URL; tests reject non-test database names |
| `SECRET_KEY` | Backend | Private JWT signing key |
| `ALGORITHM` | Backend | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Access token lifetime |
| `CORS_ORIGINS` | Backend | Comma-separated browser origins allowed to call the API |
| `RESUME_STORAGE_PATH` | Backend | Private persistent directory for resume objects |
| `ENVIRONMENT` | Backend | Deployment environment name |
| `VITE_API_BASE_URL` | Frontend | FastAPI base URL (required for production builds) |

Do not commit populated environment files. Frontend `VITE_` variables are public in the browser bundle and must not contain secrets.

## API overview

- `/auth` — registration and login.
- `/users` — current authenticated user.
- `/api` — job and application workflows.
- `/api/saved-jobs` — candidate saved jobs.
- `/candidates` — candidate profiles.
- `/companies` — companies and memberships.
- `/resumes` — resume records, uploads, and authorized downloads.
- `/interviews` — interviews and feedback.
- `/health` — process liveness; `/ready` — database readiness.

## Checks

Backend tests require a dedicated PostgreSQL database and `TEST_DATABASE_URL` in `backend/.env`:

```bash
cd backend
pytest -v
```

Frontend checks:

```bash
cd frontend
npm test
npm run build
npm run lint
```

### Local demo data

After applying migrations, populate the local database without deleting existing records:

```bash
cd backend
.venv/bin/python scripts/seed_demo_data.py
```

The repeatable seed creates 8 companies, 48 published jobs, 8 candidates, default resumes, applications, saved jobs, and interviews. Demo credentials are printed when it completes.

## Deployment

The repository includes Vercel SPA rewrite configuration for the frontend. Backend hosting, production database hosting, persistent private file storage, TLS, backups, email delivery, monitoring, and CI/CD must be configured by the deployment environment. Run `alembic upgrade head` before starting a new release. The project intentionally does not require Docker.

See [`docs/production-readiness-audit.md`](docs/production-readiness-audit.md) for the capability map, verified improvements, and remaining release blockers.
