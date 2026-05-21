# Nini HR — Client-Side Guide (for Backend Integration)

This README is written for the **server-side developer** wiring the Express/Mongo API to this React app. It documents how the frontend is structured today, what data shapes the UI expects, and how that maps to routes already present under `server/`.

---

## Quick facts

| Item | Value |
|------|--------|
| App name | Nini HR (`hr-leave-attendance-management-system`) |
| Stack | React 19 + Vite 8 + React Router 7 + TanStack Query 5 + Axios |
| Dev URL | `http://localhost:5173` (Vite default) |
| API base (configured) | `import.meta.env.VITE_API_URL` or fallback `/api` |
| Server API prefix (existing) | `http://localhost:8000/api` (see `server/.env.example`) |
| Language | JavaScript (`.jsx`), path alias `@/` → `src/` |

**Important:** Almost all domain logic still runs on **mock services** (`src/services/*`) with `localStorage` persistence. `src/services/api.js` exists and attaches `Authorization: Bearer <token>`, but services do not call it yet (except a commented hint in `authService.getProfile`).

---

## Run locally

```bash
cd client-side
npm install
npm run dev
```

Optional env file `client-side/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Without this, Axios defaults to `/api` (same-origin). In dev you usually need the full backend URL above.

---

## Architecture (where to look)

```
client-side/src/
├── main.jsx                 # Providers: QueryClient, Theme, Auth, Toast, Notifications
├── App.jsx                  # Router shell
├── router/
│   ├── index.jsx            # All routes + lazy pages + role guards
│   └── ProtectedRoute.jsx   # Auth, onboarding, RBAC
├── context/
│   ├── AuthContext.jsx      # Session (localStorage today)
│   ├── ThemeContext.jsx
│   ├── ToastContext.jsx
│   └── NotificationContext.jsx
├── services/                # ★ Replace mocks with api.* calls here
│   ├── api.js               # Axios instance + interceptors
│   ├── authService.js
│   ├── leaveService.js
│   ├── employeeService.js
│   ├── attendanceService.js
│   ├── departmentService.js
│   ├── payrollService.js
│   ├── announcementService.js
│   └── logService.js
├── hooks/
│   ├── useLeaves.js         # React Query wrappers for leaveService
│   ├── useGsap.js
│   ├── useTheme.js
│   └── useUtils.js
├── data/                    # Seed/mock fixtures (reference shapes)
├── pages/                   # Route-level UI (app | auth | public)
├── components/              # ui | layout | common
└── utils/
    ├── constants.js         # Enums, nav, leave types
    ├── validators.js        # Forms, overlap checks, sanitize
    ├── formatters.js
    └── helpers.js           # cn(), sleep(), generateId()
