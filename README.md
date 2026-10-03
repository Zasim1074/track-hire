# TrackHire 🚀

TrackHire is a full-stack job platform with a React frontend and a FastAPI backend for candidate, recruiter, and company workflows.

## Overview

TrackHire brings job discovery and recruiting workflows together. Candidates can browse and save openings, submit applications, and manage their profile. Recruiters can publish jobs and work with applications. The repository contains a frontend currently backed by Clerk and Supabase, plus a separate FastAPI API backed by PostgreSQL; frontend services have not yet been migrated to that API.

The project is an evolving portfolio application for practicing full-stack development and backend architecture. It is under active development.

## Project Status

### Implemented

- [x] React/Vite job browsing, job detail, saved jobs, onboarding, job posting, and candidate/recruiter views
- [x] Frontend authentication through Clerk and data/storage access through Supabase
- [x] FastAPI API with registration/login, JWT bearer authentication, and role/access checks
- [x] SQLAlchemy models and PostgreSQL session configuration
- [x] Alembic migration history
- [x] API workflows for companies, company membership, jobs, applications, candidate profiles, resumes, interviews, and interview feedback
- [x] Service and repository modules for domain operations
- [x] Request/response schemas, pagination parameters, and centralized exception handlers
- [x] Vercel frontend rewrite configuration

### Not yet implemented or not present in this repository

- [ ] Frontend integration with the FastAPI API (the frontend currently calls Supabase directly)
- [ ] Automated test suite (no test files are present)
- [ ] Docker or Compose setup
- [ ] Backend deployment configuration
- [ ] Unified production deployment and CI/CD configuration

## Features

### Frontend workflows

- Browse jobs and filter by title, location, and company
- View job details and apply with a resume
- Save jobs and view applied or posted jobs
- Post jobs and manage hiring status
- Sign-in and onboarding flows with protected routes

The current frontend obtains its authentication from Clerk and reads/writes job, company, application, and file data through Supabase. Its workflow is distinct from the FastAPI API at present.

### FastAPI backend

- Register and log in users; issue JWT access tokens and resolve the current user
- Enforce candidate, recruiter/company membership, and administrator access rules in API workflows
- Create, list, update, publish, close, and delete jobs; filter and paginate job listings
- Manage companies and company memberships
- Submit, list, update, withdraw, select, and reject applications, with status history
- Create and manage candidate profiles and resumes
- Schedule and manage interviews and interview feedback

The backend includes admin authorization checks in relevant workflows. There is no separate admin dashboard in the frontend.

## Architecture

The repository currently contains two application paths:

```text
Current frontend data path
React + Vite ── Clerk authentication
      └──────── Supabase database and storage

Backend API path
HTTP client ── FastAPI routers ── Services ── Repositories ── SQLAlchemy ── PostgreSQL
```

The backend has API, service, repository, model, and schema modules. Alembic manages its schema migrations. The frontend's Supabase integration is not an HTTP integration with the FastAPI backend, so the two paths should not be read as one connected runtime flow.

## Tech Stack

| Layer | Technology | Use |
| --- | --- | --- |
| Frontend | React 18, JavaScript, Vite | Single-page application and build tooling |
| Routing | React Router | Client-side routes and protected pages |
| UI | Tailwind CSS, Radix UI components | Styling and interface primitives |
| Frontend authentication | Clerk | User sign-in and session handling |
| Frontend data and files | Supabase JS | Database queries and object storage |
| Backend | Python, FastAPI | REST API and generated OpenAPI documentation |
| Validation/configuration | Pydantic v2, Pydantic Settings | API schemas and environment configuration |
| ORM/database | SQLAlchemy 2.0, PostgreSQL, psycopg 3 | Relational persistence |
| Migrations | Alembic | Backend database schema evolution |
| Backend authentication | JWT (`python-jose`), Passlib/bcrypt | Bearer tokens and password hashing |
| Backend tests | Pytest, pytest-asyncio installed | Test tooling is installed; no test suite is present yet |
| Frontend hosting config | Vercel (`frontend/vercel.json`) | SPA route rewrites; no deployment URL is verified here |

TypeScript is not currently used in the frontend source; the application files are `.jsx` and `.js`.

## Repository Structure

```text
track-hire/
├── README.md
├── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
└── backend/
    ├── app/
    │   ├── api/
    │   ├── core/
    │   ├── db/
    │   ├── models/
    │   ├── repositories/
    │   ├── schemas/
    │   └── services/
    ├── alembic/
    │   └── versions/
    ├── alembic.ini
    └── requirements.txt
```

`frontend/` is part of this repository as a regular directory, not a Git submodule. The root `.gitignore` excludes `node_modules/` and macOS `.DS_Store` files, so installed dependencies and local OS metadata are not committed.

There are no frontend or backend `.env.example` files in their subdirectories; the root `.env.example` contains both sets of variable names.

## Local Development

### Prerequisites

