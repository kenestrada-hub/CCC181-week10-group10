# CCC181 Weeks 10, 12–13: CampusConnect Login

Group 10 · IT-3A. The mobile-first React + TypeScript page now calls our own
Express API. Welcome appears only after a successful API response, never from
form validation alone. The original Part 1 work and contributions are preserved.

## Run both apps (exam preparation)

Use Node.js LTS (Node 22.18+ or 24 recommended), npm, Chrome/Edge, and Postman.
The **application root** is `ccc181-week10-login-starter/`, not the Git repository
root. Keep the same repository; do not move or re-create the Week 10 project.

From a fresh clone:

```bash
git clone https://github.com/kenestrada-hub/CCC181-week10-group10.git
cd CCC181-week10-group10/ccc181-week10-login-starter
npm ci
npm --prefix server ci
npm run setup
npm run build
npm test
```

`npm run setup` creates the two local `.env` files from the two `.env.example`
files and generates a random server JWT secret. It never overwrites existing
settings. No secrets are printed. `.env` files are ignored by Git.

Terminal 1 (inside the application root):

```bash
cd server
npm start
```

It must print **API running on http://localhost:3000**. Leave it running.
For development only, `npm run dev` in `server/` uses Node's built-in watch mode.

Terminal 2 (inside `ccc181-week10-login-starter/`):

```bash
npm run dev
```

Open **http://localhost:5173**. The dev script uses `--strictPort` so it never
silently starts on 5174 and breaks CORS. Its predev hook also creates missing
local settings without overwriting any existing ones.

Before scoring, open **http://localhost:3000/api/v1/health** and verify 200 and
`{ "status": "ok" }`. Both terminals must remain running, or both rubric
criteria score zero.

Demo account (public classroom fixture):

- Email: `student@campusconnect.test`
- Password: `Campus26`
- Name from the API: `Demo Student`

Do not use real passwords. Registration, guest access, and forgot-password
links are Part 1 placeholders, not alternate routes around API authentication.
The checkbox does not enable permanent storage: tokens use `sessionStorage`.

### Settings

| Local file (never commit) | Committed example | Variables |
| --- | --- | --- |
| `.env` | [.env.example](.env.example) | `VITE_API_URL=http://localhost:3000/api/v1` |
| `server/.env` | [server/.env.example](server/.env.example) | `PORT=3000`, random `JWT_SECRET`, `CLIENT_ORIGIN=http://localhost:5173` |

Restart Vite after changing frontend settings and restart the API after changing
server settings. JWT_SECRET stays server-side, never in `VITE_*`, logs, URLs, or
screenshots. If an example secret is left unchanged, startup warns and uses a
random secret for that run; fix the local setting so refresh survives API restarts.
A port-in-use error means another instance is running; stop the old instance
instead of silently changing the exam's required URLs.

### API summary

| Method | Route | Success | Expected failures |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | 200 status ok | — |
| POST | `/api/v1/sessions` | 200 token + public user | 400 missing/malformed; 401 wrong password or unknown email |
| GET | `/api/v1/users/me` | 200 public user | 401 missing, invalid or expired Bearer token |

See [API-SPEC.md](docs/API-SPEC.md), including the **design-only events resource**,
[OpenAPI](docs/openapi.json), and the
[CampusConnect API Postman collection](docs/postman/CampusConnect.postman_collection.json).
Unknown routes return JSON 404; unexpected errors return sanitized JSON 500.

### Exam rehearsal (activity Section 16)

1. Start both apps from the commands above; build must succeed.
2. Check health: 200, `{ "status": "ok" }`.
3. Check the page at 360 and 1280 px: no sideways scrolling.
4. Empty Sign in: red field errors, **no POST request** (ignore Vite/HMR traffic).
5. Demo email + `Wrong123`: 401, “Wrong email or password.”, email retained,
   form visible, no authenticated Welcome.
