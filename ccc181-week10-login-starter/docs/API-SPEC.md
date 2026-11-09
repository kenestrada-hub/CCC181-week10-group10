# CampusConnect API Specification

Group 10 · IT-3A · Weeks 12–13. This contract is written before implementation.
The application root is `ccc181-week10-login-starter/`; the API runs separately
at `http://localhost:3000/api/v1`. Requests and responses use JSON.

## Fixed authentication contract

| Method | Endpoint | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | Confirm the API is running | 200 | — |
| POST | `/api/v1/sessions` | Create an authenticated session | 200 | 400, 401 |
| GET | `/api/v1/users/me` | Read the authenticated user | 200 | 401 |

### Health

`GET /api/v1/health` needs no token. Response: **200**

```json
{ "status": "ok" }
```

### Create a session

`POST /api/v1/sessions`, header `Content-Type: application/json`:

```json
{ "email": "student@campusconnect.test", "password": "Campus26" }
```

**200** (the token below is a placeholder, not a saved credential):

```json
{
  "token": "<signed JWT>",
  "user": { "id": 1, "name": "Demo Student", "email": "student@campusconnect.test" }
}
```

**400** for a missing, empty, non-text, or badly formatted field or malformed JSON:

```json
{ "error": "Email and password are required." }
```

Email is trimmed and lowercased before lookup. Passwords are compared exactly;
whitespace is not removed. A nonempty incorrect password is an authentication
failure, not a successful login or a form-validation shortcut.

**401** for BOTH an unknown email and an incorrect password:

```json
{ "error": "Invalid email or password." }
```

Demo account: **student@campusconnect.test / Campus26 / Demo Student**.
This is a public classroom fixture, never a real account. Only bcrypt password
hashes are stored in the in-memory users list. Responses never contain hashes.
JWTs are signed using the server-only `JWT_SECRET`, algorithm HS256, with a
one-hour expiry. There is no database or server-side session store.

### Current user

`GET /api/v1/users/me`, header `Authorization: Bearer <token from login>`:

**200**:

```json
{ "id": 1, "name": "Demo Student", "email": "student@campusconnect.test" }
```

**401** for a missing, malformed, invalid, expired, or unknown-user token:

```json
{ "error": "Not logged in." }
```

The token goes in the header, never a URL. The browser stores it in
`sessionStorage`, verifies it with this endpoint on refresh, and deletes it on
logout or a 401 during restoration. Logout is local; no logout endpoint exists.
Never include a live token in exported collections, screenshots, or logs.

### Cross-cutting behavior

- CORS permits only the exact configured `CLIENT_ORIGIN` (normally
  `http://localhost:5173`). This controls browser access, not authentication.
- Unknown routes return **404** `{ "error": "Not found." }`.
- Unexpected errors return **500** `{ "error": "Something went wrong." }`.
  Stack traces, passwords and JWT secrets are never sent to the client.
- Authentication responses use `Cache-Control: no-store`.
- The UI checks the status and payload; form validation alone cannot display
  Welcome. 400/401 keep the form and email with a friendly failure message;
  network failures and 5xx receive distinct friendly messages.

## Events (design only)

These routes are designed on paper only. They are NOT implemented; requests to
these addresses currently return the ordinary 404. Paths use plural nouns,
versioning and HTTP verbs; filtering is a query string, not `/getEvents`.

| Method | Endpoint | Purpose | Success | Possible errors |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/events` | List events | 200 | 500 |
| GET | `/api/v1/events?month=11` | List events in November (month 1–12) | 200 | 400 |
| GET | `/api/v1/events/12` | Read event 12 | 200 | 404 |
| POST | `/api/v1/events` | Add an event | 201 | 400, 401, 403 |
| PATCH | `/api/v1/events/12` | Change only supplied fields | 200 | 400, 401, 403, 404 |
| DELETE | `/api/v1/events/12` | Remove event 12 | 204, no body | 401, 403, 404 |

Example event:

```json
{ "id": 12, "title": "Campus technology fair", "date": "2026-11-20", "college": "CBIT" }
```

POST body omits the server-generated id; PATCH can send
`{ "title": "Updated technology fair" }`. A list returns an array (empty when
nothing matches). Invalid dates, missing titles and invalid month filters yield
400. Unknown ids yield 404. Writes would require authentication and organizer
permission (401 when unauthenticated, 403 when not permitted). DELETE is
idempotent in its effect: repeating it creates no further change, even if its
second response is 404. GET is safe; POST creates a new resource and is not
idempotent.

## OpenAPI contract

The companion [openapi.json](openapi.json) is OpenAPI 3.0.3, documenting the three
implemented endpoints, JSON schemas, security and examples. Import it into a
compatible OpenAPI viewer. The events design above is intentionally not exposed
as implemented routes.

## Test collection

Import [CampusConnect API](postman/CampusConnect.postman_collection.json) into
Postman. `baseUrl` defaults to `http://localhost:3000/api/v1`. Run requests in
order: the successful login saves its token only to a runtime collection
variable for the subsequent current-user request. The final request clears it;
clear any runtime token before exporting. No real tokens are in the JSON file.
Tests assert status, exact response shape and absence of password/hash data.
The successful login Visualizer displays the actual response with its token
redacted for screenshots. In Postman's account-free Lightweight API Client,
collections cannot be saved: use equivalent local requests; request 7 can obtain
a fresh token with `pm.sendRequest` in a pre-request script and keep it only in
`pm.variables`. No Postman account or cloud upload is needed for local testing.

Run backend regression tests with `npm test` inside `server/`. They also cover
malformed JSON, invalid/expired JWTs, CORS and sanitized 404/500 responses.

## Handout review: check your understanding

1. **Stateless:** each request supplies its own authentication token. The server
   does not remember a browser login between requests, simplifying scaling and
   allowing any instance with the signing secret to verify the request.
2. **Create/remove a student:** `POST /api/v1/students` returns 201 Created;
   `DELETE /api/v1/students/12` returns 204 No Content. This activity deliberately
   specifies 200 for session creation; we follow its fixed contract.
3. **Naming:** `/getStudents` puts a verb in the URL. Use plural resource nouns:
   `GET /api/v1/students`; the HTTP method expresses the action.
4. **Missing student:** 200 with “Student not found” incorrectly signals success.
   Return 404 Not Found instead.
5. **Fetch versus axios:** fetch resolves for HTTP 404, so check `response.ok`;
   axios rejects for 4xx/5xx by default. Fetch needs `response.json()`, whereas
   axios exposes parsed JSON as `response.data`. Fetch needs no extra package.
6. **Environment files:** `.gitignore` keeps local settings and signing secrets
   out of commits. Vite frontend variables are bundled and readable by users,
   so JWT secrets never belong in `VITE_*` variables.
7. **Validation:** browser checks give fast feedback but are easy to bypass with
   direct HTTP requests. The backend must validate every request and perform the
   password comparison before issuing an authenticated response.

## Sources

- Instructor: `CCC181_Week10-13_Group_Activity_CampusConnect_Login.docx`, Sections 11–17.
- Instructor: `CCC181_Week12-13_Handout.docx`, REST, methods, codes, input validation,
  environment variables and response checking.
- [MDN: Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [Express: Error handling](https://expressjs.com/en/guide/error-handling.html).
