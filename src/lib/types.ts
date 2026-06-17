// TypeScript Interfaces for Ansar-Ud-Deen School Management System

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  password_changed: boolean;
  created_at: string;
}

export interface Teacher {
  id: string; // references Profile.id
  phone?: string;
  specialization?: string;
  qualification?: string;
  joined_date: string;
}

export interface Class {
  id: string;
  name: string; // e.g. "JSS 1A", "Basic 3"
  level: 'primary' | 'secondary';
  created_at: string;
}

export interface Student {
  id: string;
  profile_id?: string; // Links to Student profile
  class_id: string;
  admission_no: string;
  full_name: string;
  parent_name: string;
  parent_phone?: string;
  parent_email?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  level: 'primary' | 'secondary';
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string; // references Profile.id (teacher)
}

export interface TimetableSlot {
  id: string;
  class_subject_id: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  start_time: string; // "08:00"
  end_time: string; // "09:00"
  room: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_subject_id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface Grade {
  id: string;
  student_id: string;
  class_subject_id: string;
  term: '1st Term' | '2nd Term' | '3rd Term';
  academic_year: string; // e.g. "2025/2026"
  ca_score: number; // max 40
  exam_score: number; // max 60
  total_score: number; // ca + exam
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface FeeRecord {
  id: string;
  student_id: string;
  term: '1st Term' | '2nd Term' | '3rd Term';
  academic_year: string;
  amount_owed: number;
  amount_paid: number;
  status: 'paid' | 'partial' | 'unpaid';
  updated_at: string;
}

export interface SchoolNotification {
  id: string;
  title: string;
  content: string;
  audience_type: 'all' | 'class' | 'student';
  audience_id?: string; // class_id or student_id
  created_by?: string; // Profile.id
  created_at: string;
}

export interface Assignment {
  id: string;
  class_subject_id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string;
  file_url?: string;
  submitted_at: string;
  grade?: string;
  feedback?: string;
  status: 'submitted' | 'graded';
}

export interface StudentSubject {
  id: string;
  student_id: string;
  class_subject_id: string;
  created_at?: string;
}


