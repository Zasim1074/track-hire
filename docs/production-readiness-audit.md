# TrackHire production-readiness audit

Audit date: 2026-11-20

## Product architecture

TrackHire is a modular monolith: a React/Vite client calls one FastAPI application, whose routers delegate business rules to services and persistence to SQLAlchemy repositories backed by PostgreSQL. Alembic owns schema evolution. This shape keeps transactions and authorization within one process and database without unnecessary distributed-system operations.

## Capability map

| Feature | Backend | Frontend | Automated tests | State |
| --- | --- | --- | --- | --- |
| Registration/login/current user | Implemented | Implemented | Backend + frontend | Complete for access-token auth |
| Password change | Implemented | Implemented | Backend | Complete |
| Password reset/email verification | Missing | Missing | Missing | Blocking for public launch |
| Refresh rotation/revocation | Missing | Access token in local storage | Missing | Important security gap |
| Candidate profile | Basic professional profile | Implemented | Backend + frontend | Partial; no structured education/skills/experience |
| Resume management | Private storage, authorization, validation | Full current workflow | Backend + frontend | Complete on one persistent host; storage adapter needed to scale out |
| Company onboarding | Owner membership transaction | Setup form | Backend + frontend | Complete |
| Membership management | API/service present | Missing | Limited backend | Partial |
| Job lifecycle | Draft/publish/close/edit/delete, server pagination/filtering | Create/edit/list/manage | Backend + frontend | Partial; preview/reopen UX is not explicit |
| Job discovery | Published-only list/detail and server filters | Search/filter/list/detail | Backend + frontend | Partial; compatibility code still filters company/location client-side |
| Saved jobs | Implemented | Implemented | Backend + frontend | Complete |
| Applications | Apply, privacy, transitions, history, withdraw, decisions | Candidate/recruiter workflows | Backend + frontend | Substantially complete |
| Interviews | Rounds, conflict checks, status changes | Recruiter panel and candidate visibility | Backend + frontend | Substantially complete |
| Interview feedback | Authorized, one per interview | Implemented | Backend + frontend | Complete for current model |
| Notifications | Missing | Missing | Missing | Blocking workflow gap |
| Recruiter dashboard | Job data available | Basic real-data counts | Frontend | Partial |
| Candidate dashboard | Application data available | Redirects to applications | Limited | Partial |
| Admin operations/dashboard | Role recognized | Missing | Authorization only | Missing product capability |
| Observability | Request IDs, timing logs, health/readiness | User-visible errors | Health test | Partial; no external metrics/error sink |
| Deployment configuration | Environment-driven API/CORS/storage | Environment-driven API URL | Build + migration cycle | Partial; infrastructure not provisioned |

## Implemented during this audit

- Removed Supabase and Docker coupling to preserve the requested FastAPI/PostgreSQL modular monolith.
- Added private filesystem resume storage with generated keys, traversal protection, owner-only permissions, MIME/signature/extension validation, a 5 MiB limit, authorized streaming, and no-store download headers.
- Added normalized emails, a 12-character letter-and-number password policy, duplicate-registration race handling, JWT `iat`/`jti`/token-type claims, and an authenticated password-change workflow.
- Made production API URL and CORS origins environment-driven.
- Added request correlation IDs, request-duration logging, response security headers, and database readiness probing.
- Added job publication timestamps, range constraints, interview/feedback constraints, timezone-aware interview storage, and indexes matching public jobs, recruiter jobs, applications, applicants, and interviewer schedules.
- Fixed validation error serialization and a historical migration downgrade defect.

## Security controls and remaining risks

Implemented controls include bcrypt hashing, signed expiring access tokens, inactive-user rejection, server-side role/membership/ownership checks, private resume access, safe errors, configurable CORS, upload validation, hardening headers, and database uniqueness/check constraints.

Remaining launch risks: local-storage tokens are exposed to successful XSS; there is no refresh rotation/revocation, login throttling, password reset, email verification, security-event sink, malware scanning, or formal account deletion/export. A production reverse proxy must enforce HTTPS and request limits. Resume storage needs a backed-up persistent volume on one host or a private object-storage adapter before horizontal scaling.

## Verification

- Backend: 125 Pytest tests passed against dedicated PostgreSQL, including a smoke contract for every documented OpenAPI operation and positive resource-lifecycle coverage.
- Frontend: 34 Vitest tests passed; ESLint and the optimized Vite production build also passed.
- Lint: ESLint passed.
- Build: Vite production build passed.
- Migrations: full upgrade to head and downgrade to base passed against dedicated PostgreSQL.
- Integration: FastAPI tests exercise real PostgreSQL repository/service/API interactions.
- Browser E2E: not implemented or claimed.
- Load tests: not run; no capacity claim is made.

## Remaining work

### Blocking

- Password reset and email verification with a configured provider.
- In-app notifications for application and interview events.
- Explicit admin API/UI for user activation, company verification, and moderation.
- Production PostgreSQL, TLS, backups, private persistent resume storage, secrets, monitoring, and CI/CD.
- Browser E2E tests for candidate, recruiter, and admin journeys.

### Important but non-blocking

- Refresh-token rotation/revocation or a hardened secure-cookie design, plus authentication rate limiting.
- Company-member UI and explicit active-company selection if multiple memberships are required.
- Structured candidate skills, education, and experience with schema, API, UI, and tests.
- Complete server-side job location/company/salary/date filtering and recruiter applicant search.
- Audit events for membership and administrative changes.
- Malware scanning and a private object-storage adapter before multi-host deployment.

### Optional future enhancements

- Email preferences/templates, richer analytics, scheduled reminders, and measured load testing.
- Optimize the large landing image and refresh the browser compatibility dataset.

## Honest assessment

TrackHire has a solid tested core for candidate applications and recruiter interview workflows, and is materially safer and more deployable after this audit. It is not yet verified production-ready for a public multi-tenant SaaS launch because notifications, admin operations, account recovery/verification, E2E coverage, and production infrastructure are still absent.
