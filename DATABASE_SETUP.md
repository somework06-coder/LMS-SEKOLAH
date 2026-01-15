# LMS Sekolah - Database Setup

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon key** from Project Settings > API

### 2. Configure Environment
Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Database Schema
1. Go to Supabase Dashboard > SQL Editor
2. Copy and run the contents of `database_schema.sql`

### 4. Create Admin User
Run this SQL in Supabase SQL Editor to create the first admin user:

```sql
-- Generate password hash for 'admin123'
-- You can use bcrypt to generate your own hash

INSERT INTO users (username, password_hash, full_name, role) 
VALUES (
  'admin', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'Administrator', 
  'ADMIN'
);
```

**Default credentials:**
- Username: `admin`
- Password: `password` (you should change this!)

### 5. Start the Application
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The database contains 13 tables:
- `users` - All user accounts
- `sessions` - Login sessions
- `academic_years` - School years
- `classes` - Classes by year
- `teachers` - Teacher profiles
- `students` - Student profiles (linked to class)
- `subjects` - Subjects/courses
- `teaching_assignments` - Teacher → Class → Subject mapping
- `materials` - Learning materials
- `assignments` - Tasks and exams
- `questions` - Questions for assignments
- `student_submissions` - Student answers
- `grades` - Scores and feedback

## User Roles

| Role | Capabilities |
|------|-------------|
| ADMIN | Manage all users, classes, subjects, teaching assignments |
| GURU | Upload materials, create assignments, grade submissions |
| SISWA | View materials, submit assignments, view grades |
