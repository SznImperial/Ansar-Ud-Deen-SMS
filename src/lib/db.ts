// Database Interface layer supporting Supabase or local storage fallback (Demo Mode)
import { createClient } from '@supabase/supabase-js';
import * as T from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const getTempSupabase = () => {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

// ==========================================
// MOCK DATA SEED TEMPLATES
// ==========================================

const MOCK_PROFILES: T.Profile[] = [
  { id: 'p-admin-1', full_name: 'Alhaji Ibrahim Balogun', email: 'admin@aud.edu.ng', role: 'admin', password_changed: true, created_at: new Date().toISOString() },
  { id: 'p-teacher-1', full_name: 'Mrs. Folashade Adebayo', email: 'teacher.folade@aud.edu.ng', role: 'teacher', password_changed: true, created_at: new Date().toISOString() },
  { id: 'p-teacher-2', full_name: 'Mr. Mustapha Bello', email: 'teacher.mustapha@aud.edu.ng', role: 'teacher', password_changed: true, created_at: new Date().toISOString() },
  { id: 'p-teacher-3', full_name: 'Ustadz Abdul-Mujeeb', email: 'teacher.mujeeb@aud.edu.ng', role: 'teacher', password_changed: true, created_at: new Date().toISOString() },
  { id: 'p-student-1', full_name: 'Kamil Yusuf', email: 'student.kamil@aud.edu.ng', role: 'student', password_changed: true, created_at: new Date().toISOString() },
  { id: 'p-student-2', full_name: 'Fatima Alao', email: 'student.fatima@aud.edu.ng', role: 'student', password_changed: true, created_at: new Date().toISOString() },
  { id: 'p-parent-1', full_name: 'Mr. Yusuf Alao', email: 'parent.yusuf@aud.edu.ng', role: 'parent', password_changed: true, created_at: new Date().toISOString() }
];

const MOCK_TEACHERS: T.Teacher[] = [
  { id: 'p-teacher-1', phone: '+234 803 111 2222', specialization: 'Mathematics & English', qualification: 'B.Ed. Mathematics', joined_date: '2020-09-01' },
  { id: 'p-teacher-2', phone: '+234 805 333 4444', specialization: 'Basic Science & Physics', qualification: 'B.Sc. Physics, PGDE', joined_date: '2021-01-15' },
  { id: 'p-teacher-3', phone: '+234 809 555 6666', specialization: 'Islamic Religious Studies (IRS) & Arabic', qualification: 'B.A. Islamic Studies', joined_date: '2019-10-10' }
];

const MOCK_CLASSES: T.Class[] = [
  { id: 'c-1', name: 'Basic 3 Gold', level: 'primary', created_at: new Date().toISOString() },
  { id: 'c-2', name: 'Basic 5 Diamond', level: 'primary', created_at: new Date().toISOString() },
  { id: 'c-3', name: 'JSS 1A', level: 'secondary', created_at: new Date().toISOString() },
  { id: 'c-4', name: 'JSS 2A', level: 'secondary', created_at: new Date().toISOString() },
  { id: 'c-5', name: 'SSS 1 Science', level: 'secondary', created_at: new Date().toISOString() }
];

const MOCK_STUDENTS: T.Student[] = [
  { id: 's-1', profile_id: 'p-student-1', class_id: 'c-3', admission_no: 'AUD-2024-001', full_name: 'Kamil Yusuf', parent_name: 'Mr. Yusuf Alao', parent_phone: '+234 802 000 1111', parent_email: 'parent.yusuf@aud.edu.ng', created_at: new Date().toISOString() },
  { id: 's-2', profile_id: 'p-student-2', class_id: 'c-1', admission_no: 'AUD-2025-042', full_name: 'Fatima Alao', parent_name: 'Mr. Yusuf Alao', parent_phone: '+234 802 000 1111', parent_email: 'parent.yusuf@aud.edu.ng', created_at: new Date().toISOString() },
  { id: 's-3', class_id: 'c-3', admission_no: 'AUD-2024-005', full_name: 'Zainab Balogun', parent_name: 'Alhaji Ibrahim Balogun', parent_phone: '+234 803 222 3333', parent_email: 'admin@aud.edu.ng', created_at: new Date().toISOString() },
  { id: 's-4', class_id: 'c-4', admission_no: 'AUD-2023-012', full_name: 'Farooq Jimoh', parent_name: 'Mr. Jimoh Kamal', parent_phone: '+234 808 333 4444', parent_email: 'jimoh.kamal@gmail.com', created_at: new Date().toISOString() },
  { id: 's-5', class_id: 'c-5', admission_no: 'AUD-2022-099', full_name: 'Aisha Suleiman', parent_name: 'Alhaji Suleiman', parent_phone: '+234 806 444 5555', parent_email: 'suleiman@gmail.com', created_at: new Date().toISOString() }
];

const MOCK_SUBJECTS: T.Subject[] = [
  { id: 'sub-1', name: 'Mathematics', code: 'MTH 101', level: 'secondary' },
  { id: 'sub-2', name: 'English Language', code: 'ENG 101', level: 'secondary' },
  { id: 'sub-3', name: 'Basic Science', code: 'BSC 101', level: 'secondary' },
  { id: 'sub-4', name: 'Islamic Studies', code: 'IRS 101', level: 'secondary' },
  { id: 'sub-5', name: 'Numeracy', code: 'NUM 003', level: 'primary' },
  { id: 'sub-6', name: 'Literacy', code: 'LIT 003', level: 'primary' },
  { id: 'sub-7', name: 'Elementary Science', code: 'SCI 003', level: 'primary' },
  { id: 'sub-8', name: 'Islamic Studies Primary', code: 'IRS 003', level: 'primary' }
];

// Pivot: ClassSubject: links class + subject + teacher
const MOCK_CLASS_SUBJECTS: T.ClassSubject[] = [
  // JSS 1A (c-3) subjects
  { id: 'cs-1', class_id: 'c-3', subject_id: 'sub-1', teacher_id: 'p-teacher-1' }, // Math - Mrs. Adebayo
  { id: 'cs-2', class_id: 'c-3', subject_id: 'sub-2', teacher_id: 'p-teacher-1' }, // Eng - Mrs. Adebayo
  { id: 'cs-3', class_id: 'c-3', subject_id: 'sub-3', teacher_id: 'p-teacher-2' }, // Science - Mr. Bello
  { id: 'cs-4', class_id: 'c-3', subject_id: 'sub-4', teacher_id: 'p-teacher-3' }, // IRS - Ustadz Mujeeb

  // Basic 3 (c-1) subjects
  { id: 'cs-5', class_id: 'c-1', subject_id: 'sub-5', teacher_id: 'p-teacher-1' }, // Numeracy - Mrs. Adebayo
  { id: 'cs-6', class_id: 'c-1', subject_id: 'sub-6', teacher_id: 'p-teacher-1' }, // Literacy - Mrs. Adebayo
  { id: 'cs-7', class_id: 'c-1', subject_id: 'sub-8', teacher_id: 'p-teacher-3' }  // IRS - Ustadz Mujeeb
];

const MOCK_TIMETABLE_SLOTS: T.TimetableSlot[] = [
  // JSS 1A Math: Monday 08:30 - 09:30
  { id: 'ts-1', class_subject_id: 'cs-1', day_of_week: 'Monday', start_time: '08:30', end_time: '09:30', room: 'JSS 1A Room' },
  // JSS 1A Science: Monday 09:30 - 10:30
  { id: 'ts-2', class_subject_id: 'cs-3', day_of_week: 'Monday', start_time: '09:30', end_time: '10:30', room: 'Science Lab' },
  // JSS 1A English: Tuesday 08:30 - 09:30
  { id: 'ts-3', class_subject_id: 'cs-2', day_of_week: 'Tuesday', start_time: '08:30', end_time: '09:30', room: 'JSS 1A Room' },
  // JSS 1A IRS: Wednesday 11:00 - 12:00
  { id: 'ts-4', class_subject_id: 'cs-4', day_of_week: 'Wednesday', start_time: '11:00', end_time: '12:00', room: 'Arabic Hall' },

  // Basic 3 Numeracy: Monday 08:00 - 09:00
  { id: 'ts-5', class_subject_id: 'cs-5', day_of_week: 'Monday', start_time: '08:00', end_time: '09:00', room: 'Basic 3 Room' },
  // Basic 3 Literacy: Monday 09:00 - 10:00
  { id: 'ts-6', class_subject_id: 'cs-6', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', room: 'Basic 3 Room' },
  // Basic 3 IRS: Tuesday 10:00 - 11:00
  { id: 'ts-7', class_subject_id: 'cs-7', day_of_week: 'Tuesday', start_time: '10:00', end_time: '11:00', room: 'Basic 3 Room' }
];

const MOCK_ATTENDANCE: T.Attendance[] = [
  { id: 'att-1', student_id: 's-1', class_subject_id: 'cs-1', date: '2026-06-12', status: 'present', remarks: 'On time' },
  { id: 'att-2', student_id: 's-3', class_subject_id: 'cs-1', date: '2026-06-12', status: 'present' },
  { id: 'att-3', student_id: 's-1', class_subject_id: 'cs-1', date: '2026-06-13', status: 'late', remarks: 'Heavy rain' },
  { id: 'att-4', student_id: 's-3', class_subject_id: 'cs-1', date: '2026-06-13', status: 'absent', remarks: 'Sick leave' }
];

const MOCK_GRADES: T.Grade[] = [
  { id: 'g-1', student_id: 's-1', class_subject_id: 'cs-1', term: '1st Term', academic_year: '2025/2026', ca_score: 32, exam_score: 54, total_score: 86, grade: 'A' },
  { id: 'g-2', student_id: 's-3', class_subject_id: 'cs-1', term: '1st Term', academic_year: '2025/2026', ca_score: 28, exam_score: 42, total_score: 70, grade: 'B' },
  { id: 'g-3', student_id: 's-1', class_subject_id: 'cs-2', term: '1st Term', academic_year: '2025/2026', ca_score: 30, exam_score: 48, total_score: 78, grade: 'B' }
];

const MOCK_FEES: T.FeeRecord[] = [
  { id: 'f-1', student_id: 's-1', term: '1st Term', academic_year: '2025/2026', amount_owed: 120000, amount_paid: 120000, status: 'paid', updated_at: new Date().toISOString() },
  { id: 'f-2', student_id: 's-2', term: '1st Term', academic_year: '2025/2026', amount_owed: 80000, amount_paid: 40000, status: 'partial', updated_at: new Date().toISOString() },
  { id: 'f-3', student_id: 's-3', term: '1st Term', academic_year: '2025/2026', amount_owed: 120000, amount_paid: 0, status: 'unpaid', updated_at: new Date().toISOString() }
];

const MOCK_NOTIFICATIONS: T.SchoolNotification[] = [
  { id: 'n-1', title: 'Welcome to Third Term!', content: 'We welcome all pupils and parents back to school. Please ensure fee payments are updated soon.', audience_type: 'all', created_by: 'p-admin-1', created_at: '2026-06-01T08:00:00Z' },
  { id: 'n-2', title: 'JSS 1 Mathematics Quiz', content: 'There will be a continuous assessment test on Monday for JSS 1 Math classes.', audience_type: 'class', audience_id: 'c-3', created_by: 'p-teacher-1', created_at: '2026-06-12T14:30:00Z' }
];

const MOCK_ASSIGNMENTS: T.Assignment[] = [
  {
    id: 'a-1',
    class_subject_id: 'cs-1',
    title: 'Algebraic Equations Exercise',
    description: 'Solve the algebraic equations on page 42 of the course book. Submit your step-by-step solution text.',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'a-2',
    class_subject_id: 'cs-2',
    title: 'Essays on Moral Values',
    description: 'Write a short essay (200 words) about the importance of respect for elders in our community.',
    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    created_at: new Date().toISOString()
  }
];

const MOCK_SUBMISSIONS: T.Submission[] = [
  {
    id: 'subm-1',
    assignment_id: 'a-1',
    student_id: 's-1',
    submission_text: '1. x + 5 = 12 => x = 12 - 5 => x = 7.\n2. 2y - 4 = 10 => 2y = 14 => y = 7.\nAll exercises completed!',
    submitted_at: new Date().toISOString(),
    grade: 'A',
    feedback: 'Excellent step-by-step derivation. Keep it up!',
    status: 'graded'
  }
];


// ==========================================
// LOCAL STORAGE MOCK DB MANAGER
// ==========================================

class MockDB {
  private get<K>(key: string, defaults: K[]): K[] {
    if (typeof window === 'undefined') return defaults;
    const data = localStorage.getItem(`aud_${key}`);
    if (!data) {
      localStorage.setItem(`aud_${key}`, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  }

  private save<K>(key: string, data: K[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`aud_${key}`, JSON.stringify(data));
    }
  }

  // Getters
  getProfiles = () => this.get('profiles', MOCK_PROFILES);
  getTeachers = () => this.get('teachers', MOCK_TEACHERS);
  getClasses = () => this.get('classes', MOCK_CLASSES);
  getStudents = () => this.get('students', MOCK_STUDENTS);
  getSubjects = () => this.get('subjects', MOCK_SUBJECTS);
  getClassSubjects = () => this.get('class_subjects', MOCK_CLASS_SUBJECTS);
  getTimetableSlots = () => this.get('timetable_slots', MOCK_TIMETABLE_SLOTS);
  getAttendance = () => this.get('attendance', MOCK_ATTENDANCE);
  getGrades = () => this.get('grades', MOCK_GRADES);
  getFees = () => this.get('fees', MOCK_FEES);
  getNotifications = () => this.get('notifications', MOCK_NOTIFICATIONS);
  getAssignments = () => this.get('assignments', MOCK_ASSIGNMENTS);
  getSubmissions = () => this.get('submissions', MOCK_SUBMISSIONS);
  getStudentSubjects = () => this.get('student_subjects', [] as T.StudentSubject[]);

  // Setters
  saveProfiles = (d: T.Profile[]) => this.save('profiles', d);
  saveTeachers = (d: T.Teacher[]) => this.save('teachers', d);
  saveClasses = (d: T.Class[]) => this.save('classes', d);
  saveStudents = (d: T.Student[]) => this.save('students', d);
  saveSubjects = (d: T.Subject[]) => this.save('subjects', d);
  saveClassSubjects = (d: T.ClassSubject[]) => this.save('class_subjects', d);
  saveTimetableSlots = (d: T.TimetableSlot[]) => this.save('timetable_slots', d);
  saveAttendance = (d: T.Attendance[]) => this.save('attendance', d);
  saveGrades = (d: T.Grade[]) => this.save('grades', d);
  saveFees = (d: T.FeeRecord[]) => this.save('fees', d);
  saveNotifications = (d: T.SchoolNotification[]) => this.save('notifications', d);
  saveAssignments = (d: T.Assignment[]) => this.save('assignments', d);
  saveSubmissions = (d: T.Submission[]) => this.save('submissions', d);
  saveStudentSubjects = (d: T.StudentSubject[]) => this.save('student_subjects', d);

  getCbtExams = () => this.get('cbt_exams', [] as T.CBTExam[]);
  saveCbtExams = (d: T.CBTExam[]) => this.save('cbt_exams', d);
  getCbtQuestions = () => this.get('cbt_questions', [] as T.CBTQuestion[]);
  saveCbtQuestions = (d: T.CBTQuestion[]) => this.save('cbt_questions', d);
  getCbtSubmissions = () => this.get('cbt_submissions', [] as T.CBTSubmission[]);
  saveCbtSubmissions = (d: T.CBTSubmission[]) => this.save('cbt_submissions', d);

  getPasswordResetRequests = () => this.get('password_reset_requests', [] as T.PasswordResetRequest[]);
  savePasswordResetRequests = (d: T.PasswordResetRequest[]) => this.save('password_reset_requests', d);
}

export const mockDB = new MockDB();

// ==========================================
// UNIFIED DATA SERVICE APIS (ASYNC)
// ==========================================

export const dbService = {
  // --- AUTH & PROFILES ---
  async login(email: string): Promise<T.Profile | null> {
    if (isSupabaseConfigured) {
      // Supabase flow would check auth.users and profiles
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      if (error) return null;
      return data;
    } else {
      const profiles = mockDB.getProfiles();
      const match = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      return match || null;
    }
  },

  async getProfiles(): Promise<T.Profile[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('profiles').select('*');
      return data || [];
    }
    return mockDB.getProfiles();
  },

  async addProfile(profile: T.Profile): Promise<T.Profile> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('profiles').insert(profile).select().single();
      return data;
    }
    const profiles = mockDB.getProfiles();
    profiles.push(profile);
    mockDB.saveProfiles(profiles);
    return profile;
  },

  async checkProfileExists(email: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase());
      return !!(data && data.length > 0);
    } else {
      const profiles = mockDB.getProfiles();
      return profiles.some(p => p.email.toLowerCase() === email.trim().toLowerCase());
    }
  },

  async createUserInAuth(email: string, password: string, fullName: string, role: T.UserRole): Promise<string> {
    if (isSupabaseConfigured) {
      const tempSupabase = getTempSupabase();
      if (!tempSupabase) throw new Error('Supabase client not initialized');
      const { data, error } = await tempSupabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });
      if (error) {
        throw error;
      }
      if (!data.user) {
        throw new Error('User creation failed');
      }
      return data.user.id;
    } else {
      const id = `p-${role}-${Date.now()}`;
      const profiles = mockDB.getProfiles();
      profiles.push({
        id,
        full_name: fullName,
        email: email.trim().toLowerCase(),
        role,
        password_changed: false,
        created_at: new Date().toISOString()
      });
      mockDB.saveProfiles(profiles);
      return id;
    }
  },

  async markPasswordChanged(profileId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('profiles')
        .update({ password_changed: true })
        .eq('id', profileId);
      if (error) throw error;
    } else {
      const profiles = mockDB.getProfiles();
      const idx = profiles.findIndex(p => p.id === profileId);
      if (idx !== -1) {
        profiles[idx].password_changed = true;
        mockDB.saveProfiles(profiles);
      }
    }
  },

  async addTeacherMetadataOnly(teacher: T.Teacher): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('teachers').insert(teacher);
      if (error) throw error;
    } else {
      const teachers = mockDB.getTeachers();
      teachers.push(teacher);
      mockDB.saveTeachers(teachers);
    }
  },

  async deleteTeacher(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('profiles').delete().eq('id', id);
      if (error) throw error;
    } else {
      const profiles = mockDB.getProfiles().filter(x => x.id !== id);
      const teachers = mockDB.getTeachers().filter(x => x.id !== id);
      mockDB.saveProfiles(profiles);
      mockDB.saveTeachers(teachers);
    }
  },

  async deleteStudent(id: string, profileId?: string | null): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('students').delete().eq('id', id);
      if (error) throw error;
      if (profileId) {
        await supabase!.from('profiles').delete().eq('id', profileId);
      }
    } else {
      const students = mockDB.getStudents().filter(x => x.id !== id);
      mockDB.saveStudents(students);
      if (profileId) {
        const profiles = mockDB.getProfiles().filter(x => x.id !== profileId);
        mockDB.saveProfiles(profiles);
      }
    }
  },

  async deleteClass(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('classes').delete().eq('id', id);
      if (error) throw error;
    } else {
      const classes = mockDB.getClasses().filter(x => x.id !== id);
      mockDB.saveClasses(classes);
      const students = mockDB.getStudents().filter(x => x.class_id !== id);
      mockDB.saveStudents(students);
      const css = mockDB.getClassSubjects().filter(x => x.class_id !== id);
      mockDB.saveClassSubjects(css);
    }
  },

  async deleteSubject(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('subjects').delete().eq('id', id);
      if (error) throw error;
    } else {
      const subjects = mockDB.getSubjects().filter(x => x.id !== id);
      mockDB.saveSubjects(subjects);
      const css = mockDB.getClassSubjects().filter(x => x.subject_id !== id);
      mockDB.saveClassSubjects(css);
    }
  },

  async deleteClassSubject(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('class_subjects').delete().eq('id', id);
      if (error) throw error;
    } else {
      const css = mockDB.getClassSubjects().filter(x => x.id !== id);
      mockDB.saveClassSubjects(css);
    }
  },

  // --- TEACHERS ---
  async getTeachers(): Promise<T.Teacher[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('teachers').select('*');
      return data || [];
    }
    return mockDB.getTeachers();
  },

  async addTeacher(teacher: T.Teacher, profile: T.Profile): Promise<void> {
    if (isSupabaseConfigured) {
      // Insert profile first, then teacher
      await supabase!.from('profiles').insert(profile);
      await supabase!.from('teachers').insert(teacher);
    } else {
      await this.addProfile(profile);
      const teachers = mockDB.getTeachers();
      teachers.push(teacher);
      mockDB.saveTeachers(teachers);
    }
  },

  // --- CLASSES ---
  async getClasses(): Promise<T.Class[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('classes').select('*');
      return data || [];
    }
    return mockDB.getClasses();
  },

  async addClass(name: string, level: 'primary' | 'secondary'): Promise<T.Class> {
    const newClass: T.Class = {
      id: isSupabaseConfigured ? undefined as any : `c-${Date.now()}`,
      name,
      level,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('classes').insert(newClass).select().single();
      return data;
    }
    const classes = mockDB.getClasses();
    classes.push(newClass);
    mockDB.saveClasses(classes);
    return newClass;
  },

  // --- STUDENTS ---
  async getStudents(): Promise<T.Student[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('students').select('*');
      return data || [];
    }
    return mockDB.getStudents();
  },

  async addStudent(studentData: Omit<T.Student, 'id' | 'created_at'>): Promise<T.Student> {
    const student: T.Student = {
      ...studentData,
      id: `s-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('students').insert(studentData).select().single();
      return data;
    }
    const students = mockDB.getStudents();
    students.push(student);
    mockDB.saveStudents(students);
    return student;
  },

  async updateStudent(id: string, updates: Partial<T.Student>): Promise<T.Student> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('students').update(updates).eq('id', id).select().single();
      return data;
    }
    const students = mockDB.getStudents();
    const idx = students.findIndex(s => s.id === id);
    if (idx !== -1) {
      students[idx] = { ...students[idx], ...updates };
      mockDB.saveStudents(students);
      return students[idx];
    }
    throw new Error('Student not found');
  },

  async promoteStudents(studentIds: string[], targetClassId: string | null): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('students')
        .update({ class_id: targetClassId })
        .in('id', studentIds);
      if (error) throw error;
      return;
    }
    const students = mockDB.getStudents();
    studentIds.forEach(id => {
      const idx = students.findIndex(s => s.id === id);
      if (idx !== -1) {
        students[idx].class_id = targetClassId;
      }
    });
    mockDB.saveStudents(students);
  },

  // --- SUBJECTS ---
  async getSubjects(): Promise<T.Subject[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('subjects').select('*');
      return data || [];
    }
    return mockDB.getSubjects();
  },

  async addSubject(name: string, code: string, level: 'primary' | 'secondary'): Promise<T.Subject> {
    const sub: T.Subject = {
      id: `sub-${Date.now()}`,
      name,
      code,
      level
    };
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('subjects').insert({ name, code, level }).select().single();
      return data;
    }
    const subjects = mockDB.getSubjects();
    subjects.push(sub);
    mockDB.saveSubjects(subjects);
    return sub;
  },

  // --- CLASS SUBJECTS (Pivot: links class, subject, teacher) ---
  async getClassSubjects(): Promise<T.ClassSubject[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('class_subjects').select('*');
      return data || [];
    }
    return mockDB.getClassSubjects();
  },

  async assignClassSubject(classId: string, subjectId: string, teacherId?: string): Promise<T.ClassSubject> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('class_subjects')
        .upsert({ class_id: classId, subject_id: subjectId, teacher_id: teacherId }, { onConflict: 'class_id,subject_id' })
        .select()
        .single();
      return data;
    }
    const css = mockDB.getClassSubjects();
    const existing = css.find(x => x.class_id === classId && x.subject_id === subjectId);
    if (existing) {
      existing.teacher_id = teacherId;
      mockDB.saveClassSubjects(css);
      return existing;
    }
    const newCs: T.ClassSubject = {
      id: `cs-${Date.now()}`,
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId
    };
    css.push(newCs);
    mockDB.saveClassSubjects(css);
    return newCs;
  },

  // --- TIMETABLE SLOTS ---
  async getTimetableSlots(): Promise<T.TimetableSlot[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('timetable_slots').select('*');
      return data || [];
    }
    return mockDB.getTimetableSlots();
  },

  async addTimetableSlot(slotData: Omit<T.TimetableSlot, 'id'>): Promise<T.TimetableSlot> {
    const slot: T.TimetableSlot = {
      ...slotData,
      id: `ts-${Date.now()}`
    };
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('timetable_slots').insert(slotData).select().single();
      return data;
    }
    const slots = mockDB.getTimetableSlots();
    slots.push(slot);
    mockDB.saveTimetableSlots(slots);
    return slot;
  },

  async deleteTimetableSlot(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase!.from('timetable_slots').delete().eq('id', id);
      return;
    }
    const slots = mockDB.getTimetableSlots().filter(x => x.id !== id);
    mockDB.saveTimetableSlots(slots);
  },

  // --- ATTENDANCE ---
  async getAttendance(): Promise<T.Attendance[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('attendance').select('*');
      return data || [];
    }
    return mockDB.getAttendance();
  },

  async saveAttendanceList(records: Omit<T.Attendance, 'id'>[]): Promise<void> {
    if (isSupabaseConfigured) {
      // In Supabase we can upsert
      await supabase!.from('attendance').upsert(records, { onConflict: 'student_id,class_subject_id,date' });
      return;
    }
    const existing = mockDB.getAttendance();
    const updated = [...existing];
    records.forEach(r => {
      const idx = updated.findIndex(x => x.student_id === r.student_id && x.class_subject_id === r.class_subject_id && x.date === r.date);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], ...r };
      } else {
        updated.push({
          ...r,
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        });
      }
    });
    mockDB.saveAttendance(updated);
  },

  // --- GRADES ---
  async getGrades(): Promise<T.Grade[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('grades').select('*');
      return data || [];
    }
    return mockDB.getGrades();
  },

  async saveGrade(record: Omit<T.Grade, 'id' | 'total_score' | 'grade'>): Promise<T.Grade> {
    const total_score = record.ca_score + record.exam_score;
    // Calculate grade letter
    let gradeLetter: T.Grade['grade'] = 'F';
    if (total_score >= 70) gradeLetter = 'A';
    else if (total_score >= 60) gradeLetter = 'B';
    else if (total_score >= 50) gradeLetter = 'C';
    else if (total_score >= 45) gradeLetter = 'D';
    else if (total_score >= 40) gradeLetter = 'E';

    const gradeRecord: T.Grade = {
      ...record,
      id: `g-${Date.now()}`,
      total_score,
      grade: gradeLetter
    };

    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('grades')
        .upsert({ ...record, grade: gradeLetter }, { onConflict: 'student_id,class_subject_id,term,academic_year' })
        .select()
        .single();
      return data;
    }

    const grades = mockDB.getGrades();
    const idx = grades.findIndex(x => 
      x.student_id === record.student_id && 
      x.class_subject_id === record.class_subject_id && 
      x.term === record.term && 
      x.academic_year === record.academic_year
    );

    if (idx !== -1) {
      grades[idx] = { ...grades[idx], ...record, total_score, grade: gradeLetter };
      mockDB.saveGrades(grades);
      return grades[idx];
    } else {
      grades.push(gradeRecord);
      mockDB.saveGrades(grades);
      return gradeRecord;
    }
  },

  // --- FEES ---
  async getFees(): Promise<T.FeeRecord[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('fee_records').select('*');
      return data || [];
    }
    return mockDB.getFees();
  },

  async saveFeeRecord(record: Omit<T.FeeRecord, 'id' | 'updated_at'>): Promise<T.FeeRecord> {
    const updatedRecord: T.FeeRecord = {
      ...record,
      id: `f-${Date.now()}`,
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('fee_records').upsert(record, { onConflict: 'student_id,term,academic_year' }).select().single();
      return data;
    }
    const fees = mockDB.getFees();
    const idx = fees.findIndex(x => 
      x.student_id === record.student_id && 
      x.term === record.term && 
      x.academic_year === record.academic_year
    );
    if (idx !== -1) {
      fees[idx] = { ...fees[idx], ...record, updated_at: new Date().toISOString() };
      mockDB.saveFees(fees);
      return fees[idx];
    } else {
      fees.push(updatedRecord);
      mockDB.saveFees(fees);
      return updatedRecord;
    }
  },

  async allocateClassFees(classId: string, term: string, academicYear: string, amount: number): Promise<number> {
    // 1. Get all students in the class
    const allStudents = await this.getStudents();
    const classStudents = allStudents.filter(s => s.class_id === classId);
    if (classStudents.length === 0) return 0;

    // 2. Get existing fee records for this term and year
    const allFees = await this.getFees();
    const existingStudentIds = new Set(
      allFees
        .filter(f => f.term === term && f.academic_year === academicYear)
        .map(f => f.student_id)
    );

    // 3. Filter out students who already have a record
    const studentsToBill = classStudents.filter(s => !existingStudentIds.has(s.id));
    if (studentsToBill.length === 0) return 0;

    // 4. Create new fee records
    if (isSupabaseConfigured) {
      const newRecords = studentsToBill.map(s => ({
        student_id: s.id,
        term,
        academic_year: academicYear,
        amount_owed: amount,
        amount_paid: 0,
        status: 'unpaid'
      }));
      const { error } = await supabase!.from('fee_records').insert(newRecords);
      if (error) throw error;
    } else {
      const fees = mockDB.getFees();
      studentsToBill.forEach(s => {
        fees.push({
          id: `f-${s.id}-${Date.now()}`,
          student_id: s.id,
          term: term as any,
          academic_year: academicYear,
          amount_owed: amount,
          amount_paid: 0,
          status: 'unpaid',
          updated_at: new Date().toISOString()
        });
      });
      mockDB.saveFees(fees);
    }

    return studentsToBill.length;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(): Promise<T.SchoolNotification[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('notifications').select('*').order('created_at', { ascending: false });
      return data || [];
    }
    return mockDB.getNotifications().sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async addNotification(title: string, content: string, audience_type: 'all' | 'class' | 'student', audience_id?: string, created_by?: string): Promise<T.SchoolNotification> {
    const notif: T.SchoolNotification = {
      id: `n-${Date.now()}`,
      title,
      content,
      audience_type,
      audience_id,
      created_by,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      const { data } = await supabase!.from('notifications')
        .insert({ title, content, audience_type, audience_id, created_by })
        .select()
        .single();
      return data;
    }
    const notifs = mockDB.getNotifications();
    notifs.push(notif);
    mockDB.saveNotifications(notifs);
    return notif;
  },

  // --- STUDENT ELECTIVE SUBJECTS ---
  async getStudentSubjects(filters?: { studentId?: string }): Promise<T.StudentSubject[]> {
    if (isSupabaseConfigured) {
      let query = supabase!.from('student_subjects').select('*');
      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }
      const { data } = await query;
      return data || [];
    } else {
      let list = mockDB.getStudentSubjects();
      if (filters?.studentId) {
        list = list.filter(ss => ss.student_id === filters.studentId);
      }
      return list;
    }
  },

  async setStudentSubjects(studentId: string, classSubjectIds: string[]): Promise<void> {
    if (isSupabaseConfigured) {
      // 1. Delete existing student subjects
      const { error: deleteError } = await supabase!
        .from('student_subjects')
        .delete()
        .eq('student_id', studentId);
      if (deleteError) throw deleteError;

      // 2. Insert new selections
      if (classSubjectIds.length > 0) {
        const payload = classSubjectIds.map(csId => ({
          student_id: studentId,
          class_subject_id: csId
        }));
        const { error: insertError } = await supabase!
          .from('student_subjects')
          .insert(payload);
        if (insertError) throw insertError;
      }
    } else {
      let list = mockDB.getStudentSubjects();
      // Filter out existing for this student
      list = list.filter(ss => ss.student_id !== studentId);
      // Add new selections
      classSubjectIds.forEach(csId => {
        list.push({
          id: `ss-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          student_id: studentId,
          class_subject_id: csId
        });
      });
      mockDB.saveStudentSubjects(list);
    }
  },

  async getStudentsForClassSubject(classSubjectId: string): Promise<T.Student[]> {
    // 1. Get class_subject details to find the class ID
    const classSubjects = await this.getClassSubjects();
    const cs = classSubjects.find(x => x.id === classSubjectId);
    if (!cs) return [];

    // 2. Get all students in this class
    const allStudents = await this.getStudents();
    const classStudents = allStudents.filter(s => s.class_id === cs.class_id);

    // 3. Get student subjects allocations
    const studentSubs = await this.getStudentSubjects();

    // 4. Filter class students
    return classStudents.filter(student => {
      // Find registrations for this student
      const studentRegs = studentSubs.filter(ss => ss.student_id === student.id);
      
      // If student has registered for at least one subject explicitly:
      if (studentRegs.length > 0) {
        // They must have registered for this specific classSubjectId
        return studentRegs.some(ss => ss.class_subject_id === classSubjectId);
      }
      
      // Otherwise, compulsory fallback: they offer all class subjects
      return true;
    });
  },

  // --- ASSIGNMENTS & SUBMISSIONS ---
  async getAssignments(filters?: { classSubjectId?: string; classId?: string; studentId?: string }): Promise<T.Assignment[]> {
    if (isSupabaseConfigured) {
      let query = supabase!.from('assignments').select('*');
      if (filters?.classSubjectId) {
        query = query.eq('class_subject_id', filters.classSubjectId);
      }
      if (filters?.classId) {
        const { data: classSubjects } = await supabase!
          .from('class_subjects')
          .select('id')
          .eq('class_id', filters.classId);
        const csIds = (classSubjects || []).map(cs => cs.id);
        if (csIds.length === 0) return [];
        query = query.in('class_subject_id', csIds);
      }
      if (filters?.studentId) {
        const { data: student } = await supabase!
          .from('students')
          .select('class_id')
          .eq('id', filters.studentId)
          .single();
        if (!student) return [];

        // Fetch student's specific subject registrations
        const { data: registeredSubs } = await supabase!
          .from('student_subjects')
          .select('class_subject_id')
          .eq('student_id', filters.studentId);
        
        let csIds: string[] = [];
        if (registeredSubs && registeredSubs.length > 0) {
          csIds = registeredSubs.map(rs => rs.class_subject_id);
        } else {
          // Fallback to all class subjects
          const { data: classSubjects } = await supabase!
            .from('class_subjects')
            .select('id')
            .eq('class_id', student.class_id);
          csIds = (classSubjects || []).map(cs => cs.id);
        }

        if (csIds.length === 0) return [];
        query = query.in('class_subject_id', csIds);
      }
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }

    let list = mockDB.getAssignments();
    if (filters?.classSubjectId) {
      list = list.filter(a => a.class_subject_id === filters.classSubjectId);
    }
    if (filters?.classId) {
      const classSubjects = mockDB.getClassSubjects().filter(cs => cs.class_id === filters.classId).map(cs => cs.id);
      list = list.filter(a => classSubjects.includes(a.class_subject_id));
    }
    if (filters?.studentId) {
      const student = mockDB.getStudents().find(s => s.id === filters.studentId);
      if (!student) return [];
      
      const registeredSubs = mockDB.getStudentSubjects().filter(ss => ss.student_id === filters.studentId);
      let csIds: string[] = [];
      if (registeredSubs.length > 0) {
        csIds = registeredSubs.map(ss => ss.class_subject_id);
      } else {
        csIds = mockDB.getClassSubjects().filter(cs => cs.class_id === student.class_id).map(cs => cs.id);
      }
      list = list.filter(a => csIds.includes(a.class_subject_id));
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async addAssignment(assignment: Omit<T.Assignment, 'id' | 'created_at'>): Promise<T.Assignment> {
    const newAssignment: T.Assignment = {
      ...assignment,
      id: `a-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('assignments')
        .insert(assignment)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const list = mockDB.getAssignments();
    list.push(newAssignment);
    mockDB.saveAssignments(list);
    return newAssignment;
  },

  async deleteAssignment(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
    let list = mockDB.getAssignments();
    list = list.filter(a => a.id !== id);
    mockDB.saveAssignments(list);
    
    // Also remove related submissions in mock
    let subs = mockDB.getSubmissions();
    subs = subs.filter(s => s.assignment_id !== id);
    mockDB.saveSubmissions(subs);
    return true;
  },

  async getSubmissions(assignmentId: string): Promise<T.Submission[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId);
      return data || [];
    }
    return mockDB.getSubmissions().filter(s => s.assignment_id === assignmentId);
  },

  async submitAssignment(submission: Omit<T.Submission, 'id' | 'submitted_at' | 'status' | 'grade' | 'feedback'>): Promise<T.Submission> {
    const newSubmission: T.Submission = {
      ...submission,
      id: `subm-${Date.now()}`,
      submitted_at: new Date().toISOString(),
      status: 'submitted'
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('submissions')
        .upsert(submission, { onConflict: 'assignment_id,student_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const list = mockDB.getSubmissions();
    const idx = list.findIndex(s => s.assignment_id === submission.assignment_id && s.student_id === submission.student_id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...submission, submitted_at: new Date().toISOString(), status: 'submitted' as const };
      mockDB.saveSubmissions(list);
      return list[idx];
    } else {
      list.push(newSubmission);
      mockDB.saveSubmissions(list);
      return newSubmission;
    }
  },

  async gradeSubmission(submissionId: string, grade: string, feedback: string): Promise<T.Submission> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('submissions')
        .update({ grade, feedback, status: 'graded' })
        .eq('id', submissionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const list = mockDB.getSubmissions();
    const idx = list.findIndex(s => s.id === submissionId);
    if (idx === -1) throw new Error('Submission not found');
    list[idx] = { ...list[idx], grade, feedback, status: 'graded' as const };
    mockDB.saveSubmissions(list);
    return list[idx];
  },

  async uploadSubmissionFile(file: File, filename: string): Promise<string> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.storage
        .from('submissions')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        });
      if (error) throw error;

      const { data } = supabase!.storage
        .from('submissions')
        .getPublicUrl(filename);
      return data.publicUrl;
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  },

  async getCbtExams(): Promise<T.CBTExam[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('cbt_exams')
        .select('*');
      if (error) throw error;
      return data || [];
    }
    return mockDB.getCbtExams();
  },

  async addCbtExam(exam: Omit<T.CBTExam, 'id' | 'created_at'>, questions: Omit<T.CBTQuestion, 'id' | 'exam_id'>[]): Promise<T.CBTExam> {
    if (isSupabaseConfigured) {
      const { data: examData, error: examError } = await supabase!
        .from('cbt_exams')
        .insert({
          class_subject_id: exam.class_subject_id,
          title: exam.title,
          duration_minutes: exam.duration_minutes,
          status: exam.status,
          created_by: exam.created_by
        })
        .select()
        .single();
      if (examError) throw examError;

      if (questions.length > 0) {
        const questionsToInsert = questions.map(q => ({
          exam_id: examData.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option
        }));
        const { error: questionsError } = await supabase!
          .from('cbt_questions')
          .insert(questionsToInsert);
        if (questionsError) throw questionsError;
      }

      return examData;
    } else {
      const examId = `exam-${Date.now()}`;
      const newExam: T.CBTExam = {
        ...exam,
        id: examId,
        created_at: new Date().toISOString()
      };

      const exams = mockDB.getCbtExams();
      exams.push(newExam);
      mockDB.saveCbtExams(exams);

      if (questions.length > 0) {
        const cbtQuestions = mockDB.getCbtQuestions();
        questions.forEach((q, idx) => {
          cbtQuestions.push({
            ...q,
            id: `q-${Date.now()}-${idx}`,
            exam_id: examId
          });
        });
        mockDB.saveCbtQuestions(cbtQuestions);
      }

      return newExam;
    }
  },

  async updateCBTExamStatus(examId: string, status: T.CBTExam['status']): Promise<T.CBTExam> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('cbt_exams')
        .update({ status })
        .eq('id', examId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const exams = mockDB.getCbtExams();
      const idx = exams.findIndex(e => e.id === examId);
      if (idx === -1) throw new Error('Exam not found');
      exams[idx] = { ...exams[idx], status };
      mockDB.saveCbtExams(exams);
      return exams[idx];
    }
  },

  async getCbtQuestions(examId?: string): Promise<T.CBTQuestion[]> {
    if (isSupabaseConfigured) {
      let query = supabase!.from('cbt_questions').select('*');
      if (examId) {
        query = query.eq('exam_id', examId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      const questions = mockDB.getCbtQuestions();
      if (examId) {
        return questions.filter(q => q.exam_id === examId);
      }
      return questions;
    }
  },

  async getCbtSubmissions(examId?: string): Promise<T.CBTSubmission[]> {
    if (isSupabaseConfigured) {
      let query = supabase!.from('cbt_submissions').select('*');
      if (examId) {
        query = query.eq('exam_id', examId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      const subs = mockDB.getCbtSubmissions();
      if (examId) {
        return subs.filter(s => s.exam_id === examId);
      }
      return subs;
    }
  },

  async addCbtSubmission(sub: Omit<T.CBTSubmission, 'id' | 'submitted_at'>): Promise<T.CBTSubmission> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('cbt_submissions')
        .insert({
          exam_id: sub.exam_id,
          student_id: sub.student_id,
          answers: sub.answers,
          score: sub.score,
          total_questions: sub.total_questions,
          tab_switch_count: sub.tab_switch_count,
          noise_spike_count: sub.noise_spike_count,
          proctor_violated: sub.proctor_violated,
          status: sub.status
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const newSub: T.CBTSubmission = {
        ...sub,
        id: `sub-${Date.now()}`,
        submitted_at: new Date().toISOString()
      };
      const subs = mockDB.getCbtSubmissions();
      const filtered = subs.filter(s => !(s.exam_id === sub.exam_id && s.student_id === sub.student_id));
      filtered.push(newSub);
      mockDB.saveCbtSubmissions(filtered);
      return newSub;
    }
  },

  async releaseCBTResults(examId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('cbt_submissions')
        .update({ status: 'released' })
        .eq('exam_id', examId);
      if (error) throw error;
    } else {
      const subs = mockDB.getCbtSubmissions();
      const updated = subs.map(s => {
        if (s.exam_id === examId) {
          return { ...s, status: 'released' as const };
        }
        return s;
      });
      mockDB.saveCbtSubmissions(updated);
    }
  },

  async withholdCBTResults(examId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('cbt_submissions')
        .update({ status: 'withheld' })
        .eq('exam_id', examId);
      if (error) throw error;
    } else {
      const subs = mockDB.getCbtSubmissions();
      const updated = subs.map(s => {
        if (s.exam_id === examId) {
          return { ...s, status: 'withheld' as const };
        }
        return s;
      });
      mockDB.saveCbtSubmissions(updated);
    }
  },

  async updateCBTSubmissionStatus(submissionId: string, status: 'submitted' | 'released' | 'withheld'): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('cbt_submissions')
        .update({ status })
        .eq('id', submissionId);
      if (error) throw error;
    } else {
      const subs = mockDB.getCbtSubmissions();
      const updated = subs.map(s => {
        if (s.id === submissionId) {
          return { ...s, status };
        }
        return s;
      });
      mockDB.saveCbtSubmissions(updated);
    }
  },

  async submitPasswordResetRequest(email: string, fullName: string): Promise<T.PasswordResetRequest> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('password_reset_requests')
        .insert({
          email: email.trim().toLowerCase(),
          full_name: fullName,
          status: 'pending'
        });
      if (error) throw error;
      return {
        id: '',
        email: email.trim().toLowerCase(),
        full_name: fullName,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    } else {
      const newRequest: T.PasswordResetRequest = {
        id: `req-${Date.now()}`,
        email: email.trim().toLowerCase(),
        full_name: fullName,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      const requests = mockDB.getPasswordResetRequests();
      requests.push(newRequest);
      mockDB.savePasswordResetRequests(requests);
      return newRequest;
    }
  },

  async getPasswordResetRequests(): Promise<T.PasswordResetRequest[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('password_reset_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const reqs = mockDB.getPasswordResetRequests();
      return reqs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async resolvePasswordResetRequest(requestId: string, tempPassword: string): Promise<void> {
    let email = '';
    if (isSupabaseConfigured) {
      const { data: req, error: reqError } = await supabase!
        .from('password_reset_requests')
        .select('email')
        .eq('id', requestId)
        .single();
      if (reqError) throw reqError;
      email = req.email;

      const { error: updateReqError } = await supabase!
        .from('password_reset_requests')
        .update({ status: 'resolved', temp_password: tempPassword })
        .eq('id', requestId);
      if (updateReqError) throw updateReqError;

      const { error: updateProfileError } = await supabase!
        .from('profiles')
        .update({ password_changed: false, temp_password: tempPassword })
        .eq('email', email);
      if (updateProfileError) throw updateProfileError;
    } else {
      const requests = mockDB.getPasswordResetRequests();
      const reqIdx = requests.findIndex(r => r.id === requestId);
      if (reqIdx !== -1) {
        requests[reqIdx].status = 'resolved';
        requests[reqIdx].temp_password = tempPassword;
        email = requests[reqIdx].email;
        mockDB.savePasswordResetRequests(requests);
      }

      const profiles = mockDB.getProfiles();
      const profIdx = profiles.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
      if (profIdx !== -1) {
        profiles[profIdx].password_changed = false;
        profiles[profIdx].temp_password = tempPassword;
        mockDB.saveProfiles(profiles);
      }
    }
  },

  async clearTempPassword(profileId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('profiles')
        .update({ temp_password: null })
        .eq('id', profileId);
      if (error) throw error;
    } else {
      const profiles = mockDB.getProfiles();
      const idx = profiles.findIndex(p => p.id === profileId);
      if (idx !== -1) {
        const updatedProfiles = [...profiles];
        updatedProfiles[idx] = {
          ...updatedProfiles[idx],
          temp_password: undefined
        };
        mockDB.saveProfiles(updatedProfiles);
      }
    }
  }
};

