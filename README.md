# Ansar-Ud-Deen School Management System (SMS)

Ansar-Ud-Deen School Management System is a modern, responsive, and feature-rich educational portal designed for administrators, teachers, students, and parents. It streamlines school operations, simplifies gradebook management, facilitates coursework submissions (including handwritten math sheets and PDFs), and tracks attendance, fees, and notices.

---

## 🌟 Key Features

### 🔑 Role-Based Portals

#### 🏛️ Administrator Portal (`/admin`)
* **Records & Staff Registry**: Manage profile registration cards, contact information, and assigned staff credentials for teachers and students.
* **Curriculum Configuration**: Add, edit, or delete classes, subjects, and teacher-to-subject allocations with cascade safety.
* **Timetable Builder**: Construct weekly schedules for classes with collision warnings.
* **Fee Records Manager**: Track fee payments, outstanding balances, and update receipts.
* **Broadcast Notice Board**: Send school-wide announcements or class-specific notifications.

#### 🎓 Teacher Portal (`/teacher`)
* **Assignments Workspace**: Create homework tasks with descriptions and due dates. View and grade submissions using a letter-based scale (A–F) with academic feedback remarks.
* **Math Sheet Previewer**: View images of handwritten calculations or PDFs inline on a side-by-side active grading panel.
* **Attendance Tracker**: Log daily student attendance with a simple status matrix (Present, Late, Absent).
* **Grade Entry Sheets**: Insert and save assessment scores directly into the academic database.
* **Schedules**: View class timetables.

#### 🧑‍🎓 Student Portal (`/student`)
* **Assignments Desk**: Track pending and graded coursework, type solutions, and upload attachments (images or PDFs up to 5MB).
* **Report Card View**: Access current and past grades, complete with teacher evaluation feedback.
* **Attendance Logs**: Monitor overall attendance rates and individual daily logs.
* **Fee Panel**: Review payment history, balance breakdowns, and invoice details.

#### 👪 Parent Portal
* **Multi-Child Dashboard**: Seamlessly switch between multiple children registered under the same parent email.
* **Academic Tracker**: Read-only access to homework tasks, grades, attendance logs, and school fee records for each child.

---

## 🎨 Premium UI & Design

* **Dynamic Theme Control**: Instantly toggle between Light and Dark Mode. Built with **Tailwind CSS v4** and CSS variables for a consistent look.
* **Zero Light Flash**: Incorporates inline hydration scripts to prevent screen flash on reload.
* **Dropdown & Field Readability**: Native dropdown lists (`<select>` and `<option>`) are styled for clear contrast in both dark and light modes.
* **Modal Overlay Engine**: Premium dialog modal confirmations for delete operations and forms, complete with smooth animations (`animate-in fade-in zoom-in-95 duration-150`).

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Next.js 16 (App Router, Turbopack)
* **Styling**: Tailwind CSS v4, CSS Variables, Lucide Icons
* **Database & Auth**: Supabase (PostgreSQL) + Auth
* **Offline Mock Mode**: Automatic fallback to local database mock simulations using browser `localStorage` if no Supabase environment variables are provided. Works offline out-of-the-box!

---

## 📦 Database Schema & Setup

The database utilizes relational PostgreSQL tables with foreign keys and cascade deletions. 

To configure Supabase, execute the SQL definitions found in `supabase/schema.sql` (or use the schema outline below) in your Supabase SQL Editor:

```sql
-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('admin', 'teacher', 'student', 'parent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Classes table
create table public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  level text not null check (level in ('primary', 'secondary')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Students table
create table public.students (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  class_id uuid references public.classes(id) on delete cascade not null,
  admission_no text not null unique,
  full_name text not null,
  parent_name text not null,
  parent_phone text,
  parent_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Mapped Class Subjects
create table public.class_subjects (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  subject_name text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  unique(class_id, subject_name)
);

-- Assignments
create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  class_subject_id uuid references public.class_subjects(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Submissions
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  submission_text text,
  file_url text,
  status text not null default 'submitted' check (status in ('submitted', 'graded')),
  grade text check (grade in ('A', 'B', 'C', 'D', 'E', 'F')),
  feedback text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  graded_at timestamp with time zone,
  unique(assignment_id, student_id)
);
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/SznImperial/Ansar-Ud-Deen-SMS.git
cd Ansar-Ud-Deen-SMS
npm install
```

### 2. Configure Environment Variables
Rename `.env.local.example` (or create a `.env.local` file) in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```
*Note: If these credentials are empty or omitted, the application will run in offline demo mode using localStorage fallback simulation.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

### 4. Build Production Bundle
```bash
npm run build
npm run start
```
