# Digital Asset Management

A focused full-stack MVP for uploading, cataloguing, searching, previewing, and downloading images, PDFs, and videos.

## Features

- Multipart uploads with drag-and-drop, client validation, real Axios upload progress, and normalized tags.
- Cloudinary file storage and MongoDB metadata persistence with orphan cleanup.
- Search by filename, type, tag, inclusive upload dates, sorting, and pagination.
- Responsive grid/list gallery, details dialog, view/download actions, loading, empty, no-result, and failure states.
- Global asset statistics from MongoDB aggregation.

## Architecture

The React/Vite frontend uses a central Axios client and sends filters to the Express API. Express validates uploads with Multer memory storage, streams accepted files to Cloudinary in `dam-assets`, then persists metadata with Mongoose. Cloudinary URLs are returned by the API; no Cloudinary credentials are sent to the browser.

## Stack and structure

- Node.js 20.19+, Express, Multer, Mongoose, Cloudinary
- React 19, Vite, Axios, Lucide React, plain CSS

```text
backend/src/
  config/       database and Cloudinary setup
  controllers/  asset upload, listing, stats, view, download
  middleware/   upload and error handling
  models/       Mongoose Asset model
  routes/       API routes
frontend/src/
  api/          Axios client
  hooks/        debounced search and asset loading
  utils/        validation and display formatters
  App.jsx       DAM workflow
```

## Prerequisites

- Node.js 20.19 or newer and npm
- MongoDB Atlas database
- Cloudinary account with upload API credentials

## Environment

Copy the examples without adding real values to source control:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend variables: `PORT`, `MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_TIMEOUT_MS`, `CLOUDINARY_UPLOAD_CHUNK_SIZE_BYTES`, and `CLIENT_URL`. Uploads use 5 MB chunks and a 120-second per-request timeout by default. Keep chunks below Cloudinary's 10 MB per-request limit. The backend also accepts the legacy `MONGODB_URL` name for compatibility with an existing local setup. Frontend uses `VITE_API_BASE_URL`.
Backend variables: `PORT`, `MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_TIMEOUT_MS`, `CLOUDINARY_UPLOAD_CHUNK_SIZE_BYTES`, `CLOUDINARY_UPLOAD_RETRIES`, `CLOUDINARY_MAX_UPLOAD_SIZE_BYTES`, and `CLIENT_URL`. Files within the current 10 MB Cloudinary account limit use normal streaming; larger files are rejected before upload with HTTP 413. Uploads use a 300-second timeout and two retries for transient timeout errors. Upgrade/configure the Cloudinary account and raise `CLOUDINARY_MAX_UPLOAD_SIZE_BYTES` to fulfill the application-wide 20 MB limit. The backend also accepts the legacy `MONGODB_URL` name for compatibility with an existing local setup. Frontend uses `VITE_API_BASE_URL`.

Never print or commit `.env` files. If credentials have been exposed, rotate them in MongoDB/Cloudinary.

## Installation and development

```bash
npm install --prefix backend
npm install --prefix frontend
npm run dev --prefix backend
npm run dev --prefix frontend
```

The API defaults to `http://localhost:5000`; Vite defaults to `http://localhost:5173`.

## Production build

```bash
npm run build --prefix frontend
npm start --prefix backend
```

The backend requires reachable MongoDB and Cloudinary credentials before it can start.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/assets` | Upload one `file` plus optional comma-separated `tags` |
| GET | `/api/assets` | Search, filter, sort, and paginate assets |
| GET | `/api/assets/stats` | Aggregated totals and storage |
| GET | `/api/assets/:id` | Asset metadata |
| GET | `/api/assets/:id/view` | Redirect to the saved Cloudinary asset |
| GET | `/api/assets/:id/download` | Stream the asset with a safe original filename |

List query parameters are `search`, `type=image|video|pdf`, `tag`, `fromDate`, `toDate`, `sort=newest|oldest`, `page`, and `limit` (maximum 50). Example:

```text
/api/assets?search=launch&type=image&tag=campaign&fromDate=2026-01-01&sort=newest&page=1&limit=12
```

Uploads accept JPEG, PNG, WebP, PDF, MP4, and WebM files up to 20 MB. Errors use `{ success: false, error: { code, message } }`.

## Testing

```bash
npm test --prefix backend
npm run lint --prefix frontend
npm run build --prefix frontend
```

The latter two commands require Node 20.19+ because the installed Vite/Rolldown and ESLint dependencies use newer Node APIs. Full upload, MongoDB, and Cloudinary integration testing requires valid reachable services.

## Security considerations

- Credentials are loaded only by the backend and are excluded by `.gitignore`.
- Filenames are sanitized for download headers.
- Search strings are regex-escaped before MongoDB queries.
- MIME type and extension are both checked, with a 20 MB Multer limit.
- Production error responses do not include stack traces.

## Known limitations and troubleshooting

- PDF previews use a stable file tile; `View original` opens the Cloudinary-delivered document.
- Video gallery tiles use metadata rather than autoplaying remote video; `View original` opens the saved asset.
- MongoDB Atlas network access and Cloudinary delivery settings must allow the running environment. Cloudinary PDF delivery may require enabling PDF resource delivery in the Cloudinary security settings.
- If the API does not start, check `MONGODB_URI`, Cloudinary variables, and Atlas network access. If the frontend shows network errors, check both servers, `VITE_API_BASE_URL`, and `CLIENT_URL`.

## AI-assisted development

See [AI_USAGE.md](AI_USAGE.md) for the prompt record, evaluation of suggestions, genuine challenges, and the separation between AI assistance and developer decisions.
