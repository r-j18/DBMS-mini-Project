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

### Prerequisites Installation (Windows & Ubuntu)
To run this project on a completely new system, you must first install **Node.js** and **MySQL Server**.

#### For Windows:
1. **Install Node.js**: Download and run the installer from [nodejs.org](https://nodejs.org/).
2. **Install MySQL**: Download the [MySQL Installer](https://dev.mysql.com/downloads/installer/) and run it. Choose "Server Only" or "Developer Default". Remember the root password you set during installation!
3. **Add MySQL to PATH**: Ensure `C:\Program Files\MySQL\MySQL Server 8.0\bin` (or similar) is added to your System Environment Variables `PATH` so you can run the `mysql` command from the terminal.

#### For Ubuntu / Debian Linux:
Run the following commands in your terminal to install both:
```bash
# Update package list
sudo apt update

# Install Node.js and npm
sudo apt install -y nodejs npm

# Install MySQL Server
sudo apt install -y mysql-server

# Secure your MySQL installation and set a root password
sudo mysql_secure_installation
```

---

### 1. Database Configuration (Minimal Setup)

Once MySQL is installed, open your terminal (or Command Prompt) in the root of the project directory and run the following commands to create the database and seed the data.

*(When prompted, enter your MySQL root password)*:

```bash
# 1. Load the database schema (creates the database and tables)
mysql -u root -p < db/schema.sql

# 2. Populate the tables with demo data and user accounts
mysql -u root -p < db/seed.sql
```

### 2. Environment Variables

Navigate into the `server` directory and copy the `.env.example` file to create your local `.env` file:

**Ubuntu / Mac:**
```bash
cp server/.env.example server/.env
```
**Windows:**
```cmd
copy server\.env.example server\.env
```

Open `server/.env` in a text editor and **update the MySQL password** to match the root password you set during installation:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password   <-- UPDATE THIS!
DB_NAME=crm_db

# Read-only user for SQL console
DB_READONLY_USER=crm_readonly
DB_READONLY_PASSWORD=crm_readonly_pass
```

### 3. Install NPM Dependencies

From the root project folder, install the necessary packages for both the backend and frontend:

```bash
# Install root utility dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

---

## Running the Application

After the setup is complete, you can start both the frontend and backend servers simultaneously from the root project folder using a single command:

```bash
npm run dev
```

This will automatically launch:
- **Backend API Server** on `http://localhost:5000`
- **Frontend React Application** on `http://localhost:5173`

*(Alternatively, you can run them in separate terminals by running `npm run server` in one window and `npm run client` in another).*

Open your browser and navigate to **`http://localhost:5173`** to view the application!

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

---

## Authentication & Role-Based Access Control (RBAC)

The system includes a complete authentication flow using **bcrypt** (cost 12) for password hashing and **JWT** stored in secure, `httpOnly`, `SameSite=Lax` cookies.

### User Roles
- **Admin**: Full access. Can create, edit, and delete records, run custom SQL in the console, view the Audit Log, and manage users.
- **Viewer**: Read-only access. Can view tables, profiles, and run saved queries in the Query Explorer, but cannot modify any data or access the free-form SQL console. Viewer profiles also have sensitive fields like police phone numbers and addresses permanently redacted.

### Security Features
- **Rate Limiting**: 5 failed login attempts per 15 minutes per IP + username returns a `429 Too Many Requests`.
- **Timing Attack Resistance**: Uses a constant-time `bcrypt.compare` even when a username does not exist.
- **CSRF Protection**: State-changing API requests require an `X-Requested-With` header.
- **Helmet**: Secures Express apps by setting various HTTP headers.
- **Audit Logging**: Every login, failed login, logout, create, update, delete, and custom SQL run is recorded securely in the database. Passwords are never logged.

### Environment Variables
Ensure the following variables are present in `server/.env`:
```env
JWT_SECRET=your_secure_random_jwt_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Demo Credentials
The `seed.sql` creates two initial accounts:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Viewer** | `viewer` | `viewer123` |

> *Note: Please change these passwords upon first login via the user menu in the top right.*

### Creating Users Script
An admin can manage users via the `/users` dashboard. Alternatively, you can generate bcrypt hashes or seed users via the provided script:
```bash
cd server
node scripts/create-user.js <username> <password> <role>
```

---

## Criminal Photo Upload & Preview Deployment (`feature/criminal-photos`)

This branch introduces binary mugshot identification photo management for criminal records, optimized for Vercel Serverless and TiDB Cloud.

### Architecture & Capabilities
1. **BLOB Database Storage**:
   - Vercel serverless execution is read-only and ephemeral. Photos are stored directly in TiDB / MySQL as binary data (`MEDIUMBLOB` for compressed full photo, `BLOB` for 160x160 thumbnail).
   - Deleting a criminal automatically cascades to remove the corresponding photo record (`ON DELETE CASCADE`).
   - Query efficiency: `photo_data` and `thumb_data` BLOB columns are **never** selected in list or join queries. The list and dossier detail endpoints only `LEFT JOIN CRIMINAL_PHOTO` for `has_photo` and `photo_updated_at`.
2. **Processing Pipeline**:
   - `multer` memory storage with a strict 4 MB limit on field `photo`.
   - Magic byte verification using `file-type` (permits only JPEG, PNG, WebP; strictly rejects SVG, GIF, PDF, HTML, or disguised files).
   - Server-side compression via `sharp`: strips all metadata/EXIF/GPS, auto-rotates, fits within 600x600 WebP at quality stepping (80 -> 70 -> 60 -> 50) guaranteeing `<= 150 KB`. Generates a 160x160 cover-cropped WebP thumbnail `<= 15 KB`.
   - Client-side pre-compression: draws to canvas (max 800px on longest side, quality 0.8 WebP/JPEG) ensuring uploads are well under 1 MB.
3. **Role-Based Access Control**:
   - **Admin**: Can upload, change, and delete mugshot photos.
   - **Viewer**: Read-only access to view served photos and thumbnails. Upload/delete controls are hidden and return `403 Forbidden` if accessed directly. Unauthenticated requests return `401 Unauthorized`.
4. **Caching & Cache-Busting**:
   - Full photo and thumbnail endpoints set `Cache-Control: private, max-age=300`, `X-Content-Type-Options: nosniff`, and custom ETags (`photo_id + uploaded_at`). Honors `If-None-Match` with `304 Not Modified`.
   - Client URLs include cache-busting query strings `?v=<photo_updated_at>`.

### New Environment Variables

Add to your environment configuration as needed:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DB_SSL` | `false` | Set to `true` to enable TLS in mysql2 (`{ minVersion: 'TLSv1.2', rejectUnauthorized: true }`) for TiDB Cloud. Local MySQL works when unset. |
| `DB_CONNECTION_LIMIT` | `2` | Connection pool limit for serverless instances (module-scoped pool reuse). |

### Database Migration

To apply the photo storage table to an existing database:
```bash
# Production / Local manual migration:
mysql -u <user> -p <db_name> < db/migrations/002_criminal_photo.sql
```

### Preview Deployment with TiDB Cloud

Vercel Preview deployments use a dedicated, isolated TiDB database (e.g. `criminal_records_preview`) via Preview-scoped environment variables.

1. Create a local, gitignored `.env.preview` file:
   ```env
   DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
   DB_PORT=4000
   DB_USER=xxxx.root
   DB_PASSWORD=your_preview_password
   DB_NAME=criminal_records_preview
   DB_SSL=true
   ```
2. Run the automated preview migration script:
   ```bash
   ./db/apply-preview.sh
   ```
   This script runs built-in safety checks (refuses to run if the database target resembles production), and applies the following in order:
   - `db/schema.sql`
   - `db/seed.sql`
   - `db/migrations/001_users_audit_log.sql`
   - `db/migrations/002_criminal_photo.sql`

