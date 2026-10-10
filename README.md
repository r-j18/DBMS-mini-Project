# Criminal Record Management System (CRMS)
> DBMS Mini Project • Full-Stack Web Application

A full-stack, utilitarian web application designed for criminal record tracking, judicial docket management, police roster administration, and correctional facility oversight.

Built with **plain parameterized MySQL 8 queries** (no ORMs), hand-written SQL, strict validation, and comprehensive query performance instrumentation.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, TanStack Table v8, Lucide React icons.
- **Backend**: Node.js, Express, `mysql2/promise` (plain parameterized SQL only).
- **Database**: MySQL 8.0 / TiDB Cloud (InnoDB engine, foreign keys with `ON UPDATE CASCADE ON DELETE RESTRICT`).

---

## Database Schema

```
POLICE(police_id PK, `rank`, name, branch, age, number, address)
CRIMINAL(criminal_id PK, name, age, crime, investigating_officer FK -> POLICE.police_id, investigation_status)
COURT_RECORD(court_room_number PK, criminal_id FK -> CRIMINAL.criminal_id)
JAIL(location, criminal_id FK -> CRIMINAL.criminal_id UNIQUE, barrack_number, sentence)
CRIMINAL_PHOTO(photo_id PK, criminal_id FK -> CRIMINAL.criminal_id UNIQUE, photo_data, thumb_data, mime_type, file_size)
USERS(user_id PK, username UNIQUE, password_hash, role, is_active)
AUDIT_LOG(log_id PK, user_id, action, details, ip_address, created_at)
```

### Schema Notes
- **`` `rank` ``** is a MySQL 8 reserved word and is backticked in all queries.
- **`JAIL`** declares `criminal_id` as `UNIQUE` to maintain a 1:1 relationship between criminals and detention records.
- **`investigation_status`** values: `Open`, `Under Investigation`, `Closed`.
- Foreign key constraints enforce relational integrity: officers and criminals cannot be deleted if active cases or dependencies exist.

---

## Seed Data & System Verification

The database includes benchmark sample data:
- **Police (5 Officers)**:
  - 101: Rajesh Sharma (Inspector, Crime Branch)
  - 102: Amit Patil (Sub Inspector, Cyber Crime)
  - 103: Vikas Singh (Inspector, Crime Branch)
  - 104: Rohit Deshmukh (Sub Inspector, Traffic Branch — **0 cases**)
  - 105: Suresh Kumar (Inspector, Cyber Crime)
- **Criminals (6 Records)**:
  - 201: Rahul Verma (Age 28, Robbery, Officer 101)
  - 202: Sameer Khan (Age 35, Cyber Fraud, Officer 102)
  - 203: Akash More (Age 26, Theft, Officer 103)
  - 204: Vijay Shah (Age 40, Fraud, Officer 101)
  - 205: Karan Mehta (Age 30, Cyber Crime, Officer 105)
  - 206: Ramesh Patil (Age 38, Assault, Officer 103)
  - **Average Convict Age**: `(28 + 35 + 26 + 40 + 30 + 38) / 6 = 32.83`
- **Court Rooms**: 201 → Room 1, 202 → Room 2, 203 → Room 3, 204 → Room 4, 205 → Room 5 (206 has no court record).
- **Jail Records**:
  - 201: Arthur Road Jail, barrack b10, 5 Years
  - 203: Taloja Jail, barrack b12, 3 Years
  - 204: Yerwada Jail, barrack b15, 7 Years
  - 205: Arthur Road Jail, barrack b11, 2 Years
  - 206: Taloja Jail, barrack b13, 4 Years
  - (202 has no jail record).

---

## Setup & Installation

### Prerequisites
- **Node.js** (v18+)
- **MySQL Server 8.0** or compatible (e.g. TiDB)

### 1. Database Configuration

Initialize the database schema and seed the initial dataset:

```bash
# 1. Load database schema
mysql -u root -p < db/schema.sql

# 2. Populate demo data and accounts
mysql -u root -p < db/seed.sql

# 3. Apply authentication and photo migrations
mysql -u root -p crm_db < db/migrations/001_users_audit_log.sql
mysql -u root -p crm_db < db/migrations/002_criminal_photo.sql
```

### 2. Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crm_db

# Read-only user for SQL console
DB_READONLY_USER=crm_readonly
DB_READONLY_PASSWORD=crm_readonly_pass

JWT_SECRET=your_secure_random_jwt_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Install Dependencies

```bash
# Root utilities
npm install

# Backend
cd server
npm install
cd ..

# Frontend
cd client
npm install
cd ..
```

