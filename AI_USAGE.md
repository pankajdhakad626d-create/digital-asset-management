# AI Usage Record

This document records the AI-assisted work for the Digital Asset Management interview assignment. Earlier Cursor conversation text was not available in this workspace, so earlier prompts are identified as summaries rather than reconstructed quotations.

## Prompt record

- **Architecture planning (summary):** inspect the existing DAM repository and preserve working React, Express, MongoDB, Multer, and Cloudinary architecture while identifying missing assignment requirements.
- **Backend upload implementation (summary):** implement `POST /api/assets` with memory uploads, 20 MB validation, supported MIME types/extensions, Cloudinary `upload_stream`, metadata persistence, and cleanup on database failure.
- **Cloudinary integration (summary):** store uploads in `dam-assets`, use `resource_type: auto`, persist secure URLs/public IDs, and keep credentials server-side.
- **MongoDB metadata design (summary):** model original filename, Cloudinary identifiers, type, format, size, normalized tags, upload date, and timestamps.
- **Search/filter implementation (summary):** add escaped filename search, type/tag/date filters, sorting, validation, AND composition, pagination, and global statistics aggregation.
- **React UI creation (summary):** build an off-white black-and-white SaaS interface with upload modal, progress, grid/list gallery, filters, states, details dialog, and responsive CSS.
- **Backend/frontend integration (summary):** centralize Axios calls, use `VITE_API_BASE_URL`, normalize API errors, send query parameters, refresh gallery/statistics after upload, and preserve browser multipart boundaries.
- **Error handling (summary):** use consistent `{ success, error: { code, message } }` responses, handle Multer/API/network/preview failures, and avoid browser alerts.
- **Testing and review (summary):** run syntax, lint, build, environment safety, route consistency, and service connectivity checks; distinguish passed, failed, and blocked checks.
- **Current master prompt (provided task):** the full assignment prompt beginning “You are completing an existing Full-Stack Developer interview assignment: a Digital Asset Management (DAM) system.” It requested audit-first implementation across the backend, frontend, testing, documentation, and Git safety requirements. This exact prompt was supplied in the conversation and is not duplicated here to avoid maintaining a second divergent copy.

## Evaluation of suggestions

- The suggested architecture was accepted because the repository already separated API, hooks, controllers, models, and middleware. No Redux, TypeScript, Tailwind, authentication, deletion, or other out-of-scope systems were added.
- The suggested Cloudinary/MongoDB sequence was accepted and strengthened with cleanup when metadata persistence fails. It was verified by code inspection and backend syntax checks; live verification remains service-dependent.
- The suggested filter design was accepted with server-side query composition, regex escaping, date validation, a maximum page size of 50, and aggregation-based statistics. This avoids calculating global totals from one page.
- The suggested frontend workflow was accepted with a grid/list toggle, debounced search, upload progress, drag-and-drop, preview fallbacks, details dialog, responsive layouts, and retry/empty/loading states.
- A manually set multipart `Content-Type` header was rejected because Axios should set the boundary for browser `FormData` requests.
- The starter Vite screen was replaced because it did not implement any DAM behavior. Existing small validation and formatter helpers were retained.

## Genuine challenges

- The existing environment example used `MONGODB_URI` while the backend required `MONGODB_URL`; the backend now accepts both, with `MONGODB_URI` documented as canonical.
- The existing API returned raw arrays and plain error strings; the frontend/backend contract was aligned to consistent success and error envelopes.
- Search required regex escaping and server-side pagination so combined filters do not operate only on the current page.
- Cloudinary upload cleanup is necessary to avoid an orphaned remote file when MongoDB persistence fails.
- The installed environment reports Node `v16.20.2`, while the declared dependency/toolchain requirement is Node 20.19+. Vite/Rolldown and ESLint therefore fail before application validation can run.
- A local backend environment file contains a real MongoDB connection string. Its value is intentionally not recorded here. The workspace has no detectable Git repository, so tracked-file removal could not be performed; the credential should be rotated if it was ever committed or shared.

## AI-assisted work

AI assistance contributed repository inspection, implementation suggestions, scaffolding, refactoring recommendations, test-case coverage, and review prompts. It did not establish service credentials or claim live integration success.

## Developer-driven work

The developer owns the architecture and scope decisions, reviewed generated changes, chose the minimal existing stack, kept credentials out of documentation and output, decided which starter code to replace, and is responsible for real service testing, accessibility review, debugging, and final acceptance. “Developer-driven” means those decisions and verification remain human-owned; it does not claim every character was manually typed.

## Verification record

- Backend JavaScript syntax checks: passed.
- Backend package test script (`node --check src/server.js`): passed.
- Frontend production build: blocked by Node 16 lacking `node:util.styleText`, required by the installed Vite/Rolldown version.
- Frontend lint: blocked by the same Node 16 runtime family, with ESLint failing on unavailable `structuredClone`.
- Live MongoDB, Cloudinary, upload, download, CORS, and browser end-to-end checks: blocked until valid reachable services and Node 20.19+ are available.