- Git
- Node.js and npm
- Python with `venv` and pip
- PostgreSQL for the backend
- Clerk and Supabase projects/credentials for the current frontend

### Backend

The backend settings load `.env` relative to the current working directory. Run backend commands from `backend/`.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` using the variables in the root `.env.example`, and set a working PostgreSQL connection and JWT settings. Then apply migrations and start the API:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

The API is served at `http://127.0.0.1:8000`; interactive Swagger documentation is at `http://127.0.0.1:8000/docs`.

### Frontend

In another terminal, from the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env` with the frontend variables from the root `.env.example`, then run:

```bash
npm run dev
```

The Vite server prints its local URL when it starts. Other available scripts are `npm run build`, `npm run preview`, and `npm run lint`.

## Environment Variables

The root `.env.example` lists the variables used by both applications. Put each application's values in its own local file: `backend/.env` and `frontend/.env`. Do not commit populated `.env` files.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Backend | SQLAlchemy PostgreSQL connection URL; use the `postgresql+psycopg://` driver form |
| `ALGORITHM` | Backend | JWT signing algorithm setting |
| `SECRET_KEY` | Backend | JWT signing secret; supply a private local/deployment value |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Access token lifetime |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Frontend | Supabase publishable key used by the browser client |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk publishable key |

The example file contains placeholders, not working credentials. Keep secret values private; frontend `VITE_` values are included in the browser bundle and should only be publishable credentials.

## Database and Migrations

The backend uses SQLAlchemy models and Alembic revisions to manage PostgreSQL schema changes:

```text
SQLAlchemy models → Alembic revisions → PostgreSQL
```

From `backend/`, apply the checked-in migration history with:

```bash
alembic upgrade head
```

Alembic's configuration imports the application settings, so `backend/.env` and a reachable database are required. No migration autogeneration workflow is documented here; review the existing model and migration setup before creating revisions.

## API

The FastAPI application mounts routers under the following paths. Swagger UI and the generated OpenAPI schema are available at `/docs` and `/openapi.json` on the running server.

| Path prefix | Resource |
| --- | --- |
| `/auth` | Registration and login |
| `/api` | Jobs and applications |
| `/candidates` | Candidate profile |
| `/companies` | Companies and memberships |
| `/resumes` | Resume records and upload |
| `/users` | Current user |
| `/interviews` | Interviews and interview feedback |

Protected backend routes use JWT bearer authentication. Authorization checks use user roles and, for company workflows, company membership. The browser application currently uses Clerk and Supabase instead of these FastAPI endpoints.

## Testing and Quality

Pytest and pytest-asyncio are listed in `backend/requirements.txt`, but no test files or frontend test runner are present in the repository. There is therefore no implemented automated test suite or verified coverage to report.

Frontend quality commands:

```bash
cd frontend
npm run lint
npm run build
```

## Deployment

`frontend/vercel.json` configures Vercel rewrites for a single-page application. This is deployment configuration, but it does not by itself establish that the current frontend is deployed or identify a live URL. No backend hosting, database hosting, Docker, or CI/CD configuration is present in the repository. Backend deployment remains to be configured.

## Roadmap

### Foundation and integration

- [x] React/Vite frontend and FastAPI backend are present in one repository
- [ ] Connect frontend authentication and data workflows to the FastAPI API
- [ ] Define and document the intended relationship between Clerk/Supabase and the backend identity/data model

### Job and application workflows

- [x] Frontend job discovery, posting, saved-job, and application screens using Supabase
- [x] Backend job, company, application, resume, and candidate-profile API modules
- [x] Backend interview scheduling and feedback modules
- [ ] Add frontend flows for backend-only capabilities where intended

### Quality and operations

- [ ] Add backend unit and API tests
- [ ] Add frontend tests
- [ ] Add backend deployment configuration
- [ ] Add CI/CD and containerization if needed

## Engineering Decisions

- **FastAPI** provides typed route declarations, dependency injection, and generated OpenAPI documentation for the backend API.
- **PostgreSQL and SQLAlchemy** provide relational persistence for the backend domain, with session management in `app/db` and model definitions in `app/models`.
- **Alembic** keeps backend schema changes in versioned migration files.
- **Service/repository separation** places workflow logic in `app/services` and persistence operations in `app/repositories`, with routers focused on HTTP handling.
- **JWT and password hashing** support the backend's bearer-token login flow. The frontend currently uses Clerk separately; identity has not yet been unified across the two application paths.
- **Clerk and Supabase** remain in the frontend because its current sign-in, database query, and storage code actively depends on them.

## Development Philosophy

TrackHire is developed incrementally, with implementation guided by explicit requirements and followed by review, refactoring, testing, and documentation:

```text
Requirement → Design → Implementation → Review → Refactoring → Testing → Documentation
```

## Author

**Jaseem Quraishi**

- [Portfolio](https://jaseem-codes.vercel.app)
- [LinkedIn](https://www.linkedin.com/in/jaseem-quraishi/)
- [GitHub](https://github.com/zasim1074)
