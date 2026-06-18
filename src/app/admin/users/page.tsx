'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import * as T from '@/lib/types';
import { Plus, Search, UserCheck, GraduationCap, Users, UserPlus, Mail, Phone, Calendar, AlertTriangle } from 'lucide-react';

export default function UsersManagementPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'promotions'>('students');
  const [students, setStudents] = useState<T.Student[]>([]);
  const [teachers, setTeachers] = useState<T.Teacher[]>([]);
  const [profiles, setProfiles] = useState<T.Profile[]>([]);
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Search queries
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Modals / Form States
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Form Fields - Student
  const [sName, setSName] = useState('');
  const [sAdmissionNo, setSAdmissionNo] = useState('');
  const [sClassId, setSClassId] = useState('');
  const [sParentName, setSParentName] = useState('');
  const [sParentPhone, setSParentPhone] = useState('');
  const [sParentEmail, setSParentEmail] = useState('');
  const [sProfileEmail, setSProfileEmail] = useState(''); // Optional student profile email

  // Form Fields - Teacher
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tSpecialization, setTSpecialization] = useState('');
  const [tQualification, setTQualification] = useState('');

  // Student & Parent Passwords
  const [sPassword, setSPassword] = useState('');
  const [sParentPassword, setSParentPassword] = useState('');

  // Edit states
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Student subjects management states
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [subjectsStudent, setSubjectsStudent] = useState<T.Student | null>(null);
  const [studentSubjectsAllocations, setStudentSubjectsAllocations] = useState<T.ClassSubject[]>([]);
  const [selectedStudentSubjectIds, setSelectedStudentSubjectIds] = useState<string[]>([]);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [subjectsModalError, setSubjectsModalError] = useState('');

  // Student promotions states
  const [promoSourceClassId, setPromoSourceClassId] = useState('');
  const [promoTargetClassId, setPromoTargetClassId] = useState('');
  const [selectedPromoStudentIds, setSelectedPromoStudentIds] = useState<string[]>([]);
  const [promoting, setPromoting] = useState(false);
  const [promoSuccessMessage, setPromoSuccessMessage] = useState('');

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [stdList, tchrList, profList, clsList, subList] = await Promise.all([
        dbService.getStudents(),
        dbService.getTeachers(),
        dbService.getProfiles(),
        dbService.getClasses(),
        dbService.getSubjects()
      ]);
      setStudents(stdList);
      setTeachers(tchrList);
      setProfiles(profList);
      setClasses(clsList);
      setSubjects(subList);
      if (clsList.length > 0) {
        if (!sClassId) setSClassId(clsList[0].id);
        if (!promoSourceClassId) setPromoSourceClassId(clsList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update student checkboxes and target class when source class changes
  useEffect(() => {
    if (promoSourceClassId) {
      const classStudents = students.filter(s => s.class_id === promoSourceClassId);
      setSelectedPromoStudentIds(classStudents.map(s => s.id));

      const currentIndex = classes.findIndex(c => c.id === promoSourceClassId);
      if (currentIndex !== -1 && currentIndex + 1 < classes.length) {
        setPromoTargetClassId(classes[currentIndex + 1].id);
      } else {
        setPromoTargetClassId('graduate');
      }
    } else {
      setSelectedPromoStudentIds([]);
    }
    setPromoSuccessMessage('');
  }, [promoSourceClassId, students, classes]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sAdmissionNo || !sClassId || !sParentName) return;

    try {
      let profile_id: string | undefined = undefined;

      if (editingStudentId) {
        await dbService.updateStudent(editingStudentId, {
          full_name: sName,
          admission_no: sAdmissionNo,
          class_id: sClassId,
          parent_name: sParentName,
          parent_phone: sParentPhone,
          parent_email: sParentEmail
        });
      } else {
        // 1. Create Student profile if email provided
        if (sProfileEmail && sPassword) {
          profile_id = await dbService.createUserInAuth(sProfileEmail, sPassword, sName, 'student');
        }

        // 2. Create Parent profile if email provided and parent doesn't exist yet
        if (sParentEmail) {
          const isParentRegistered = profiles.some(p => p.email.toLowerCase() === sParentEmail.toLowerCase() && p.role === 'parent');
          if (!isParentRegistered && sParentPassword) {
            await dbService.createUserInAuth(sParentEmail, sParentPassword, sParentName, 'parent');
          }
        }

        await dbService.addStudent({
          profile_id,
          class_id: sClassId,
          admission_no: sAdmissionNo,
          full_name: sName,
          parent_name: sParentName,
          parent_phone: sParentPhone,
          parent_email: sParentEmail
        });
      }

      // Reset
      setSName('');
      setSAdmissionNo('');
      setSParentName('');
      setSParentPhone('');
      setSParentEmail('');
      setSProfileEmail('');
      setSPassword('');
      setSParentPassword('');
      setEditingStudentId(null);
      setShowStudentModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      if (err.message?.toLowerCase().includes('already registered') || err.message?.includes('422')) {
        setStudentError('This email is already registered in the system (Supabase Auth). If this student/parent account was previously deleted, please delete the user from your Supabase Auth Console, or use a different email address.');
      } else {
        setStudentError(err.message || 'An error occurred while saving the student record.');
      }
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName || !tEmail || !tPassword) return;

    try {
      // 1. Create the Auth user first
      const teacherId = await dbService.createUserInAuth(tEmail, tPassword, tName, 'teacher');

      // 2. Create the Teacher metadata
      const teacherMeta: T.Teacher = {
        id: teacherId,
        phone: tPhone,
        specialization: tSpecialization,
        qualification: tQualification,
        joined_date: new Date().toISOString().split('T')[0]
      };

      await dbService.addTeacherMetadataOnly(teacherMeta);

      // Reset
      setTName('');
      setTEmail('');
      setTPassword('');
      setTPhone('');
      setTSpecialization('');
      setTQualification('');
      setShowTeacherModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      if (err.message?.toLowerCase().includes('already registered') || err.message?.includes('422')) {
        setTeacherError('This email is already registered in the system (Supabase Auth). If this staff was previously deleted, they must be manually removed from your Supabase Auth Console first, or you can register them with a different email address.');
      } else {
        setTeacherError(err.message || 'An error occurred while registering the staff member.');
      }
    }
  };

  const handleEditStudent = (student: T.Student) => {
    setStudentError('');
    setEditingStudentId(student.id);
    setSName(student.full_name);
    setSAdmissionNo(student.admission_no);
    setSClassId(student.class_id || '');
    setSParentName(student.parent_name);
    setSParentPhone(student.parent_phone || '');
    setSParentEmail(student.parent_email || '');
    setSProfileEmail(profiles.find(p => p.id === student.profile_id)?.email || '');
    setShowStudentModal(true);
  };

  const handleDeleteStudent = (id: string, profileId?: string | null) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Student Record',
      message: 'Are you sure you want to delete this student? All grades, attendance, and fee records for this student will be permanently deleted.',
      onConfirm: async () => {
        try {
          await dbService.deleteStudent(id, profileId);
          loadData();
        } catch (err) {
          console.error(err);
        }
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleDeleteTeacher = (id: string) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Staff Account',
      message: 'Are you sure you want to delete this teacher? Their portal account and profile metadata will be permanently removed.',
      onConfirm: async () => {
        try {
          await dbService.deleteTeacher(id);
          loadData();
        } catch (err) {
          console.error(err);
        }
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleManageSubjects = async (student: T.Student) => {
    setSubjectsStudent(student);
    setSubjectsModalError('');
    setSavingSubjects(false);
    
    try {
      // Get class subjects allocations for this student's class
      const csList = await dbService.getClassSubjects();
      const classCs = csList.filter(cs => cs.class_id === student.class_id);
      setStudentSubjectsAllocations(classCs);

      // Get student's current registrations
      const registered = await dbService.getStudentSubjects({ studentId: student.id });
      const activeCsIds = registered.map(r => r.class_subject_id);
      setSelectedStudentSubjectIds(activeCsIds);
      
      setShowSubjectsModal(true);
    } catch (err: any) {
      console.error(err);
      alert('Failed to load student subjects data: ' + err.message);
    }
  };

  const handleSaveStudentSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectsStudent) return;

    setSavingSubjects(true);
    setSubjectsModalError('');
    try {
      await dbService.setStudentSubjects(subjectsStudent.id, selectedStudentSubjectIds);
      setShowSubjectsModal(false);
      setSubjectsStudent(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setSubjectsModalError(err.message || 'Failed to save subject registrations.');
    } finally {
      setSavingSubjects(false);
    }
  };

  const handlePromoteStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoSourceClassId || !promoTargetClassId || selectedPromoStudentIds.length === 0) return;

    setPromoting(true);
    setPromoSuccessMessage('');
    try {
      const targetId = promoTargetClassId === 'graduate' ? null : promoTargetClassId;
      await dbService.promoteStudents(selectedPromoStudentIds, targetId);
      
      const targetLabel = promoTargetClassId === 'graduate' ? 'Graduated / Alumni' : classes.find(c => c.id === promoTargetClassId)?.name || 'New Class';
      setPromoSuccessMessage(`Successfully promoted ${selectedPromoStudentIds.length} students to ${targetLabel}!`);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Failed to promote students: ' + err.message);
    } finally {
      setPromoting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const term = studentSearch.toLowerCase();
    const cls = classes.find(c => c.id === s.class_id);
    return (
      s.full_name.toLowerCase().includes(term) ||
      s.admission_no.toLowerCase().includes(term) ||
      s.parent_name.toLowerCase().includes(term) ||
      (cls && cls.name.toLowerCase().includes(term))
    );
  });

  // Filter teachers
  const filteredTeachers = teachers.filter(t => {
    const profile = profiles.find(p => p.id === t.id);
    const term = teacherSearch.toLowerCase();
    return (
      (profile && profile.full_name.toLowerCase().includes(term)) ||
      (profile && profile.email.toLowerCase().includes(term)) ||
      (t.specialization && t.specialization.toLowerCase().includes(term))
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Records & Staff Registry</h1>
            <p className="text-sm text-gray-500 mt-1">Manage registration cards, parent information, and assigned staff qualifications.</p>
          </div>
          {activeTab !== 'promotions' && (
            <button 
              onClick={() => {
                if (activeTab === 'students') {
                  setStudentError('');
                  setShowStudentModal(true);
                } else {
                  setTeacherError('');
                  setShowTeacherModal(true);
                }
              }}
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{activeTab === 'students' ? 'Add Student' : 'Add Staff'}</span>
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('students'); setEditingStudentId(null); }}
            className={`px-6 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'students' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Students ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-6 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'teachers' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Teachers ({teachers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-6 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'promotions' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Auto-Promotions</span>
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            {/* Table Controls */}
            <div className="p-4 border-b border-gray-150 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, admission, class..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <span className="text-xs font-semibold text-gray-500">Showing {filteredStudents.length} records</span>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                    <th className="p-4">Admission No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Parent Details</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No students matching search criteria.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const cls = classes.find(c => c.id === student.class_id);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{student.admission_no}</td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{student.full_name}</div>
                            {student.profile_id && (
                              <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                Account: {profiles.find(p => p.id === student.profile_id)?.email}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full font-bold uppercase text-[10px]">
                              {cls ? cls.name : 'Unassigned'}
                            </span>
                          </td>
                          <td className="p-4 space-y-1">
                            <div className="font-bold text-gray-800">{student.parent_name}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <span>{student.parent_phone || 'N/A'}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              <span>{student.parent_email || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleManageSubjects(student)}
                              className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg font-bold cursor-pointer transition-colors"
                            >
                              Subjects
                            </button>
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="px-2.5 py-1.5 text-xs text-primary hover:bg-emerald-50 border border-gray-200 rounded-lg font-bold cursor-pointer transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.profile_id)}
                              className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-bold cursor-pointer transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            {/* Table Controls */}
            <div className="p-4 border-b border-gray-150 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teacher, specialization..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                />
              </div>
              <span className="text-xs font-semibold text-gray-500">Showing {filteredTeachers.length} staff records</span>
            </div>

            {/* Teachers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                    <th className="p-4">Staff Name</th>
                    <th className="p-4">Email Portal Account</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4">Qualification</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No staff accounts registered.</td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher) => {
                      const profile = profiles.find(p => p.id === teacher.id);
                      return (
                        <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{profile ? profile.full_name : 'Unknown Staff'}</td>
                          <td className="p-4 font-semibold text-gray-700">{profile ? profile.email : 'N/A'}</td>
                          <td className="p-4 font-medium text-gray-600">{teacher.phone || 'N/A'}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-100 rounded-md font-bold text-[10px]">
                              {teacher.specialization || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-gray-600">{teacher.qualification || 'N/A'}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-bold cursor-pointer transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6 space-y-6 text-xs font-semibold">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Session Transition & Auto-Promotion</h2>
              <p className="text-xs text-gray-500 mt-1">Bulk promote students from a source class to a target class. Deselect students who are repeating the academic year.</p>
            </div>

            {promoSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-lg font-bold flex items-center gap-2">
                <span>✓ {promoSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handlePromoteStudents} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Source Class (Promote From)</label>
                  <select
                    required
                    value={promoSourceClassId}
                    onChange={e => setPromoSourceClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-bold text-gray-950 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Target Class (Promote To)</label>
                  <select
                    required
                    value={promoTargetClassId}
                    onChange={e => setPromoTargetClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-bold text-gray-950 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    {classes
                      .filter(c => c.id !== promoSourceClassId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
                      ))}
                    <option value="graduate">🎓 Graduate / Archive (Set Class to Unassigned)</option>
                  </select>
                </div>
              </div>

              {/* Roster Checklist */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-150 bg-gray-50/75 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Students list in source class</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const classStudents = students.filter(s => s.class_id === promoSourceClassId);
                        setSelectedPromoStudentIds(classStudents.map(s => s.id));
                      }}
                      className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPromoStudentIds([])}
                      className="text-[10px] text-gray-500 hover:underline font-bold cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 max-h-[40vh] overflow-y-auto">
                  {students.filter(s => s.class_id === promoSourceClassId).length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-medium bg-white">
                      No students are currently enrolled in the selected source class.
                    </div>
                  ) : (
                    students
                      .filter(s => s.class_id === promoSourceClassId)
                      .map(student => {
                        const isChecked = selectedPromoStudentIds.includes(student.id);
                        return (
                          <label
                            key={student.id}
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50/50 transition-colors font-semibold bg-white ${
                              isChecked ? 'text-gray-900' : 'text-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedPromoStudentIds(prev => [...prev, student.id]);
                                } else {
                                  setSelectedPromoStudentIds(prev => prev.filter(id => id !== student.id));
                                }
                              }}
                            />
                            <div className="flex justify-between items-center flex-1">
                              <span className="font-bold">{student.full_name}</span>
                              <span className="text-[10px] text-gray-400 font-mono font-medium">{student.admission_no}</span>
                            </div>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={promoting || selectedPromoStudentIds.length === 0}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  {promoting ? 'Promoting...' : `Promote Selected (${selectedPromoStudentIds.length})`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Student Registration Modal */}
        {showStudentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden border shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-base font-extrabold text-gray-900">
                  {editingStudentId ? 'Edit Student Record' : 'Register New Student'}
                </h2>
                <button 
                  onClick={() => { setShowStudentModal(false); setEditingStudentId(null); }} 
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateStudent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {studentError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{studentError}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={sName} 
                      onChange={e => setSName(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Admission No</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="AUD-2026-XXX" 
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={sAdmissionNo} 
                      onChange={e => setSAdmissionNo(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Class Room</label>
                    <select 
                      required 
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={sClassId} 
                      onChange={e => setSClassId(e.target.value)}
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Student Portal Email (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="e.g. name@aud.edu.ng"
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={sProfileEmail} 
                      onChange={e => setSProfileEmail(e.target.value)} 
                      disabled={!!editingStudentId}
                    />
                  </div>
                </div>

                {sProfileEmail && !editingStudentId && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Student Portal Password</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="Minimum 6 characters"
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={sPassword} 
                      onChange={e => setSPassword(e.target.value)} 
                    />
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Parent Information</span>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">Parent Full Name</label>
                      <input 
                        type="text" 
                        required 
                        className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                        value={sParentName} 
                        onChange={e => setSParentName(e.target.value)} 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Parent Phone</label>
                        <input 
                          type="text" 
                          className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                          value={sParentPhone} 
                          onChange={e => setSParentPhone(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Parent Email</label>
                        <input 
                          type="email" 
                          className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                          value={sParentEmail} 
                          onChange={e => setSParentEmail(e.target.value)} 
                        />
                      </div>
                    </div>

                    {sParentEmail && !editingStudentId && (
                      <div className="mt-2">
                        {profiles.some(p => p.email.toLowerCase() === sParentEmail.toLowerCase() && p.role === 'parent') ? (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg font-medium">
                            ✓ Parent account already exists. This student will be linked to the existing parent profile.
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-gray-700">Parent Portal Password</label>
                            <input 
                              type="password" 
                              required 
                              placeholder="Choose parent portal password"
                              className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                              value={sParentPassword} 
                              onChange={e => setSParentPassword(e.target.value)} 
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-150 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowStudentModal(false); setEditingStudentId(null); }} 
                    className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {editingStudentId ? 'Save Changes' : 'Register Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Teacher Hiring Modal */}
        {showTeacherModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden border shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-base font-extrabold text-gray-900">Hire / Register Staff</h2>
                <button onClick={() => setShowTeacherModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
              </div>
              <form onSubmit={handleCreateTeacher} className="p-6 space-y-4">
                {teacherError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{teacherError}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Staff Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={tName} 
                      onChange={e => setTName(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Contact Phone</label>
                    <input 
                      type="text" 
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={tPhone} 
                      onChange={e => setTPhone(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Portal Email Address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="e.g. teacher.name@aud.edu.ng"
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={tEmail} 
                      onChange={e => setTEmail(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Portal Password</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="Min 6 characters"
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={tPassword} 
                      onChange={e => setTPassword(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Specialization / Taught Subjects</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mathematics"
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={tSpecialization} 
                      onChange={e => setTSpecialization(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Educational Qualification</label>
                    <input 
                      type="text" 
                      placeholder="e.g. B.Ed, PGDE"
                      className="mt-1 block w-full px-3 py-2 border rounded-lg text-xs" 
                      value={tQualification} 
                      onChange={e => setTQualification(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-150 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowTeacherModal(false)} 
                    className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Hire Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 border shadow-lg animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 shrink-0" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">{deleteConfirm.title}</h3>
            </div>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">
              {deleteConfirm.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 cursor-pointer hover:bg-gray-50 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteConfirm.onConfirm();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer font-bold transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Subjects Modal */}
      {showSubjectsModal && subjectsStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden border shadow-lg animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Manage Registered Subjects</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Student: <span className="font-bold text-gray-800">{subjectsStudent.full_name}</span></p>
              </div>
              <button 
                onClick={() => { setShowSubjectsModal(false); setSubjectsStudent(null); }} 
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveStudentSubjects} className="p-6 space-y-4">
              {subjectsModalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-[11px]">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{subjectsModalError}</span>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-800 text-[11px] font-semibold leading-relaxed">
                💡 Compulsory Fallback Policy: If no subjects are checked, the student automatically offers ALL subjects mapped to their class. Check checkboxes only if this student offers a custom elective selection.
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                <label className="block text-xs font-bold text-gray-700 mb-2">Registered Subjects Grid</label>
                {studentSubjectsAllocations.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 border border-dashed rounded-lg bg-gray-50 font-medium">
                    No subjects are currently assigned to this student&apos;s class. Assign subjects to their class under Portal Settings first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {studentSubjectsAllocations.map(cs => {
                      const isChecked = selectedStudentSubjectIds.includes(cs.id);
                      const sub = subjects.find(s => s.id === cs.subject_id);
                      const teacherProf = cs.teacher_id ? profiles.find(p => p.id === cs.teacher_id) : null;
                      return (
                        <label 
                          key={cs.id} 
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors font-semibold text-xs ${
                            isChecked 
                              ? 'bg-emerald-50/50 border-emerald-300 text-emerald-955' 
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedStudentSubjectIds(prev => [...prev, cs.id]);
                              } else {
                                setSelectedStudentSubjectIds(prev => prev.filter(id => id !== cs.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-bold">{sub ? sub.name : 'Unknown Subject'}</div>
                            <div className="text-[10px] text-gray-400 font-medium">Teacher: {teacherProf ? teacherProf.full_name : 'Unassigned'}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-150 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setShowSubjectsModal(false); setSubjectsStudent(null); }} 
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingSubjects}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  {savingSubjects ? 'Saving...' : 'Save Subjects'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