```

**Integration rule:** Pages should keep calling `*Service` methods and hooks—not `api` directly. Backend dev + frontend dev meet in `src/services/*.js`.

---

## HTTP client (`src/services/api.js`)

```javascript
// Request: Authorization: Bearer <token> from localStorage key nini-user.token
// Response 401: clears nini-user, redirects to /login
baseURL: import.meta.env.VITE_API_URL || '/api'
timeout: 10000
Content-Type: application/json
```

### Auth storage (temporary — change for production)

| Key | Content |
|-----|---------|
| `nini-user` | JSON user object including `token` |
| `nini-token` | Duplicate token string (optional) |

`AuthContext.jsx` documents that **HttpOnly cookies** should replace localStorage before production.

---

## Authentication contract

### What the client sends today (login form — Zod)

- `email` — required, valid email
- `password` — min 6 chars (login only; signup uses stronger rules in `validators.js`)

### What the client expects after login (`AuthContext` / mock)

```json
{
  "id": "EMP-1001",
  "name": "Sarah Chen",
  "email": "sarah.chen@nini.io",
  "role": "HR Manager",
  "department": "Human Resources",
  "avatar": null,
  "joinDate": "2024-03-15",
  "token": "<jwt>",
  "onboarded": true
}
```

### What the server returns today (`POST /api/auth/login`)

```json
{
  "success": true,
  "token": "<jwt>",
  "data": { "id": "<mongoId>", "fullname": "...", "role": "user|admin|superadmin" },
  "message": "Login successful"
}
```

### Mapping needed at integration

| Client field | Server field | Notes |
|--------------|--------------|--------|
| `name` | `fullname` | Map in `authService.login` |
| `id` | `data.id` (`_id`) | OK as string |
| `role` | `data.role` | **Role strings differ** (see RBAC below) |
| `department` | — | Not on User model yet; UI uses it |
| `onboarded` | — | Client redirects to `/onboarding` if falsy |
| `joinDate` | `createdAt`? | Optional |
| `avatar` | `profilePicture` | Optional |

### Server auth routes (implemented)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | Public — body: `{ fullname, email, password }` |
| POST | `/api/auth/login` | Public — body: `{ email, password }` |
| POST | `/api/auth/forgotpassword` | Public |
| POST | `/api/auth/logout` | Public |
| PUT | `/api/auth/profile/change-password` | Bearer |
| PUT | `/api/auth/profile/update` | Bearer + optional `profilePicture` upload |

**Client mock endpoints to wire:**

- `authService.login` → `POST /api/auth/login`
- `authService.signup` → `POST /api/auth/register` (map `name` → `fullname`)
- `authService.getProfile` → `GET /api/user/profile` (or dedicated `/auth/me`)
- `authService.logout` → `POST /api/auth/logout` + clear local session

---

## RBAC — critical mismatch

### Route guards (`router/index.jsx`)

| Routes | `allowedRoles` |
|--------|----------------|
| `/app/employees`, `/app/departments`, `/app/payroll`, `/app/reports` | `admin`, `manager`, `hr` |
| `/app/superadmin` | `superadmin` |
| All other `/app/*` | Any authenticated user |

`ProtectedRoute` / `RequireRole` logic:

- `superadmin` → full access
- Role `hr` matches if `user.role.toLowerCase().includes('hr')` (e.g. `"HR Manager"`)
- Exact match otherwise (`admin`, `manager`, …)

### Server roles (`User.role` enum)

`user` | `admin` | `superadmin`

### Mock / UI roles in use

Examples: `HR Manager`, `Lead AI Engineer`, `superadmin`, job titles on employee records.

**Recommendation:** Either normalize API to `user | admin | superadmin` and map display titles separately (`jobTitle`), or extend server enum and update `ProtectedRoute` lists to match.

### UI “HR” checks (e.g. `LeavePage`)

```javascript
['hr', 'admin', 'manager'].some(r => user?.role?.toLowerCase().includes(r))
|| user?.role?.toLowerCase() === 'superadmin'
```

Server `admin` will pass `includes('admin')`. Server `user` will not see team leave approval UI.

---

## Server routes already implemented

Base: **`/api`**

| Prefix | Role | Endpoints |
|--------|------|-----------|
| `/auth` | Mixed | register, login, forgotpassword, logout, profile updates |
| `/user` | `user` | profile, time-in, time-out, history, announcements, leave-balance, leave-request, leave-history |
| `/admin` | `admin` | announcements CRUD, leaves list, leave review |
| `/superadmin` | `superadmin` | (see `server/routes/superadminRoutes.js`) |

Health: `GET /health` (no `/api` prefix).

---

## Domain models the UI expects

### Employee (`employeeService` / `data/employees.js`)

```typescript
{
  id: string;              // e.g. "EMP-1001"
  name: string;
  email: string;
  role: string;            // job title / position label
  department: string;
  phone?: string;
  status: 'active' | 'pending' | 'inactive' | 'on-leave';
  joinDate: string;        // ISO date YYYY-MM-DD
  annualBalance?: number;
  sickBalance?: number;
  personalBalance?: number;
}
```

**Service methods:** `getAll`, `getById`, `search`, `getByDepartment`, `getDepartments`, `getStats`, `create`, `delete`, `approve`, `reject`

**No server employee CRUD yet** — backend needs new routes or admin module.

---

### Leave request (`leaveService`)

```typescript
{
  id: string;              // e.g. "lv-abc123"
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
  startDate: string;       // YYYY-MM-DD
  endDate: string;
  days: number;
  reason: string;          // 10–500 chars in UI validation
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedOn: string;
  approvedBy: string | null;
}
```

**Create payload** (from `LeavePage`):

```json
{
  "employeeId": "...",
  "employeeName": "...",
  "type": "annual",
  "startDate": "2026-05-01",
  "endDate": "2026-05-05",
  "days": 5,
  "reason": "..."
}
```

**Business rules client enforces (server should mirror):**

- Overlap: no overlapping `pending` or `approved` ranges per employee (`LEAVE_OVERLAP` error code)
- End date ≥ start date

**Server model (`Leave.js`) differences:**

| Client | Server |
|--------|--------|
| `type` | `leaveType` |
| `employeeId` | `user` (ObjectId ref) |
| `rejected` | `declined` |
| `cancelled` | not in enum |
| `employeeName`, `days`, `approvedBy` | not stored |

**Map to existing API:**

- User: `POST /api/user/leave-request`, `GET /api/user/leave-history`, `GET /api/user/leave-balance`
- Admin: `GET /api/admin/leaves`, `PUT /api/admin/leaves/:id/review`

**Client service methods:** `getAll`, `getByEmployee`, `getPending`, `create`, `approve`, `reject`, `cancel`, `getBalance`, `checkOverlap`

**React Query keys:** `['leaves']`, `['leaves','pending']`, `['leaves','employee', id]`, `['leave-balance']`

---

### Leave balance (`leaveService.getBalance`)

```json
{
  "annual": { "total": 20, "used": 5, "remaining": 15 },
  "sick": { "total": 12, "used": 2, "remaining": 10 },
  "personal": { "total": 7, "used": 2, "remaining": 5 },
  "maternity": { "total": 90, "used": 0, "remaining": 90 },
  "paternity": { "total": 14, "used": 0, "remaining": 14 },
  "unpaid": { "total": 0, "used": 0, "remaining": 0 }
}
```

Server `User.leaveBalances` uses `allotted` / `left` — map to `total` / `remaining` and compute `used`.

---

### Attendance

**Monthly record (self):**

```typescript
{
  date: string;           // YYYY-MM-DD
  day: number;
  dayOfWeek: number;      // 0=Sun
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'half-day' | 'weekend' | 'upcoming';
  clockIn: string | null; // "HH:MM" display string
  clockOut: string | null;
  hours: number;
}
```

**Summary** (`getAttendanceSummary`): `{ present, absent, late, leave, totalHours, avgHours }`

**Weekly chart** (`getWeekly`): `{ day, hours, present, absent }[]`

**Clock status:** `{ isClockedIn, clockInTime, clockOutTime }`

**HR view:** `getAllEmployeesAttendance()` → `Record<employeeId, AttendanceRecord[]>`

**Adjust (HR):** `adjustAttendance({ employeeId, dateStr, data: { status, clockIn, clockOut, hours } })`

**Server today:** `Attendance` model stores discrete `in`/`out` events with `timestamp`, not monthly grid. Backend may need aggregation endpoints or the client adapts to event list.

**Map to existing API:**

- `POST /api/user/time-in`
- `POST /api/user/time-out`
- `GET /api/user/history`

---

### Department (`departmentService`)

- List: `string[]` department names
- `create(name)`, `update(oldName, newName)`, `delete(name)`
- On rename, client updates employees in `nini-employees` localStorage

**No server routes yet.**

---

### Announcement (`announcementService`)

```typescript
{
  id: string;
  title: string;
  content: string;
  date: string;            // ISO datetime
  author: string;
  category: string;
  priority: 'normal' | 'high' | ...;
}
```

**Map to existing API:**

- User read: `GET /api/user/announcements`
- Admin: `GET/POST /api/admin/announcements`, `DELETE /api/admin/announcements/:id`

---

### Payroll (`payrollService`) — mock only

```typescript
{
  id: string;
  employeeId: string;
  employeeName: string;
  salary: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  status: 'pending' | 'paid';
  processedDate: string;
}
```

**No server routes yet.**

---

### System logs (`logService`) — mock only (Superadmin page)

```typescript
{ timestamp: string; level: string; category: string; message: string }
```

Metrics: `{ cpu, memory, disk, networkLoad, activeUsers }`

Server has `Log` model — wire when superadmin API ready.

---

## App routes (for scope)

### Public

`/`, `/features`, `/pricing`, `/contact`

### Auth

`/login`, `/signup`, `/forgot-password`, `/onboarding` (requires auth, `onboarded === false`)

### App (authenticated)

| Path | Feature |
|------|---------|
| `/app` | Dashboard |
| `/app/announcements` | Announcements |
| `/app/leave` | Leave requests + balance |
| `/app/attendance` | Clock in/out + monthly view + HR adjustments |
| `/app/calendar` | Team calendar |
| `/app/settings` | Settings |
| `/app/profile` | Profile |
| `/app/payslips` | Payslips (reads payroll mock) |
| `/app/employees` | HR only — employee directory |
| `/app/departments` | HR only |
| `/app/payroll` | HR only |
| `/app/reports` | HR only — charts + export |
| `/app/superadmin` | Superadmin diagnostics |

---

## Enums (keep API aligned)

From `src/utils/constants.js`:

**Leave types:** `annual`, `sick`, `personal`, `maternity`, `paternity`, `unpaid`

**Leave status (UI):** `pending`, `approved`, `rejected`, `cancelled`

**Attendance status (UI):** `present`, `absent`, `late`, `halfDay` (UI key) / `half-day` (data), `leave`, `holiday`, plus `weekend`, `upcoming`

---

## Validation rules (server should enforce too)

From `src/utils/validators.js`:

- Email: simplified RFC regex
- Password (signup): 8+ chars, upper, lower, digit
- Leave reason: 10–500 characters
- Date range overlap helper used before create
- `sanitizeInput()` strips HTML on text fields

---

## Mock localStorage keys (will disappear after integration)

| Key | Domain |
|-----|--------|
| `nini-user` | Auth session |
| `nini-token` | JWT copy |
| `nini-employees` | Employee directory |
| `nini-departments` | Department list |
| `nini-attendance-all` | HR attendance grid |
| `nini-payrolls` | Payroll runs |
| `nini-announcements` | Announcements |
| `nini-system-logs` | Superadmin logs |

---

## Suggested integration order

1. **Auth** — login/register/profile; map `fullname` ↔ `name`; store token; test 401 redirect
2. **User leave + balance** — replace `leaveService` for employee flows; align `declined` ↔ `rejected`
3. **User attendance** — clock in/out + history; adapt monthly UI to API shape or add aggregate endpoint
4. **Announcements** — user GET + admin POST/DELETE
5. **Admin leave review** — team tab on Leave page
6. **Employees / departments / payroll** — new admin APIs (largest gap)
7. **Superadmin / logs / metrics** — optional last

---

## Standard API response handling

Server often returns:

```json
{ "success": true|false, "message": "...", "data": {}, "token": "..." }
```

Client services should:

- Throw on `success === false` or non-2xx
- Return `data` (or full payload where token is top-level on login)
- Let React Query hooks invalidate caches on mutations

---

## CORS

Server uses `cors()` with default (open). Client dev origin: `http://localhost:5173`. Ensure preflight works if you lock CORS down later.

---

## Tech dependencies (reference)

See `package.json`. Notable: `@tanstack/react-query`, `axios`, `react-hook-form`, `zod`, `recharts`, `xlsx` (reports export), `gsap` (marketing animations only).

---

## Contact / questions

Frontend integration surface is **`src/services/*.js`**. If you add endpoints, note the **method name** and **expected request/response body** in this README or in a shared OpenAPI doc so the client swap stays mechanical.
