-- Supabase Database Schema for Ansar-Ud-Deen School Management System

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table (Extends Supabase Auth)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    email text not null unique,
    role text not null check (role in ('admin', 'teacher', 'student', 'parent')),
    password_changed boolean not null default false,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. TEACHERS Table (Teacher metadata)
create table public.teachers (
    id uuid references public.profiles(id) on delete cascade primary key,
    phone text,
    specialization text,
    qualification text,
    joined_date date default current_date not null
);

-- 3. CLASSES Table
create table public.classes (
    id uuid default gen_random_uuid() primary key,
    name text not null unique, -- e.g., 'JSS 1A', 'Basic 3'
    level text not null check (level in ('primary', 'secondary')),
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. STUDENTS Table
create table public.students (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles(id) on delete set null, -- Optional parent/student profile link
    class_id uuid references public.classes(id) on delete cascade not null,
    admission_no text not null unique,
    full_name text not null,
    parent_name text not null,
    parent_phone text,
    parent_email text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. SUBJECTS Table
create table public.subjects (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    code text not null unique,
    level text not null check (level in ('primary', 'secondary'))
);

-- 6. CLASS_SUBJECTS Table (Pivot linking Class + Subject + Teacher)
create table public.class_subjects (
    id uuid default gen_random_uuid() primary key,
    class_id uuid references public.classes(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    teacher_id uuid references public.profiles(id) on delete set null, -- Nullable if teacher leaves or unassigned
    unique (class_id, subject_id)
);

-- 7. TIMETABLE_SLOTS Table
create table public.timetable_slots (
    id uuid default gen_random_uuid() primary key,
    class_subject_id uuid references public.class_subjects(id) on delete cascade not null,
    day_of_week text not null check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
    start_time time not null,
    end_time time not null,
    room text not null,
    check (start_time < end_time)
);

-- 8. ATTENDANCE Table (Linked to class_subjects as per rule)
create table public.attendance (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    class_subject_id uuid references public.class_subjects(id) on delete cascade not null,
    date date default current_date not null,
    status text not null check (status in ('present', 'absent', 'late')),
    remarks text,
    unique (student_id, class_subject_id, date)
);

-- 9. GRADES Table (Linked to class_subjects as per rule)
create table public.grades (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    class_subject_id uuid references public.class_subjects(id) on delete cascade not null,
    term text not null check (term in ('1st Term', '2nd Term', '3rd Term')),
    academic_year text not null, -- e.g., '2025/2026'
    ca_score numeric not null default 0 check (ca_score >= 0 and ca_score <= 40),
    exam_score numeric not null default 0 check (exam_score >= 0 and exam_score <= 60),
    total_score numeric generated always as (ca_score + exam_score) stored,
    grade text not null, -- A, B, C, D, E, F
    unique (student_id, class_subject_id, term, academic_year)
);

-- 10. FEE_RECORDS Table
create table public.fee_records (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    term text not null check (term in ('1st Term', '2nd Term', '3rd Term')),
    academic_year text not null,
    amount_owed numeric not null default 0 check (amount_owed >= 0),
    amount_paid numeric not null default 0 check (amount_paid >= 0),
    status text not null check (status in ('paid', 'partial', 'unpaid')),
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    unique (student_id, term, academic_year)
);

-- 11. NOTIFICATIONS Table
create table public.notifications (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    content text not null,
    audience_type text not null check (audience_type in ('all', 'class', 'student')),
    audience_id uuid, -- Links to class_id or student_id depending on audience_type
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.attendance enable row level security;
alter table public.grades enable row level security;
alter table public.fee_records enable row level security;
alter table public.notifications enable row level security;

-- ----------------------------------------------------
-- RLS POLICIES
-- ----------------------------------------------------

-- Admin Policy (Full Access)
-- Creates helper function to check if user is an admin
create or replace function public.is_admin()
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql;

create or replace function public.is_teacher()
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
end;
$$ language plpgsql;

-- 1. Profiles Policies
create policy "Admins have full access to profiles" on public.profiles
  for all using (public.is_admin());
create policy "Users can read their own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 2. Teachers Policies
create policy "Admins have full access to teachers" on public.teachers
  for all using (public.is_admin());
create policy "Teachers can read their own details" on public.teachers
  for select using (auth.uid() = id);

-- 3. Classes Policies
create policy "Admins have full access to classes" on public.classes
  for all using (public.is_admin());
create policy "Teachers and students can read classes" on public.classes
  for select using (true);

-- 4. Students Policies
create policy "Admins have full access to students" on public.students
  for all using (public.is_admin());
create policy "Teachers can view students" on public.students
  for select using (public.is_teacher());
create policy "Students/Parents can read their own student records" on public.students
  for select using (
    auth.uid() = profile_id or 
    parent_email = (select email from public.profiles where id = auth.uid())
  );

-- 5. Subjects Policies
create policy "Admins have full access to subjects" on public.subjects
  for all using (public.is_admin());
create policy "Anyone authenticated can read subjects" on public.subjects
  for select using (auth.role() = 'authenticated');

-- 6. Class Subjects Policies
create policy "Admins have full access to class_subjects" on public.class_subjects
  for all using (public.is_admin());
create policy "Anyone authenticated can read class_subjects" on public.class_subjects
  for select using (auth.role() = 'authenticated');

-- 7. Timetable Slots Policies
create policy "Admins have full access to timetable_slots" on public.timetable_slots
  for all using (public.is_admin());
create policy "Anyone authenticated can read timetable_slots" on public.timetable_slots
  for select using (auth.role() = 'authenticated');

-- 8. Attendance Policies
create policy "Admins have full access to attendance" on public.attendance
  for all using (public.is_admin());
create policy "Teachers can modify attendance for their assigned class_subjects" on public.attendance
  for all using (
    exists (
      select 1 from public.class_subjects
      where id = class_subject_id and teacher_id = auth.uid()
    )
  );
create policy "Students/Parents can view their own attendance" on public.attendance
  for select using (
    student_id in (
      select id from public.students 
      where profile_id = auth.uid() or parent_email = (select email from public.profiles where id = auth.uid())
    )
  );

-- 9. Grades Policies
create policy "Admins have full access to grades" on public.grades
  for all using (public.is_admin());
create policy "Teachers can modify grades for their assigned class_subjects" on public.grades
  for all using (
    exists (
      select 1 from public.class_subjects
      where id = class_subject_id and teacher_id = auth.uid()
    )
  );
create policy "Students/Parents can view their own grades" on public.grades
  for select using (
    student_id in (
      select id from public.students 
      where profile_id = auth.uid() or parent_email = (select email from public.profiles where id = auth.uid())
    )
  );

-- 10. Fee Records Policies
create policy "Admins have full access to fee_records" on public.fee_records
  for all using (public.is_admin());
create policy "Students/Parents can view their own fee_records" on public.fee_records
  for select using (
    student_id in (
      select id from public.students 
      where profile_id = auth.uid() or parent_email = (select email from public.profiles where id = auth.uid())
    )
  );

-- 11. Notifications Policies
create policy "Admins have full access to notifications" on public.notifications
  for all using (public.is_admin());
create policy "Anyone authenticated can read notifications" on public.notifications
  for select using (
    audience_type = 'all' or
    (audience_type = 'class' and audience_id in (
      -- If student, they belong to this class
      select class_id from public.students where profile_id = auth.uid() or parent_email = (select email from public.profiles where id = auth.uid())
      union
      -- If teacher, they teach in this class
      select class_id from public.class_subjects where teacher_id = auth.uid()
    )) or
    (audience_type = 'student' and audience_id in (
      select id from public.students where profile_id = auth.uid() or parent_email = (select email from public.profiles where id = auth.uid())
    ))
  );

-- Profile creation trigger from Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to prevent non-admins from changing their role
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if (old.role is distinct from new.role) and not public.is_admin() then
    raise exception 'You are not allowed to change your role';
  end if;
  return new;
end;
$$ language plpgsql;

create or replace trigger check_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_change();

-- 12. ASSIGNMENTS Table
create table public.assignments (
    id uuid default gen_random_uuid() primary key,
    class_subject_id uuid references public.class_subjects(id) on delete cascade not null,
    title text not null,
    description text not null,
    due_date timestamptz not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 13. SUBMISSIONS Table
create table public.submissions (
    id uuid default gen_random_uuid() primary key,
    assignment_id uuid references public.assignments(id) on delete cascade not null,
    student_id uuid references public.students(id) on delete cascade not null,
    submission_text text not null,
    submitted_at timestamptz default timezone('utc'::text, now()) not null,
    grade text,
    feedback text,
    status text not null check (status in ('pending', 'submitted', 'graded')) default 'submitted',
    unique (assignment_id, student_id)
);

-- Enable RLS on new tables
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

-- Assignments RLS Policies
create policy "Admins have full access to assignments" on public.assignments
  for all using (public.is_admin());

create policy "Teachers can manage assignments for their class-subjects" on public.assignments
  for all using (
    exists (
      select 1 from public.class_subjects
      where id = class_subject_id and teacher_id = auth.uid()
    )
  );

create policy "Students can view class assignments" on public.assignments
  for select using (
    exists (
      select 1 from public.students s
      join public.class_subjects cs on s.class_id = cs.class_id
      where cs.id = class_subject_id and s.profile_id = auth.uid()
    )
  );

create policy "Parents can view their children's class assignments" on public.assignments
  for select using (
    exists (
      select 1 from public.students s
      join public.class_subjects cs on s.class_id = cs.class_id
      where cs.id = class_subject_id and s.parent_email = (select email from public.profiles where id = auth.uid())
    )
  );

-- Submissions RLS Policies
create policy "Admins have full access to submissions" on public.submissions
  for all using (public.is_admin());

create policy "Teachers can manage submissions for their class-subjects" on public.submissions
  for all using (
    exists (
      select 1 from public.assignments a
      join public.class_subjects cs on a.class_subject_id = cs.id
      where a.id = assignment_id and cs.teacher_id = auth.uid()
    )
  );

create policy "Students can manage their own submissions" on public.submissions
  for all using (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );

create policy "Parents can view their children's submissions" on public.submissions
  for select using (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.parent_email = (select email from public.profiles where id = auth.uid())
    )
  );

-- Trigger to delete auth.users when a public.profiles row is deleted
create or replace function public.handle_deleted_user()
returns trigger as $$
begin
  delete from auth.users where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_deleted
  after delete on public.profiles
  for each row execute procedure public.handle_deleted_user();

-- 14. STUDENT_SUBJECTS Table (Elective Subject Registrations)
create table public.student_subjects (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    class_subject_id uuid references public.class_subjects(id) on delete cascade not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique (student_id, class_subject_id)
);

-- Enable RLS
alter table public.student_subjects enable row level security;

-- Admins full access
create policy "Admins can do everything on student_subjects"
on public.student_subjects for all using (public.is_admin());

-- Teachers read access
create policy "Teachers can read student_subjects"
on public.student_subjects for select using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  )
);

-- Students and parents read access
create policy "Students and parents can read their own student_subjects"
on public.student_subjects for select using (
  exists (
    select 1 from public.students s
    where s.id = student_id 
    and (
      s.profile_id = auth.uid() 
      or lower(s.parent_email) = (select lower(email) from public.profiles where id = auth.uid())
    )
  )
);