6. Unknown email + `Campus26`: identical 401 failure behavior.
7. Demo email + `Campus26`: 200 and **Welcome, Demo Student**, email from API.
8. Refresh: GET `/users/me` verifies the token, Welcome remains.
9. Log out, then refresh: token removed, login remains.
10. Stop ONLY the backend and try login: “Cannot reach the server. Please try
    again.”, no crash or Welcome. Restart the backend afterward.
11. In Postman send wrong login, correct login, and current user without a token:
    401, 200, 401 with the contract JSON. Run all seven collection requests too.
12. Check repository: no `.env` or real token/secret, both `.env.example` files,
    API spec and every member's history retained. The leader submits the same
    repo link and complete member list.

### Test evidence and pending submission steps

- `npm test`: all **16 tests passed** using Node's built-in runner, with no extra
  testing packages. Six API client tests, nine backend tests, and one test that
  executes all seven collection requests/embedded assertions cover contract
  responses, input validation, one-hour JWTs, CORS, sanitized 404/500 errors and
  malformed responses.
- Live browser assertions passed for 360/768/1024/1280 layout, empty form with no
  POST, wrong password and unknown email 401, API-backed success, refresh,
  logout, invalid-token clearing, and Show/Hide.
- `node scripts/capture-demo.mjs`: optional headless Chrome test; verifies the
  real network statuses, holds the login request to prove disabled loading and
  duplicate-submit protection, and captures full-page evidence. Set `CHROME_BIN`
  if Chrome is not at its standard macOS path. Both apps must be running.
- `node scripts/capture-demo.mjs --server-down`: run only while the API is stopped;
  it captures the friendly failure. Restart the API afterward.
- Browser captures: [failure at 360](screenshots/login-fail-360.png),
  [success at 360](screenshots/login-success-360.png),
  [success at 1280](screenshots/login-success-1280.png), and
  [server stopped at 360](screenshots/login-server-down-360.png).
- **Genuine Postman evidence:** all seven scenarios were sent in the local
  Lightweight API Client and their assertions passed. No account or cloud sync
  was used. [Health 200](screenshots/postman-health.png),
  [login 200](screenshots/postman-login-200.png),
  [wrong password 401](screenshots/postman-login-401.png), and
  [missing token 401](screenshots/postman-me-401.png) are captured from Postman.
  The 200 screenshot uses the Visualize tab to redact the token from the actual
  response. The committed collection is also independently verified by tests.
- **Clean-folder verification passed:** both lockfile installs, newly generated
  local settings, build, all 16 tests, and live browser login/refresh/logout
  passed without borrowing `.env`, `node_modules`, or `dist` from this working
  copy. To repeat locally, stop both apps first and run
  `node scripts/verify-clean.mjs` from the application root. This retains a
  separate test folder under the workspace's `.verification/` directory.
- Before the exam, repeat the exact rehearsal from an actual fresh GitHub clone
  of merged `main`; branch verification does not make unpublished code available
  on `main`. Rehearse with all group members.
- Changes must be committed on feature branches and reviewed/merged by a
  different teammate before the exam; nothing new is published automatically.

### What I did in Part 2

| Member | Name | GitHub | Part 2 work |
| --- | --- | --- | --- |
| 1 (leader) | Ken Estrada | kenestrada-hub | Part 1 contribution preserved. Part 2 review, final submission and group rehearsal remain to be completed. |
| 2 | Jeroul Palomo | pronehacker99 | Implemented all Part 2 at the user-requested scope: API spec/events design, Express login + JWT protection, JSON error handling, frontend API/session states, Postman collection, automated regression tests and browser evidence. |
| 3 | Felmar Troy Magsayo | FelmarTroy | Part 1 contribution preserved. Part 2 peer review and group rehearsal remain to be completed. |

This implementation does not invent commits or code contributions for teammates.
The activity's normal role split is Section 14; the user chose full implementation
on their account. Arrange genuine teammate contributions/reviews before submitting.

