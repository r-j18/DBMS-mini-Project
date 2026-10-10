# Criminal Record Management System - Technical Architecture & Reference Guide

This document provides a comprehensive technical breakdown of the system architecture, schema design, security mechanisms, and full-stack implementation details.

## 1. Database Architecture & Schema

The project uses a relational database built on **MySQL**. It uses raw SQL queries rather than an ORM (Object-Relational Mapper) to demonstrate direct database management, optimized SQL execution, and connection pooling.

### Core Tables & Relationships

1. **`POLICE` Table (Parent Entity)**
   - **Primary Key**: `police_id`
   - **Columns**: `rank`, `name`, `branch`, `age`, `number`, `address`.
   - **Purpose**: Stores the roster of investigating officers.

2. **`CRIMINAL` Table (Central Entity)**
   - **Primary Key**: `criminal_id`
   - **Foreign Key**: `investigating_officer` references `POLICE(police_id)` with `ON DELETE RESTRICT`.
   - **Columns**: `name`, `age`, `crime`, `investigation_status`.
   - **Purpose**: Stores criminal profiles and tracks which officer is currently handling their case. The `RESTRICT` constraint ensures an officer cannot be deleted if actively assigned to a case.

3. **`COURT_RECORD` Table (1-to-1 Mapping with Criminal)**
   - **Primary Key**: `court_room_number`
   - **Foreign Key**: `criminal_id` references `CRIMINAL(criminal_id)` with `ON UPDATE CASCADE ON DELETE RESTRICT`.
   - **Columns**: `court_room_number`, `criminal_id`.
   - **Purpose**: Tracks judicial docket and trial room allocations.

4. **`JAIL` Table (1-to-1 Unique Mapping with Criminal)**
   - **Primary Key / Unique**: `criminal_id` references `CRIMINAL(criminal_id)` with `ON UPDATE CASCADE ON DELETE RESTRICT`.
   - **Columns**: `location`, `barrack_number`, `sentence`, `criminal_id`.
   - **Purpose**: Tracks incarceration details and facility barrack assignments.

### Security & System Tables

5. **`USERS` Table**
   - **Columns**: `user_id`, `username` (UNIQUE), `password_hash`, `role` (ENUM: 'admin', 'viewer'), `is_active`.
   - **Purpose**: Manages application access and Role-Based Access Control (RBAC).

6. **`AUDIT_LOG` Table**
   - **Columns**: `log_id`, `user_id`, `action` (Create, Update, Delete, Login, Query), `details`, `ip_address`, `created_at`.
   - **Purpose**: An immutable ledger that tracks significant actions taken by users in the system for accountability.

7. **`CRIMINAL_PHOTO` Table**
   - **Columns**: `photo_id`, `criminal_id` (UNIQUE, FK -> `CRIMINAL.criminal_id` ON DELETE CASCADE), `photo_data` (MEDIUMBLOB), `thumb_data` (BLOB), `mime_type`, `file_size`, `updated_at`.
   - **Purpose**: Stores binary mugshot photos and thumbnails directly in MySQL/TiDB.

### SQL Implementation (Query Explorer)
The system implements 10 complex queries categorized into:
- **Joins**: Retrieving complete case files using `LEFT JOIN` and `INNER JOIN` across the core tables.
- **Aggregates**: Calculating the average age of criminals or grouping cases by correctional facility (`GROUP BY`).
- **Subqueries**: Identifying criminals older than the overall average (`SCALAR SUBQUERY`) or officers handling one or more active cases (`IN SUBQUERY`).

---

## 2. The Backend (Node.js & Express)

The backend acts as an API bridge between the React frontend and the MySQL database. 

### Key Technical Choices:
- **No ORM**: Uses `mysql2/promise` to execute raw, parameterized SQL queries.
- **Connection Pooling**: Reuses database connections to handle concurrent API requests efficiently.
- **Parameterized Queries**: Every user input is passed as a parameterized variable to eliminate SQL injection risks.

### Live SQL Console Security
The backend features an endpoint (`/api/queries/custom`) allowing administrators to execute custom queries. Security layers include:
1. Validating that input strictly begins with `SELECT`.
2. Blocking multiple statements (`;`), comments (`--`, `/*`), and mutating commands (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`).
3. **Database-Level Defense**: Authenticating against a dedicated read-only user (`crm_readonly`) that only possesses `GRANT SELECT` privileges.

---

## 3. Authentication & Login System

The authentication flow is built with industry-standard cryptographic practices.

### Implementation:
1. **Password Hashing**: Uses `bcrypt` (cost 12) for secure password storage and constant-time verification.
2. **Token Generation**: Signs a **JWT (JSON Web Token)** containing user ID and role upon successful authentication.
3. **Cookie Storage**: The JWT is delivered via `httpOnly`, `SameSite=Lax` cookies, preventing client-side script access and mitigating XSS token theft.
4. **Session Handling**: API requests validate the JWT signature, check user active status in the database, and verify permissions.
5. **Rate Limiting & Security**: Implements 5 failed attempts per 15-minute window rate limiting, dummy password hashing against timing attacks, CSRF token header verification (`X-Requested-With`), and Helmet security headers.

---

## 4. The Frontend (React + TypeScript)

The frontend is a **Single Page Application (SPA)** built with React 18, TypeScript, Tailwind CSS, and Vite.

### Architecture Highlights:
- **Authentication State**: Global user state managed via React Context (`AuthContext.tsx`) with automatic 30-minute idle session timeout.
- **Role-Based Access Control (RBAC)**:
  - Admin users have full access to CRUD operations, SQL console, audit logs, and user management.
  - Viewer users have read-only access. Mutation controls are hidden, and sensitive officer fields (phone number, address) are automatically redacted.
- **Responsive Layout**: Adaptive layout across mobile (<768px), tablet (768px-1023px), and desktop (>=1024px) with collapsible sidebar, drawer modals, and touch-optimized case board.
- **Design System**: A utilitarian "Bureau / Detective Archive" dossier theme using monospace typefaces, document stamps, and file folder card styling.
