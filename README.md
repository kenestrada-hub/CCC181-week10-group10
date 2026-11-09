# CCC181 Weeks 10, 12–13 — Group 10 · IT-3A

The application root is **`ccc181-week10-login-starter/`**. The backend and API
documents live inside it; the same Week 10 repository is retained.

```bash
cd ccc181-week10-login-starter
npm ci
npm --prefix server ci
npm run setup
npm run build
npm test
```

Leave both apps running in separate terminals:

- Backend: inside `ccc181-week10-login-starter/server/`, run `npm start`.
  It prints `API running on http://localhost:3000`.
- Frontend: inside `ccc181-week10-login-starter/`, run `npm run dev`.
  Open **http://localhost:5173**.
- Readiness: **http://localhost:3000/api/v1/health** must return 200.

Demo: `student@campusconnect.test` / `Campus26` → **Welcome, Demo Student**.
Wrong password or unknown email → 401 and the login form, never Welcome.

See the [full README and exam rehearsal](ccc181-week10-login-starter/README.md),
[API contract](ccc181-week10-login-starter/docs/API-SPEC.md), and
[Postman collection](ccc181-week10-login-starter/docs/postman/CampusConnect.postman_collection.json).
Local `.env` files are ignored; only the two `.env.example` files are shareable.