## Rules

- Part 1 CSS ownership remains documented below. Part 2 allows new files and `.tsx` changes; existing class names and the original four stylesheets are preserved.
- Plain CSS only. No Tailwind, Bootstrap, Material UI, styled-components, or any UI library.
- Phone styles first (no media query), then `min-width` queries only. Never `max-width`.
- New auth styles use plain CSS, `min-width` queries only, and 48px tap targets. Keep backend secrets off GitHub.

## Group information (fill in)

| Item | Your answer |
| --- | --- |
| Group number | 10 |
| Section | IT-3A |
| Repository URL | https://github.com/kenestrada-hub/CCC181-week10-group10 |

## Members (each member fills in their own row in their own commit)

| Member | Name | GitHub username | CSS file | What I did |
| --- | --- | --- | --- | --- |
| 1 (leader) | Ken Estrada | kenestrada-hub | `base.css` | Added the viewport meta tag after Experiment 0. Built the mobile-first page and container layout, centered navy brand panel and gold pill badge on phones, wider padding from 768px, two-column login with visible perks from 1024px, and centered 1200px containers from 1280px. |
| 2 | Jeroul Palomo | pronehacker99 | `nav.css` | Navbar with Flexbox: brand on top and stacked 48px links on phones, brand left and links in one row from 768px. Footer with Grid: 1 column on phones, 3 equal columns from 1024px. Hover and focus-visible styles on every nav and footer link. My screenshots: `screenshots/pronehacker99/`. |
| 3 | Felmar Troy Magsayo | FelmarTroy | `form.css` | Wrote the mobile-first login-card styles in plain CSS: stacked 48px tap targets on phones, password row with Show button that never overflows at 360px, checkbox + link in a row from 768px, side-by-side alt buttons from 768px, larger card padding and title from 1024px. Every :hover paired with :focus-visible; all sizing in rem/%; px only for thin borders and 48px tap-target heights. Added `overflow-wrap: anywhere` on .form-success so a long email can't cause sideways scrolling. |

## Experiment 0: the page without the viewport tag

What did the page look like in DevTools phone mode **before** adding the viewport meta tag?
What changed **after** adding it?

> Before the viewport tag, iPhone SE emulation showed a zoomed-out, tiny page. Both `window.innerWidth` and `document.documentElement.scrollWidth` were 981px instead of 375px. After adding `width=device-width, initial-scale=1`, the page used its real 375px width at normal scale, with no horizontal overflow.

## DevTools test results

| Width | What must be true | Pass? |
| --- | --- | --- |
| 360 px | 1 column. Nav links stacked and 48px tall. Options and buttons stacked. Footer in 1 column. No sideways scrollbar. | Pass |
| 768 px | Nav in one row (brand left, links right). Checkbox and link in one row. Two buttons side by side. | Pass |
| 1024 px | Brand panel and login card side by side. Footer in 3 columns. Heading is larger. | Pass |
| 1280 px | Content centered and stops at 1200px. | Pass |

### Breakpoints I observed

Using **Show media queries** and dragging slowly from 360 px to 1280 px, the layout changed at these exact widths:

> The layout changed at exactly 768px (wider padding and single-row navigation/form actions), 1024px (two-column login, larger brand heading, visible perks, and three-column footer), and 1280px (centered 1200px containers). Nothing looked broken at 360, 768, 1024, or 1280px; every test passed without sideways scrolling.

Screenshots are in `screenshots/` as `360.png`, `768.png`, `1024.png`, `1280.png`.

## What our group learned (leader writes this last)

> We learned how the viewport meta tag controls mobile layout width, how to build mobile-first CSS with `min-width` breakpoints, and how Flexbox and Grid solve different layout needs. We also practiced scoped file ownership, explicit Git staging, small focused commits, pull-request reviews, and merge commits while testing our combined work at every breakpoint.