---

## Running the Application

To start both backend and frontend development servers concurrently:

```bash
npm run dev
```

- **Backend API Server**: `http://localhost:5000`
- **Frontend React Application**: `http://localhost:5173`

---

## Features & System Highlights

1. **Dashboard (`/`)**:
   - Aggregate metric cards: total criminals, total officers, average convict age (32.83), incarcerated count, court assigned count, and investigation status breakdown.
   - Schedular distribution bar chart: criminals per correctional facility.
   - Officer workload distribution table (including officers with 0 cases).
   - Real-time recent records feed.

2. **Criminals Registry (`/criminals`)**:
   - Full tabular listing backed by `LEFT JOIN` on `POLICE`, `COURT_RECORD`, and `JAIL`.
   - Multi-field search and filters (Status, Crime, Officer, Jail, Court Assigned, Incarcerated).
   - TanStack Table sorting, pagination, and CSV export.
   - Side drawer form for Add/Edit with age validation (18-100) and officer dropdown.
   - Foreign key constraint safety: prevents deletion if linked to court or jail records with human-readable error messages.

3. **Criminal Profile Dossier (`/criminals/:id`)**:
   - Individual case dossier showing joined personal details, officer card, judicial docket, and incarceration status.
   - Mugshot photo viewer with upload drawer and thumbnail rendering.
   - Case progression timeline.

4. **Police Officers Roster (`/police`) & Profile (`/police/:id`)**:
   - Roster table with caseload counts, age validation (21-65), and add/edit drawer.
   - Officer detail view displaying active investigations and workload distribution.
   - Protected deletion: blocks deleting an officer currently assigned to open cases.

5. **Court Records Docket (`/court-records`)**:
   - Judicial room mapping table.
   - Assign modal with dropdown restricted to unassigned criminals only.
   - Room reassignment and deletion.

6. **Jail Incarceration (`/jail`)**:
   - Prison registry with "All Inmates" table and "Group by Facility" view.
   - Incarceration modal with dropdown restricted to unassigned criminals only.
   - Edit and release (delete) actions.

7. **Query Explorer (`/queries`)**:
   - Implements **10 benchmark queries** categorized into Joins (1-3), Aggregates (4-7), and Subqueries (8-10):
     1. Criminal + Investigating Officer (`INNER JOIN`)
     2. Criminal + Court Room (`INNER JOIN`)
     3. Criminal + Jail Info (`INNER JOIN`)
     4. `COUNT(*)` of Criminals (`AGGREGATE`)
     5. `AVG(age)` of Criminals (`AGGREGATE`)
     6. Criminals per Officer (`LEFT JOIN` + `GROUP BY`)
     7. Criminals per Jail Location (`GROUP BY`)
     8. Criminals Older than Average (`SCALAR SUBQUERY`)
     9. Officers with >=1 Criminal (`IN SUBQUERY`)
     10. Criminals with Court Records (`IN SUBQUERY`)
   - Syntax-highlighted SQL blocks with instant Copy button.
   - Individual and batch "Run" buttons reporting execution time in milliseconds and dynamic tabular results.
   - **Read-Only SQL Console**: Accepts custom single `SELECT` queries with strict security checks (blocks `INSERT/UPDATE/DELETE/DROP/ALTER`, comments, multiple statements) and 500-row cap.

8. **Database Schema Page (`/schema`)**:
   - Interactive SVG ER diagram illustrating entity relationships and cardinalities.
   - Complete data dictionary and DDL script viewer.

9. **Global Features**:
   - Global search modal with shortcut (`Ctrl+K` / `Cmd+K`) and grouped results across all 4 entities.
   - Light / Dark theme toggle with persistent preference.
   - Toast notification alerts for all CRUD operations.

---

## Authentication & Role-Based Access Control (RBAC)

Complete authentication flow using **bcrypt** (cost 12) for password hashing and **JWT** stored in secure, `httpOnly`, `SameSite=Lax` cookies.

### User Roles
- **Admin**: Full access. Can create, edit, and delete records, run custom SQL in the console, view the Audit Log, and manage users.
- **Viewer**: Read-only access. Can view tables, profiles, and run saved queries in the Query Explorer, but cannot modify any data or access the free-form SQL console. Viewer profiles also have sensitive fields like police phone numbers and addresses permanently redacted.

