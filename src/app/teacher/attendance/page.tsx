'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { UserCheck, Calendar, Save, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RowState {
  studentId: string;
  status: T.Attendance['status'];
  remarks: string;
}

export default function MarkAttendancePage() {
  const { user } = useAuth();
  const [myAllocations, setMyAllocations] = useState<{ id: string; className: string; subjectName: string }[]>([]);
  const [students, setStudents] = useState<T.Student[]>([]);
  const [selectedCsId, setSelectedCsId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRows, setAttendanceRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadAllocations() {
      if (!user) return;
      try {
        const [csList, clsList, subList] = await Promise.all([
          dbService.getClassSubjects(),
          dbService.getClasses(),
          dbService.getSubjects()
        ]);

        const mine = csList.filter(cs => cs.teacher_id === user.id);
        const mapped = mine.map(cs => {
          const cls = clsList.find(c => c.id === cs.class_id);
          const sub = subList.find(s => s.id === cs.subject_id);
          return {
            id: cs.id,
            classId: cs.class_id,
            className: cls ? cls.name : 'Unknown Class',
            subjectName: sub ? `${sub.name} (${sub.code})` : 'Unknown Subject'
          };
        });

        setMyAllocations(mapped);
        if (mapped.length > 0) {
          setSelectedCsId(mapped[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAllocations();
  }, [user]);

  // Load students and existing attendance when selection changes
  useEffect(() => {
    if (!selectedCsId) return;

    async function loadAttendanceData() {
      try {
        const cs = await dbService.getClassSubjects();
        const selectedCS = cs.find(x => x.id === selectedCsId);
        if (!selectedCS) return;

        // Fetch students enrolled for this class subject
        const classStudents = await dbService.getStudentsForClassSubject(selectedCsId);
        setStudents(classStudents);

        // Fetch existing attendance logs
        const logs = await dbService.getAttendance();
        const dateLogs = logs.filter(log => log.class_subject_id === selectedCsId && log.date === attendanceDate);

        // Set up rows
        const rows = classStudents.map(student => {
          const matchedLog = dateLogs.find(l => l.student_id === student.id);
          return {
            studentId: student.id,
            status: matchedLog ? matchedLog.status : 'present' as T.Attendance['status'],
            remarks: matchedLog ? matchedLog.remarks || '' : ''
          };
        });
        setAttendanceRows(rows);
      } catch (err) {
        console.error(err);
      }
    }
    loadAttendanceData();
  }, [selectedCsId, attendanceDate]);

  const handleStatusChange = (studentId: string, status: T.Attendance['status']) => {
    setAttendanceRows(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceRows(prev => prev.map(r => r.studentId === studentId ? { ...r, remarks } : r));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCsId) return;

    setSubmitting(true);
    setSaveSuccess(false);

    try {
      const payload = attendanceRows.map(row => ({
        student_id: row.studentId,
        class_subject_id: selectedCsId,
        date: attendanceDate,
        status: row.status,
        remarks: row.remarks || undefined
      }));

      await dbService.saveAttendanceList(payload);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Count summaries
  const presentCount = attendanceRows.filter(r => r.status === 'present').length;
  const absentCount = attendanceRows.filter(r => r.status === 'absent').length;
  const lateCount = attendanceRows.filter(r => r.status === 'late').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mark Attendance Roll Call</h1>
          <p className="text-sm text-gray-500 mt-1">Select class subject, set calendar date, and check students off the roll sheets.</p>
        </div>

        {myAllocations.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 rounded-xl text-center text-xs text-gray-500">
            You are not allocated to teach any classes. Please contact administration.
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Control Panel */}
            <div className="bg-white border border-gray-200 p-5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 shadow-xs items-end">
              <div className="text-xs">
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Select Class-Subject</label>
                <select
                  value={selectedCsId}
                  onChange={e => setSelectedCsId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {myAllocations.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.className}] — {item.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs">
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 font-sans">Attendance Date</label>
                <input
                  type="date"
                  required
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="w-full px-3 py-1.8 border border-gray-300 rounded-lg bg-white font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700"
                />
              </div>

              {/* Status tally summaries */}
              <div className="flex justify-around items-center bg-gray-50 border rounded-lg p-2.5 h-[38px] text-[11px] font-bold">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Present: {presentCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span>Absent: {absentCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>Late: {lateCount}</span>
                </div>
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg font-bold text-xs flex items-center gap-2">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Attendance saved successfully. Records updated.</span>
              </div>
            )}            {/* Attendance List Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                      <th className="p-4 w-40">Admission No</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4 w-72">Roll Status</th>
                      <th className="p-4">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">No students found registered in this class.</td>
                      </tr>
                    ) : (
                      students.map(student => {
                        const row = attendanceRows.find(r => r.studentId === student.id);
                        const status = row ? row.status : 'present';
                        const remarks = row ? row.remarks : '';

                        return (
                          <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-gray-900">{student.admission_no}</td>
                            <td className="p-4 font-bold text-gray-900">{student.full_name}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-4 text-xs font-semibold">
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                                  <input
                                    type="radio"
                                    name={`status-${student.id}`}
                                    className="text-primary focus:ring-primary h-3.5 w-3.5"
                                    checked={status === 'present'}
                                    onChange={() => handleStatusChange(student.id, 'present')}
                                  />
                                  <span className="text-emerald-700">Present</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                                  <input
                                    type="radio"
                                    name={`status-${student.id}`}
                                    className="text-red-500 focus:ring-red-500 h-3.5 w-3.5"
                                    checked={status === 'absent'}
                                    onChange={() => handleStatusChange(student.id, 'absent')}
                                  />
                                  <span className="text-red-600">Absent</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                                  <input
                                    type="radio"
                                    name={`status-${student.id}`}
                                    className="text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
                                    checked={status === 'late'}
                                    onChange={() => handleStatusChange(student.id, 'late')}
                                  />
                                  <span className="text-amber-700">Late</span>
                                </label>
                              </div>
                            </td>
                            <td className="p-4">
                              <input
                                type="text"
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
                                placeholder="Add optional remarks..."
                                value={remarks}
                                onChange={e => handleRemarksChange(student.id, e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden block space-y-4 p-4 bg-gray-50/50">
                {students.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 bg-white border rounded-2xl">No students found registered in this class.</div>
                ) : (
                  students.map(student => {
                    const row = attendanceRows.find(r => r.studentId === student.id);
                    const status = row ? row.status : 'present';
                    const remarks = row ? row.remarks : '';

                    return (
                      <div key={student.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3.5 shadow-xs premium-card-hover">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-gray-950 text-xs leading-tight font-sans">{student.full_name}</h4>
                            <p className="text-[9px] text-gray-400 font-mono mt-0.5">Admission: {student.admission_no}</p>
                          </div>
                        </div>

                        {/* Segmented Roll Buttons */}
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-extrabold">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`py-2.5 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              status === 'present'
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs scale-102'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={`py-2.5 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              status === 'absent'
                                ? 'bg-red-500 text-white border-red-500 shadow-xs scale-102'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Absent</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={`py-2.5 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              status === 'late'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs scale-102'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Late</span>
                          </button>
                        </div>

                        {/* Remarks input */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold block">Remarks / Notes</label>
                          <input
                            type="text"
                            className="w-full px-3 py-1.8 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
                            placeholder="Add student remarks..."
                            value={remarks}
                            onChange={e => handleRemarksChange(student.id, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action bar */}
              {students.length > 0 && (
                <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{submitting ? 'Saving Attendance...' : 'Save Attendance Sheet'}</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
