# Temporary Manpower System

A full-stack Temporary Manpower Management System that connects employers with job seekers for short-term work.

## Tech Stack

- **Frontend:** HTML/CSS/JavaScript (responsive UI)
- **Backend:** Node.js + Express (REST API)
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt password hashing + role-based access control

## Features

### 1) User Roles
- Admin
- Employer
- Job Seeker

### 2) Authentication
- User registration and login
- Secure password hashing using `bcryptjs`
- JWT-based authentication
- Route-level role authorization

### 3) Employer Features
- Post job vacancies (title, description, location, duration, salary, required skills)
- Manage posted jobs
- View applicants for own jobs
- Accept or reject applicants

### 4) Job Seeker Features
- Create/update profile (availability, experience, skills)
- Search/filter jobs by location, salary, and duration
- Apply for jobs
- Track application status

### 5) Admin Features
- List users
- Remove users
- Remove fake/inappropriate jobs
- View platform statistics

## Project Structure

```text
.
├── backend
│   ├── package.json
│   ├── .env.example
│   ├── sql
│   │   ├── schema.sql
│   │   └── sample_data.sql
│   └── src
│       ├── config/db.js
│       ├── middleware/auth.js
│       ├── routes
│       │   ├── admin.js
│       │   ├── applications.js
│       │   ├── auth.js
│       │   ├── jobs.js
│       │   └── profiles.js
│       └── server.js
└── frontend
    ├── app.js
    ├── index.html
    └── styles.css
```

## Database Schema

The PostgreSQL schema includes:
- `users`
- `profiles`
- `skills`
- `user_skills`
- `jobs`
- `job_skills`
- `applications`

Run the SQL files in order:
1. `backend/sql/schema.sql`
2. `backend/sql/sample_data.sql`

## Setup Instructions

### 1. Clone and install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Update `DATABASE_URL` and `JWT_SECRET` in `.env`.

### 3. Create database and import schema

```bash
createdb temp_manpower
psql -d temp_manpower -f sql/schema.sql
psql -d temp_manpower -f sql/sample_data.sql
```

### 4. Run the application

```bash
npm run dev
```

Open: `http://localhost:5000`

## Key REST API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Jobs
- `GET /api/jobs`
- `POST /api/jobs` (Employer)
- `PUT /api/jobs/:id` (Employer/Admin)
- `DELETE /api/jobs/:id` (Employer/Admin)
- `GET /api/jobs/:id/applicants` (Employer)

### Job Seeker
- `PUT /api/profiles/me`
- `GET /api/profiles/me`
- `POST /api/applications/jobs/:jobId/apply`
- `GET /api/applications/me`

### Employer (Application Management)
- `PATCH /api/applications/:applicationId/status`

### Admin
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`
- `DELETE /api/admin/jobs/:id`
- `GET /api/admin/stats`

## Seeded Test Accounts

- Admin: `admin@tempmanpower.local` / `password`
- Employer: `employer@tempmanpower.local` / `password`
- Job Seeker: `worker@tempmanpower.local` / `password`

## Notes

- Frontend is intentionally simple and mobile-friendly.
- Backend serves frontend static files from `/frontend`.