### Security Features
- **Rate Limiting**: 5 failed login attempts per 15 minutes per IP + username returns `429 Too Many Requests`.
- **Timing Attack Resistance**: Uses constant-time `bcrypt.compare` even when a username does not exist.
- **CSRF Protection**: State-changing API requests require an `X-Requested-With` header.
- **Helmet**: Secures Express apps with hardened HTTP headers.
- **Audit Logging**: Every login, failed login, logout, create, update, delete, and custom SQL run is recorded securely in the database. Passwords are never logged.

### Default Accounts
The `seed.sql` script creates two initial accounts:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Viewer** | `viewer` | `viewer123` |

---

## Criminal Photo Upload & Storage Architecture

Mugshot identification photo management for criminal records, optimized for MySQL/TiDB and serverless deployment.

### Capabilities & Design
1. **BLOB Database Storage**:
   - Mugshots and thumbnails are stored directly in MySQL/TiDB as binary data (`MEDIUMBLOB` for compressed full photo, `BLOB` for 160x160 thumbnail).
   - Deleting a criminal record cascades to automatically remove the associated photo (`ON DELETE CASCADE`).
   - Query efficiency: `photo_data` and `thumb_data` BLOB columns are omitted from list and table queries to conserve bandwidth.
2. **Processing Pipeline**:
   - `multer` memory storage with a 4 MB upload limit.
   - Magic byte verification using `file-type` (permits only JPEG, PNG, WebP; rejects disguised file formats).
   - Compression via `sharp`: strips EXIF/GPS metadata, auto-rotates, and resizes to 600x600 WebP (`<= 150 KB`). Generates a 160x160 cropped WebP thumbnail (`<= 15 KB`).
   - Client-side pre-compression: draws to canvas before upload to minimize network payload.
3. **Role-Based Controls**:
   - **Admin**: Can upload, update, and delete mugshot photos.
   - **Viewer**: Read-only access to view served mugshots and thumbnails.

---

## Responsive Design & Mobile/Tablet Support

The application includes an adaptive, mobile-first interface supporting viewports from 320px width up to high-resolution desktop monitors.

### 1. Viewport Breakpoints
- **Mobile (< 768px)**:
  - Single-column stacked layouts across Dashboard metrics, dossiers, and forms.
  - Sticky primary Topbar (`h-14`) with tap targets `>= 44px`.
  - Tables automatically adapt into interactive Record Cards with search, filters, and pagination intact.
  - CRUD and edit forms render inside full-screen mobile drawers (`w-full inset-0`) with fixed bottom action bars.
  - Case Board operates in touch mode: pinch-to-zoom (0.3x–2.0x), multi-touch canvas panning, node drag, floating zoom controls, and bottom sheets for filters and node inspection.
- **Tablet (768px – 1023px)**:
  - 2-column dossier and dashboard grid reflow.
  - Dual presentation: Data tables display with horizontally scrolling containers and sticky left/right columns (`ID`, `Actions`).
  - Modal dialogs center with maximum width constraints (`max-w-lg`).
- **Desktop (>= 1024px)**:
  - Full multi-column dashboard and dossier grids.
  - Side-by-side forms and wide data tables.
  - Split-view Query Explorer and wide interactive SVG ER diagrams.

### 2. Collapsible Navigation Sidebar
- **Mobile (< 768px)**: Off-canvas drawer opened via Topbar hamburger button or edge gestures. Features backdrop overlay, auto-closing on route navigation, `Escape` key handling, focus trap, and body scroll lock.
- **Tablet (768px – 1023px)**: Default 64px icon rail. Tapping the expand trigger reveals navigation labels as an overlay positioned above main content without layout reflow. Closes on backdrop tap or `Escape`.
- **Desktop (>= 1024px)**: Full 240px sidebar collapsible to a 64px icon rail. State toggles with a 200ms width transition and persists across page reloads via `localStorage`.

### 3. Touch Targets & Accessibility
- All interactive controls (buttons, inputs, selects, tab triggers, modal dismissals) adhere to a minimum `44px x 44px` touch target size (`min-h-[44px]`).
- Form inputs prevent mobile auto-zoom via `text-base sm:text-sm` (16px base font size on touch screens).
- Color contrast meets WCAG AA standards.

### 4. Automated UI & Responsive Tests
The automated test suite runs 18 tests across 7 viewports (`320x640`, `360x740`, `390x844`, `768x1024`, `820x1180`, `1024x768`, and `1280x800`) for Admin and Viewer roles. It validates zero horizontal overflow, zero console errors, gesture handling, sidebar state persistence, and drawer focus trap.

```bash
# Run automated responsive tests:
cd client
npm run test:responsive
```
