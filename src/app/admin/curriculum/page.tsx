'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import * as T from '@/lib/types';
import { Plus, BookOpen, School, Award, ChevronRight, User, AlertTriangle } from 'lucide-react';

export default function CurriculumPage() {
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [teachers, setTeachers] = useState<T.Teacher[]>([]);
  const [profiles, setProfiles] = useState<T.Profile[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms / Actions state
  const [cName, setCName] = useState('');
  const [cLevel, setCLevel] = useState<'primary' | 'secondary'>('secondary');

  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subLevel, setSubLevel] = useState<'primary' | 'secondary'>('secondary');

  // Allocation state
  const [allocClassId, setAllocClassId] = useState('');
  const [allocSubjectId, setAllocSubjectId] = useState('');
  const [allocTeacherId, setAllocTeacherId] = useState('');

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
      const [clsList, subList, tchrList, profList, csList] = await Promise.all([
        dbService.getClasses(),
        dbService.getSubjects(),
        dbService.getTeachers(),
        dbService.getProfiles(),
        dbService.getClassSubjects()
      ]);
      setClasses(clsList);
      setSubjects(subList);
      setTeachers(tchrList);
      setProfiles(profList);
      setClassSubjects(csList);

      // Pre-select first values for allocation form
      if (clsList.length > 0) setAllocClassId(clsList[0].id);
      if (subList.length > 0) setAllocSubjectId(subList[0].id);
      
      const teacherProfiles = profList.filter(p => p.role === 'teacher');
      if (teacherProfiles.length > 0) setAllocTeacherId(teacherProfiles[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;
    try {
      await dbService.addClass(cName, cLevel);
      setCName('');
      loadData();
    } catch (err) {
      alert('Class already exists or database error occurred.');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subCode) return;
    try {
      await dbService.addSubject(subName, subCode, subLevel);
      setSubName('');
      setSubCode('');
      loadData();
    } catch (err) {
      alert('Subject code already exists or database error occurred.');
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocClassId || !allocSubjectId || !allocTeacherId) return;
    try {
      await dbService.assignClassSubject(allocClassId, allocSubjectId, allocTeacherId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClass = (id: string) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Class Room',
      message: 'Are you sure you want to delete this class? This will permanently remove all course mappings, timetable slots, student links, and grades associated with this class.',
      onConfirm: async () => {
        try {
          await dbService.deleteClass(id);
          loadData();
        } catch (err) {
          console.error(err);
        }
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleDeleteSubject = (id: string) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Subject',
      message: 'Are you sure you want to delete this subject? This will permanently remove all course mappings, timetable slots, attendance records, and grades associated with this subject.',
      onConfirm: async () => {
        try {
          await dbService.deleteSubject(id);
          loadData();
        } catch (err) {
          console.error(err);
        }
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleDeleteAllocation = (id: string) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Course Allocation',
      message: 'Are you sure you want to remove this teacher-subject allocation?',
      onConfirm: async () => {
        try {
          await dbService.deleteClassSubject(id);
          loadData();
        } catch (err) {
          console.error(err);
        }
        setDeleteConfirm(prev => ({ ...prev, show: false }));
      }
    });
  };

  // Filter subjects based on selected class level in allocation form
  const selectedClass = classes.find(c => c.id === allocClassId);
  const filteredSubjectsForAlloc = subjects.filter(s => !selectedClass || s.level === selectedClass.level);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Classes & Subjects Map</h1>
          <p className="text-sm text-gray-500 mt-1">Configure classes (primary vs secondary), register subject catalog, and map course teachers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Class Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <School className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-gray-900">Add Class Room</h2>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700">Class Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. JSS 1B, Basic 4 Gold"
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white" 
                  value={cName} 
                  onChange={e => setCName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700">Level</label>
                <select 
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  value={cLevel} 
                  onChange={e => setCLevel(e.target.value as any)}
                >
                  <option value="secondary">Secondary School</option>
                  <option value="primary">Primary School</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer transition-colors"
              >
                Create Class
              </button>
            </form>

            <div className="border-t border-gray-100 pt-4">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Active Classes</span>
              <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
                {classes.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100 text-[11px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{c.name}</span>
                      <span className={`w-fit mt-1 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider text-[8px] border ${
                        c.level === 'secondary' ? 'bg-blue-50/50 text-blue-700 border-blue-100' : 'bg-emerald-50/50 text-emerald-700 border-emerald-100'
                      }`}>
                        {c.level}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteClass(c.id)}
                      className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Create Subject Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-gray-900">Add New Subject</h2>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Subject Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Literacy"
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white" 
                    value={subName} 
                    onChange={e => setSubName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Subject Code</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. LIT 101"
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white" 
                    value={subCode} 
                    onChange={e => setSubCode(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700">Level</label>
                <select 
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  value={subLevel} 
                  onChange={e => setSubLevel(e.target.value as any)}
                >
                  <option value="secondary">Secondary School</option>
                  <option value="primary">Primary School</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer transition-colors"
              >
                Add Subject
              </button>
            </form>

            <div className="border-t border-gray-100 pt-4">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject Catalog</span>
              <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
                {subjects.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100 text-[11px]">
                    <div>
                      <div className="font-bold text-gray-800">{s.name} <span className="text-gray-400">({s.code})</span></div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">{s.level}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteSubject(s.id)}
                      className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Allocation Card (Pivot Map Builder) */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-gray-900">Map Subject & Teacher</h2>
            </div>
            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700">Class Room</label>
                <select 
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  value={allocClassId} 
                  onChange={e => setAllocClassId(e.target.value)}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700">Subject (Level matching Class)</label>
                <select 
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  value={allocSubjectId} 
                  onChange={e => setAllocSubjectId(e.target.value)}
                >
                  {filteredSubjectsForAlloc.length === 0 ? (
                    <option value="">No subjects registered for this level</option>
                  ) : (
                    filteredSubjectsForAlloc.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700">Assign Teacher</label>
                <select 
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  value={allocTeacherId} 
                  onChange={e => setAllocTeacherId(e.target.value)}
                >
                  {profiles.filter(p => p.role === 'teacher').map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={filteredSubjectsForAlloc.length === 0}
                className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer disabled:opacity-50 transition-colors"
              >
                Map Course Allocation
              </button>
            </form>
          </div>
        </div>

        {/* Big Mapping Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-150 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900">Active Course Allocations (class_subjects)</h2>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                  <th className="p-4">Class</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Assigned Teacher</th>
                  <th className="p-4">Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No subject allocations defined. Allocate course mapping above.</td>
                  </tr>
                ) : (
                  classSubjects.map((cs) => {
                    const cls = classes.find(c => c.id === cs.class_id);
                    const sub = subjects.find(s => s.id === cs.subject_id);
                    const teacherProfile = profiles.find(p => p.id === cs.teacher_id);
                    return (
                      <tr key={cs.id} className="hover:bg-gray-50/50 transition-colors font-medium">
                        <td className="p-4 font-bold text-gray-900">{cls ? cls.name : 'Unknown Class'}</td>
                        <td className="p-4">
                          <span className="font-bold text-gray-800">{sub ? sub.name : 'Unknown Subject'}</span>
                          <span className="text-gray-400 font-semibold ml-2">({sub?.code})</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-bold text-gray-800">{teacherProfile ? teacherProfile.full_name : 'No Teacher Assigned'}</span>
                          </div>
                        </td>
                        <td className="p-4 uppercase">
                          <span className={`px-2 py-0.2 rounded-full font-bold text-[9px] border ${
                            cls?.level === 'secondary' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {cls?.level || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteAllocation(cs.id)}
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
    </DashboardLayout>
  );
}
