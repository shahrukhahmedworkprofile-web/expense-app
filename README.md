# Expense Tracker

Full-stack expense tracker: **Laravel 12** API backend + **React (Vite)** frontend, communicating over Axios with cookie-based authentication.

## 1. Stack

| Layer | Tech |
|---|---|
| Backend | Laravel 12.69.2, PHP 8.2+, MySQL/MariaDB |
| Frontend | React, Vite, Axios, Node 22+ |
| Auth | Custom access + refresh tokens, HttpOnly cookies, CSRF double-submit cookie |

## 2. Project Structure

```
project/
├── backend/    # Laravel app (app/, routes/, config/cors.php, database/)
└── frontend/   # React app (src/api.js, src/App.jsx, .env)
```

Laravel's public web root for the API must be `backend/public`. Never expose the project root (`app/`, `config/`, `database/`, `storage/`, `vendor/`, `.env`) directly.

## 3. Authentication Architecture

Two custom tokens, both stored as **HttpOnly** cookies (never read via `document.cookie` — frontend must not attempt this):

| Token | Cookie | Lifetime | Purpose |
|---|---|---|---|
| Access token | `access_token` | 15 min | Authenticates protected API requests |
| Refresh token | `refresh_token` | 30 days | Issues a new access token when it expires |

Both are stored server-side as SHA-256 hashes (`TokenService`), never in plaintext — a DB leak alone does not yield usable tokens.

**Flow:**
1. `POST /auth/login` → both cookies set.
2. Protected request with expired access token → API returns `401`.
3. Axios response interceptor calls `POST /auth/refresh` (refresh token validated, rotated, both cookies reissued), then retries the original request.
4. If the refresh token is also invalid/expired → `401` from refresh → user must log in again.

Refresh tokens are rotated on every use (old one revoked, new one issued); login revokes all of a user's existing tokens.

## 4. CSRF Protection

Since auth relies on cookies, the browser auto-attaches them to *any* request to the API domain — including ones triggered by a malicious third-party page. CSRF protection stops those forged requests from being honored.

**Mechanism — double-submit cookie:**

1. `GET /csrf-token` issues a random token as a cookie (`csrf_token`, **not** `httpOnly`, so JS can read it) with no server-side storage needed.
2. Axios is configured to read that cookie and copy it into a header automatically on every request:
   ```js
   withCredentials: true,
   withXSRFToken: true,
   xsrfCookieName: "csrf_token",
   xsrfHeaderName: "X-CSRF-TOKEN",
   ```
3. On every unsafe method (`POST`/`PUT`/`PATCH`/`DELETE`), Laravel's `VerifyCsrfToken` middleware compares the cookie value against the `X-CSRF-TOKEN` header using `hash_equals` (constant-time). Mismatch or missing value → `419`.

A forged cross-site request can't produce a matching header — the attacker's page can't read the victim's `csrf_token` cookie (Same-Origin Policy), and a plain `<form>` submission can't set custom headers at all.

**Applies to:** all routes under the `csrf` middleware group, including `login`/`register`/`refresh` (blocks *login CSRF*, where a forged login silently signs the victim into an attacker-controlled account).

**Depends on:** correct CORS configuration (§6). If CORS ever reflects an arbitrary origin with credentials enabled, an attacker's page could read the `/csrf-token` response directly, which is why that response carries **no token in the JSON body** — only the cookie.

**Frontend must retry on `419`** (fetch a fresh `/csrf-token`, then retry) the same way it retries on `401`. Without this, a session that outlives the CSRF cookie's lifetime (60 min) will start failing with no recovery path.

## 5. Cookie Configuration

| Setting | Value | Notes |
|---|---|---|
| `HttpOnly` | `true` for `access_token`/`refresh_token`; `false` for `csrf_token` | CSRF cookie must be JS-readable by design |
| `Secure` | `false` in local dev (HTTP), **`true` in production** | Required once served over HTTPS |
| `SameSite` | `Lax` | Correct **only if frontend and API share the same registrable domain** (e.g. `example.com` + `api.example.com`) — this is the recommended architecture (§8). If frontend and API are on entirely unrelated domains, use `SameSite=None` + `Secure=true` instead, or cookies will silently stop being sent cross-site. |

## 6. CORS

`config/cors.php` must:
- Set `allowed_origins` to the exact frontend origin(s) — never `*`.
- Set `supports_credentials: true` (required for cookie auth to work at all).
- Never dynamically reflect the `Origin` header without validating it against an allowlist.

A misconfigured CORS policy is the main way the CSRF defense above can be bypassed — verify this before anything else in a security review.

## 7. API Reference

```
Auth:      POST /api/auth/register | login | refresh    GET /api/auth/me    POST /api/auth/logout
Expenses:  GET/POST /api/expenses   GET/PUT/PATCH/DELETE /api/expenses/{id}
CSRF:      GET /api/csrf-token
Health:    GET /up
```

## 8. Recommended Production Architecture

```
                    Internet
                       |
                  Nginx / LB (HTTPS/TLS)
                    /        \
                   v           v
        React dist/ (static)   Laravel API (PHP-FPM)
        example.com             api.example.com
                                     |
                                     v
                                  MySQL
```

Frontend and API as subdomains of the same registrable domain keeps `SameSite=Lax` valid (§5) and simplifies CORS.

## 9. Environment Variables

**Backend (`backend/.env`)** — never commit this file; only `.env.example` (names, no secrets) belongs in Git.
```env
APP_NAME="Expense Tracker"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.example.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=expense_tracker
DB_USERNAME=expense_user
DB_PASSWORD=

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=database
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=https://api.example.com/api
```
Vite embeds this at build time — set it correctly *before* `npm run build`. Do not mix `localhost` and `127.0.0.1` between frontend and backend in local dev; it breaks cookie/credential handling.

## 10. Local Development

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve          # http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm ci
npm run dev                # http://localhost:5173
```
`frontend/.env`: `VITE_API_URL=http://localhost:8000/api`

## 11. Production Deployment

```bash
# Backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
npm ci
npm run build               # outputs dist/
```
Deploy `dist/` as static files (Nginx/Apache/S3/CDN). Set correct file ownership for `storage/` and `bootstrap/cache/` (e.g. `chown -R www-data:www-data`).

**Verification checklist:**
```
[ ] APP_DEBUG=false, APP_KEY set, production DB configured
[ ] HTTPS enabled on frontend + API; Secure cookies active
[ ] HttpOnly + SameSite configured correctly (§5)
[ ] CORS restricted to the real production frontend origin (§6)
[ ] GET /up returns healthy
[ ] Login → /auth/me → refresh → logout all succeed
[ ] Expense CRUD works; a user can only access their own expenses
[ ] .env not committed; project root not publicly served
```

## 12. Troubleshooting

| Symptom | Check |
|---|---|
| `401` on protected routes | `access_token`/`refresh_token` cookies present, `withCredentials`, CORS, whether the refresh interceptor fired |
| `419` CSRF mismatch | `csrf_token` cookie present, `X-CSRF-TOKEN` header sent, `xsrfCookieName`/`xsrfHeaderName` match, whether the cookie expired (retry via `/csrf-token`) |
| Login succeeds but `/auth/me` returns 401 | Frontend/backend hostname mismatch (`localhost` vs `127.0.0.1`) |
| CORS error in browser console | `allowed_origins` includes the exact frontend origin; `supports_credentials: true` |
