-- SQL Seed Script for Ansar-Ud-Deen School Management System
-- Run this in your Supabase SQL Editor to populate default accounts and relationships

-- 1. CLEAN EXISTING DATA (Optional)
truncate table public.notifications cascade;
truncate table public.fee_records cascade;
truncate table public.grades cascade;
truncate table public.attendance cascade;
truncate table public.timetable_slots cascade;
truncate table public.class_subjects cascade;
truncate table public.subjects cascade;
truncate table public.students cascade;
truncate table public.classes cascade;
truncate table public.teachers cascade;
delete from auth.users where email in (
  'admin@aud.edu.ng',
  'teacher.folade@aud.edu.ng',
  'teacher.mustapha@aud.edu.ng',
  'student.kamil@aud.edu.ng',
  'parent.yusuf@aud.edu.ng'
);

-- 2. CREATE AUTH USERS (with password 'password123')
-- We declare temporary variables or generate UUIDs directly
do $$
declare
  admin_id uuid := 'a1111111-1111-1111-1111-111111111111';
  teacher1_id uuid := 'b2222222-2222-2222-2222-222222222222';
  teacher2_id uuid := 'c3333333-3333-3333-3333-333333333333';
  student1_id uuid := 'd4444444-4444-4444-4444-444444444444';
  parent1_id uuid := 'e5555555-5555-5555-5555-555555555555';
  
  class_jss1_id uuid := gen_random_uuid();
  class_basic3_id uuid := gen_random_uuid();
  
  sub_math_id uuid := gen_random_uuid();
  sub_eng_id uuid := gen_random_uuid();
  sub_num_id uuid := gen_random_uuid();
  
  cs_math_id uuid := gen_random_uuid();
  cs_eng_id uuid := gen_random_uuid();
  cs_num_id uuid := gen_random_uuid();
  
  student_kamil_id uuid := gen_random_uuid();
  student_fatima_id uuid := gen_random_uuid();
begin

  -- Insert Auth Users
  insert into auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values
  (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@aud.edu.ng', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alhaji Ibrahim Balogun", "role":"admin"}', now(), now(), '', '', '', ''),
  (teacher1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher.folade@aud.edu.ng', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mrs. Folashade Adebayo", "role":"teacher"}', now(), now(), '', '', '', ''),
  (teacher2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher.mustapha@aud.edu.ng', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mr. Mustapha Bello", "role":"teacher"}', now(), now(), '', '', '', ''),
  (student1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.kamil@aud.edu.ng', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kamil Yusuf", "role":"student"}', now(), now(), '', '', '', ''),
  (parent1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent.yusuf@aud.edu.ng', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mr. Yusuf Alao", "role":"parent"}', now(), now(), '', '', '', '');

  -- Profiles will be automatically created by the trigger "on_auth_user_created"
  -- Wait a moment for trigger execution (it executes immediately synchronously)

  -- Seed Teachers metadata
  insert into public.teachers (id, phone, specialization, qualification, joined_date) values
  (teacher1_id, '+234 803 111 2222', 'Mathematics & English', 'B.Ed. Mathematics', '2020-09-01'),
  (teacher2_id, '+234 805 333 4444', 'Basic Science & Physics', 'B.Sc. Physics, PGDE', '2021-01-15');

  -- Seed Classes
  insert into public.classes (id, name, level) values
  (class_basic3_id, 'Basic 3 Gold', 'primary'),
  (class_jss1_id, 'JSS 1A', 'secondary');

  -- Seed Students
  insert into public.students (id, profile_id, class_id, admission_no, full_name, parent_name, parent_phone, parent_email) values
  (student_kamil_id, student1_id, class_jss1_id, 'AUD-2024-001', 'Kamil Yusuf', 'Mr. Yusuf Alao', '+234 802 000 1111', 'parent.yusuf@aud.edu.ng'),
  (student_fatima_id, null, class_basic3_id, 'AUD-2025-042', 'Fatima Alao', 'Mr. Yusuf Alao', '+234 802 000 1111', 'parent.yusuf@aud.edu.ng');

  -- Seed Subjects
  insert into public.subjects (id, name, code, level) values
  (sub_math_id, 'Mathematics', 'MTH 101', 'secondary'),
  (sub_eng_id, 'English Language', 'ENG 101', 'secondary'),
  (sub_num_id, 'Numeracy', 'NUM 003', 'primary');

  -- Seed class_subjects Pivot
  insert into public.class_subjects (id, class_id, subject_id, teacher_id) values
  (cs_math_id, class_jss1_id, sub_math_id, teacher1_id),
  (cs_eng_id, class_jss1_id, sub_eng_id, teacher1_id),
  (cs_num_id, class_basic3_id, sub_num_id, teacher1_id);

  -- Seed Timetable Slots
  insert into public.timetable_slots (class_subject_id, day_of_week, start_time, end_time, room) values
  (cs_math_id, 'Monday', '08:30:00', '09:30:00', 'JSS 1A Room'),
  (cs_eng_id, 'Tuesday', '08:30:00', '09:30:00', 'JSS 1A Room'),
  (cs_num_id, 'Monday', '08:00:00', '09:00:00', 'Basic 3 Room');

  -- Seed Attendance
  insert into public.attendance (student_id, class_subject_id, date, status, remarks) values
  (student_kamil_id, cs_math_id, '2026-06-12', 'present', 'On time'),
  (student_kamil_id, cs_math_id, '2026-06-13', 'late', 'Heavy rain');

  -- Seed Grades
  insert into public.grades (student_id, class_subject_id, term, academic_year, ca_score, exam_score, grade) values
  (student_kamil_id, cs_math_id, '1st Term', '2025/2026', 32, 54, 'A'),
  (student_kamil_id, cs_eng_id, '1st Term', '2025/2026', 30, 48, 'B');

  -- Seed Fee Records
  insert into public.fee_records (student_id, term, academic_year, amount_owed, amount_paid, status) values
  (student_kamil_id, '1st Term', '2025/2026', 120000, 120000, 'paid'),
  (student_fatima_id, '1st Term', '2025/2026', 80000, 40000, 'partial');

  -- Seed Notifications
  insert into public.notifications (title, content, audience_type, audience_id, created_by) values
  ('Welcome to Third Term!', 'We welcome all pupils and parents back to school. Please ensure fee payments are updated soon.', 'all', null, admin_id),
  ('JSS 1 Mathematics Quiz', 'There will be a continuous assessment test on Monday for JSS 1 Math classes.', 'class', class_jss1_id, teacher1_id);

  -- Mark seeded profiles as password_changed = true
  update public.profiles set password_changed = true;

end $$;
