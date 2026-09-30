Build a complete full-stack web app for a DBMS mini project: "Criminal Record Management System". Frontend is the priority, but it needs a thin working backend so every screen runs on a real database.

## Stack
- Frontend: React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Table (sorting/filtering/pagination), lucide-react icons only.
- Backend: Node.js + Express + mysql2 (MySQL 8). Plain parameterized SQL, no ORM. The project is graded on SQL, so the SQL must be visible and hand-written.
- Provide schema.sql, seed.sql, .env.example, and a README with setup steps (install, create DB, run seed, start both servers). It must run locally with two commands after setup.

## Database schema (use exactly this, do not redesign it)
POLICE(police_id PK, `rank`, name, branch, age, number, address)
CRIMINAL(criminal_id PK, name, age, crime, investigating_officer FK -> POLICE.police_id, investigation_status)
COURT_RECORD(court_room_number PK, criminal_id FK -> CRIMINAL.criminal_id)
JAIL(location, criminal_id FK -> CRIMINAL.criminal_id, barrack_number, sentence)

Notes:
- `rank` is a reserved word in MySQL 8. Always backtick it.
- JAIL has no declared PK. Make criminal_id UNIQUE in JAIL so one criminal has one jail record.
- investigation_status values: Open, Under Investigation, Closed.
- Seed data must reproduce the report's outputs:
  - Police 101 Rajesh Sharma (Inspector, Crime Branch), 102 Amit Patil (Sub Inspector, Cyber Crime), 103 Vikas Singh (Inspector, Crime Branch), 104 Rohit Deshmukh (no cases), 105 Suresh Kumar (Inspector, Cyber Crime).
  - Criminals 201 Rahul Verma (Robbery, officer 101), 202 Sameer Khan (Cyber Fraud, 102, age 35), 203 Akash More (Theft, 103), 204 Vijay Shah (Fraud, 101, age 40), 205 Karan Mehta (Cyber Crime, 105), 206 Ramesh Patil (Assault, 103, age 38). Pick ages for 201, 203, 205 so the average age is 32.8333.
  - Court rooms: 201->1, 202->2, 203->3, 204->4, 205->5 (206 has no court record).
  - Jail: 201 Arthur Road Jail b10 5 Years; 203 Taloja Jail b12 3 Years; 204 Yerwada Jail b15 7 Years; 205 Arthur Road Jail b11 2 Years; 206 Taloja Jail b13 4 Years (202 has no jail record).
  - Fill in plausible ages, phone numbers, and Mumbai/Pune addresses for police.

## Pages / features
1. Dashboard
   - Stat cards: total criminals, total officers, cases by status, criminals in jail, criminals with court records, average criminal age.
   - Bar chart: criminals per jail location. Table: criminals per officer (including officers with 0).
   - Small "Recent records" list. These must be backed by real aggregate queries.

2. Criminals (main page)
   - Data table showing criminal + investigating officer + court room + jail location via LEFT JOINs. Sort, search (name/ID/crime), filter by status, crime, officer, jail, "has court record", "is jailed". Pagination.
   - Add / edit / delete via side drawer or modal. Officer is a dropdown, not free text.
   - Clicking a row opens a Criminal Profile page: personal info, officer card, court record, jail record and sentence, all from joins. Include a "case timeline" section only if data exists; otherwise omit it.

3. Police
   - Table with the same sort/filter/search. Add / edit / delete.
   - Detail view listing the criminals that officer investigates. Show a workload count.

4. Court Records
   - Table of court room -> criminal. Assign a criminal to a court room, reassign, remove. The criminal dropdown should only list criminals who aren't already assigned.

5. Jail
   - Table of jail records. Assign / edit / remove. Group-by-location view with counts. Only unassigned criminals in the dropdown.

6. Query Explorer (important for the viva)
   - Lists all 10 queries from the project report, grouped as Joins (1-3), Aggregates (4-7), Subqueries (8-10).
   - Each shows: title, plain-English description, the exact SQL in a monospace block with syntax highlighting and a copy button, a "Run" button, and the result in a table with row count and execution time.
   - Queries: 
     1. criminal + investigating officer (JOIN)
     2. criminal + court room (JOIN)
     3. criminal + jail info (JOIN)
     4. COUNT of criminals
     5. AVG age
     6. criminals per officer (LEFT JOIN + GROUP BY)
     7. criminals per jail location (GROUP BY)
     8. criminals older than average (subquery)
     9. officers investigating >=1 criminal (IN subquery)
     10. criminals with a court record (IN subquery)
   - Add a read-only SQL console below: textarea, Run, accepts SELECT only. The backend must reject anything that isn't a single SELECT statement (block INSERT/UPDATE/DELETE/DROP/ALTER, multiple statements, comments), use a read-only DB user or transaction, and cap results at 500 rows.

7. Schema page
   - Shows the 4 tables with columns, types, PK/FK markers, and the relationships (an ER-style diagram drawn in SVG or a simple relationship list). Keep it clean.

8. Global
   - Global search bar (criminal name/ID, officer name) with grouped results.
   - Export current table view to CSV.
   - Form validation (required fields, age 18-100 for criminals, 21-65 for police, numeric IDs). Show FK errors from the DB as human-readable messages ("Cannot delete: officer is assigned to 2 criminals").
   - Delete confirmation dialogs. Toast notifications for success/error. Loading skeletons and empty states.
   - Responsive down to tablet. Keyboard-accessible, proper labels, visible focus rings.

## REST API
GET/POST/PUT/DELETE for /api/police, /api/criminals, /api/court-records, /api/jail. GET /api/dashboard, GET /api/queries and POST /api/queries/:id/run, POST /api/sql (read-only console). Consistent JSON errors. Validate input server-side, use parameterized queries only, enable CORS for the dev origin.

## Visual design (strict)
- Clean, sober, utilitarian. Think internal government/records software or Linear-lite, not a startup landing page.
- Light theme by default, with a plain dark theme toggle. Off-white/gray backgrounds, white surfaces, 1px solid borders (gray-200), radius 6px max.
- One muted accent color (slate blue or deep teal) used only for primary buttons, links, active nav, and focus rings. Status badges use flat muted tints (green/amber/gray), no saturated colors.
- ABSOLUTELY NO: gradients, glows, neon, glassmorphism/backdrop blur, glowing borders, drop-shadow-heavy cards, animated backgrounds, blob shapes, emojis, "AI" sparkle iconography, hero sections, marketing copy, oversized rounded pills, purple/pink palettes.
- Shadows: none, or a single very subtle one on modals/drawers only.
- Typography: Inter or system-ui, 14px base, tabular numbers for IDs and counts, monospace only for SQL and IDs.
- Layout: fixed left sidebar (text + small icons), top bar with global search, content max-width ~1280px. Tables are dense, with sticky headers, subtle row hover, and right-aligned numerics.
- Motion: only quick (<150ms) opacity/transform transitions for drawers, modals, and toasts. No decorative animation.
- Copy is plain and literal ("Add criminal", "Save changes"). No exclamation marks, no cute microcopy.

## Deliverable expectations
- Clean folder structure (client/, server/, db/), reusable components (DataTable, Drawer, ConfirmDialog, StatusBadge, SqlBlock), typed API client, no dead code, no placeholder "lorem ipsum" or fake screens.
- Every button must do something real. Run it, fix errors, and verify all 10 queries return the same results as in the report before finishing.
