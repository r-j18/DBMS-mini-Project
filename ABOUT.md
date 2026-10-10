# Criminal Record Management System - Viva Preparation Guide

This document provides a comprehensive technical breakdown of the project to help you answer questions during your DBMS Viva examination.

## 1. Database Architecture & Schema

The project uses a relational database built on **MySQL**. It uses raw SQL queries rather than an ORM (Object-Relational Mapper) to demonstrate a deep understanding of database management, SQL execution, and connection pooling.

### Core Tables & Relationships

1. **`POLICE` Table (The Parent Entity)**
   - **Primary Key**: `police_id`
   - **Columns**: `rank`, `name`, `branch`, `age`, `number`, `address`.
   - **Purpose**: Stores the roster of investigating officers.

2. **`CRIMINAL` Table (The Central Entity)**
   - **Primary Key**: `criminal_id`
   - **Foreign Key**: `investigating_officer` references `POLICE(police_id)` with `ON DELETE RESTRICT`.
   - **Columns**: `name`, `age`, `crime`, `investigation_status`.
   - **Purpose**: Stores criminal profiles and tracks which officer is currently handling their case. The `RESTRICT` constraint ensures you cannot delete an officer if they are actively investigating a case.

3. **`COURT_RECORD` Table (1-to-1/0 mapping to Criminal)**
   - **Primary Key**: `record_id`
   - **Foreign Key**: `criminal_id` references `CRIMINAL(criminal_id)` with `ON DELETE CASCADE`.
   - **Columns**: `court_room`
   - **Purpose**: Tracks trial dockets. If a criminal record is deleted, their court record is automatically deleted (Cascade).

4. **`JAIL` Table (1-to-1/0 mapping to Criminal)**
   - **Primary Key**: `jail_id`
   - **Foreign Key**: `criminal_id` references `CRIMINAL(criminal_id)` with `ON DELETE CASCADE`.
   - **Columns**: `location`, `barrack_number`, `time_served`.
   - **Purpose**: Tracks incarceration details.

### Security & System Tables

5. **`USERS` Table**
   - **Columns**: `user_id`, `username` (UNIQUE), `password_hash`, `role` (ENUM: 'admin', 'viewer'), `is_active`.
   - **Purpose**: Manages application access and Role-Based Access Control (RBAC).

6. **`AUDIT_LOG` Table**
   - **Columns**: `log_id`, `user_id`, `action` (Create, Update, Delete, Login, Query), `details`, `ip_address`, `created_at`.
   - **Purpose**: An immutable ledger that tracks every significant action taken by any user in the system for accountability.

### Advanced SQL Implementation (Query Explorer)
The system demonstrates 10 complex queries categorized into:
- **Joins**: Retrieving complete case files using `LEFT JOIN` and `INNER JOIN` across the four core tables.
- **Aggregates**: Calculating the average age of criminals or grouping cases by correctional facility (`GROUP BY`).
- **Subqueries**: Identifying criminals older than the overall average (`SCALAR SUBQUERY`) or officers handling one or more active cases (`IN SUBQUERY`).

---

## 2. The Backend (Node.js & Express)

The backend acts as an API bridge between the React frontend and the MySQL database. 

### Key Technical Choices:
- **No ORM**: Uses `mysql2/promise` to write and execute raw, parameterized SQL queries.
- **Connection Pooling**: Reuses database connections to handle multiple concurrent API requests efficiently.
- **Parameterized Queries**: Every user input is passed as a parameterized variable (e.g., `WHERE name = ?`) to completely eliminate the risk of **SQL Injection**.

### Live SQL Console Security
The backend features an endpoint (`/api/queries/custom`) that allows admins to execute raw SQL. To make this safe:
1. It parses the string to ensure it strictly begins with `SELECT` (ignoring whitespace/casing).
2. It forbids multi-statements (`;`), comments (`--`, `/*`), and altering commands (`DROP`, `DELETE`, `UPDATE`, `INSERT`).
3. **Database Level Defense**: It logs into MySQL using a completely separate user account (`crm_readonly`) that only possesses `GRANT SELECT` permissions. Even if the regex filter fails, MySQL will physically reject any destructive command.

---

## 3. Authentication & Login System

The authentication flow is built entirely from scratch to mimic enterprise security standards.

### How it Works (The Flow):
1. **Login Request**: The user enters their credentials.
2. **Password Verification**: The backend retrieves the user by `username` and uses `bcrypt.compare()` to hash the incoming password and compare it against the `password_hash` in the database. 
3. **Token Generation**: If successful, the server signs a **JWT (JSON Web Token)** containing the user's ID and role using a secret key.
4. **Secure Delivery**: The JWT is sent back to the browser inside an `httpOnly`, `SameSite=Lax` Cookie. 
   - *Viva Note: Using `httpOnly` cookies is much more secure than `localStorage` because malicious JavaScript (XSS attacks) cannot read the token.*
5. **Session Validation**: Every subsequent API request reads the cookie, verifies the JWT signature, and identifies the user.

### Security Hardening:
- **Rate Limiting**: Limits users to 5 failed login attempts per 15 minutes to prevent brute-force credential stuffing.
- **Timing Attack Mitigation**: Runs `bcrypt` comparisons even if the user doesn't exist, so attackers can't guess valid usernames based on response times.

---

## 4. The Frontend (React + TypeScript)

The frontend is a **Single Page Application (SPA)** built with React, styled using Tailwind CSS, and bundled by Vite.

### Key Architecture:
- **Auth Context (`AuthContext.tsx`)**: Provides global state for the logged-in user. It wraps the entire application and forces an automatic logout if the user is idle (no mouse movement/typing) for 30 minutes.
- **Protected Routes**: Uses a `<ProtectedRoute>` wrapper to prevent unauthorized users from manually navigating to `/login` if already authenticated, or `/users` if they are not an admin.
- **Role-Based Access Control (RBAC) UI**: 
  - Admin users see the full interface.
  - Viewer users see a restricted interface. Form components (Add, Edit, Delete) are conditionally hidden.
  - Furthermore, if a viewer accesses an officer's profile, the backend explicitly nullifies sensitive data (like phone numbers and addresses) before transmitting it. The frontend detects this and renders a permanent `<Redacted>` block over the field to ensure zero data leakage.

### Aesthetic Design:
The UI uses a strict "Case File" / "Manila Folder" design system, relying on typewriter fonts, custom SVGs for pushpins and red strings (in the Case Board), and randomized rotation degrees on "rubber stamp" badges to simulate a physical police dossier.
