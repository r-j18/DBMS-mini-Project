# Criminal Record Management System (CRMS)
> DBMS Mini Project • Full-Stack Web Application

A full-stack, utilitarian web application designed for criminal record tracking, judicial docket management, police roster administration, and correctional facility oversight.

Built specifically for DBMS evaluation with **plain parameterized MySQL 8 queries** (no ORMs), visible hand-written SQL, strict validation, and comprehensive query performance instrumentation.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, TanStack Table v8, Lucide React icons.
- **Backend**: Node.js, Express, `mysql2/promise` (plain parameterized SQL only).
- **Database**: MySQL 8.0 (InnoDB engine, foreign keys with `ON UPDATE CASCADE ON DELETE RESTRICT`).

---

## Database Schema

```
POLICE(police_id PK, `rank`, name, branch, age, number, address)
CRIMINAL(criminal_id PK, name, age, crime, investigating_officer FK -> POLICE.police_id, investigation_status)
COURT_RECORD(court_room_number PK, criminal_id FK -> CRIMINAL.criminal_id)
JAIL(location, criminal_id FK -> CRIMINAL.criminal_id UNIQUE, barrack_number, sentence)
```

### Schema Notes
- **`` `rank` ``** is a MySQL 8 reserved word and is always backticked.
- **`JAIL`** declares `criminal_id` as `UNIQUE` to maintain a 1:1 relationship between criminals and detention records.
- **`investigation_status`** values: `Open`, `Under Investigation`, `Closed`.
- Foreign key constraints enforce relational integrity: officers and criminals cannot be deleted if active cases or dependencies exist.

---

## Seed Data & Report Verification

The database is seeded with exact benchmark data:
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
  - **Verified Average Age**: `(28 + 35 + 26 + 40 + 30 + 38) / 6 = 32.8333`
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
- Node.js (v18.0.0 or higher, v20+ recommended)
- MySQL Server (v8.0+)

### 1. Database Setup
Log in to MySQL and load the schema and seed scripts:

```bash
# Load schema (creates database crm_db and tables)
mysql -u root -p < db/schema.sql

# Populate initial benchmark records
mysql -u root -p < db/seed.sql
```

### 2. Environment Configuration
Copy `.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Verify your MySQL credentials in `server/.env`:
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
```

### 3. Install Dependencies
```bash
# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

---

## Running the Application

After setup, run the application locally with two commands (or one combined command):

### Option A: Run Both Together (Recommended)
```bash
npm run dev
```

### Option B: Run in Separate Terminals
**Terminal 1 (Backend Server):**
```bash
npm run server
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run client
# Client starts on http://localhost:5173
```

Open **`http://localhost:5173`** in your browser.

---

## Key Features & Evaluation Highlights

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
   - Case progression timeline (conditionally rendered only if timeline events exist).

4. **Police Officers Roster (`/police`) & Profile (`/police/:id`)**:
   - Roster table with caseload counts, age validation (21-65), and add/edit drawer.
   - Officer detail view displaying active investigations and workload distribution.
   - Protected deletion: blocks deleting an officer currently assigned to open cases.

5. **Court Records Docket (`/court-records`)**:
   - Judicial room mapping table.
   - Assign modal with dropdown **restricted to unassigned criminals only**.
   - Room reassignment and deletion.

6. **Jail Incarceration (`/jail`)**:
   - Prison registry with "All Inmates" table and "Group by Facility" view.
   - Incarceration modal with dropdown **restricted to unassigned criminals only**.
   - Edit and release (delete) actions.

7. **Query Explorer (`/queries`) — Viva Mode**:
   - Shows all **10 report queries** categorized into Joins (1-3), Aggregates (4-7), and Subqueries (8-10):
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
