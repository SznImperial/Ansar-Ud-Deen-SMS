'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';

export default function StudentAttendancePage() {
  const { user } = useAuth();

  // Child switcher (for parents)
  const [myStudents, setMyStudents] = useState<T.Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<T.Student | null>(null);

  const [attendance, setAttendance] = useState<T.Attendance[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIdentity() {
      if (!user) return;
      try {
        const stdList = await dbService.getStudents();
        let mine: T.Student[] = [];
        if (user.role === 'student') {
          mine = stdList.filter(s => s.profile_id === user.id);
        } else if (user.role === 'parent') {
          mine = stdList.filter(s => s.parent_email?.toLowerCase() === user.email.toLowerCase());
        }
        
        setMyStudents(mine);
        if (mine.length > 0) {
          const savedId = typeof window !== 'undefined' ? localStorage.getItem('parent_active_student_id') : null;
          const matched = mine.find(s => s.id === savedId);
          setActiveStudent(matched || mine[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadIdentity();
  }, [user]);

  useEffect(() => {
    const currentStudent = activeStudent;
    if (!currentStudent) {
      if (myStudents.length === 0) setLoading(false);
      return;
    }
    const studentId = currentStudent.id;

    async function loadAttendanceData() {
      setLoading(true);
      try {
        const [attList, csList, subList] = await Promise.all([
          dbService.getAttendance(),
          dbService.getClassSubjects(),
          dbService.getSubjects()
        ]);

        setClassSubjects(csList);
        setSubjects(subList);

        // Filter student attendance
        const filtered = attList.filter(a => a.student_id === studentId);
        setAttendance(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAttendanceData();
  }, [activeStudent, myStudents]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Attendance metrics
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const lateDays = attendance.filter(a => a.status === 'late').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Attendance Log</h1>
            <p className="text-sm text-gray-500 mt-1">Review student daily roll check history, punctuality rates, and remarks.</p>
          </div>

          {user?.role === 'parent' && myStudents.length > 1 && (
            <select
              value={activeStudent?.id}
              onChange={e => {
                const match = myStudents.find(s => s.id === e.target.value);
                if (match) {
                  setActiveStudent(match);
                  localStorage.setItem('parent_active_student_id', match.id);
                }
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-bold text-gray-950 shadow-sm"
            >
              {myStudents.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          )}
        </div>

        {attendance.length === 0 ? (
          <div className="bg-white border p-8 rounded-xl text-center text-xs text-gray-500">
            No attendance records found in the database.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Counts widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Days Logged</span>
                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{totalDays}</span>
              </div>
              <div className="bg-white border border-emerald-100 p-5 rounded-xl shadow-xs text-emerald-700">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present Roll Call</span>
                <span className="text-2xl font-extrabold mt-1 block">{presentDays}</span>
              </div>
              <div className="bg-white border border-amber-100 p-5 rounded-xl shadow-xs text-amber-700">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Late roll call</span>
                <span className="text-2xl font-extrabold mt-1 block">{lateDays}</span>
              </div>
              <div className="bg-white border border-red-100 p-5 rounded-xl shadow-xs text-red-700">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Absent Roll Call</span>
                <span className="text-2xl font-extrabold mt-1 block">{absentDays}</span>
              </div>
            </div>

            {/* Attendance Logs Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-150 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Historical Attendance Roll</h3>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                      <th className="p-4">Date</th>
                      <th className="p-4">Subject Course</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Teacher Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {attendance
                      .sort((a,b) => b.date.localeCompare(a.date))
                      .map(log => {
                        const cs = classSubjects.find(x => x.id === log.class_subject_id);
                        const sub = subjects.find(s => s.id === cs?.subject_id);

                        const getStatusBadge = (st: T.Attendance['status']) => {
                          switch (st) {
                            case 'present':
                              return 'bg-emerald-50 text-emerald-800 border-emerald-100';
                            case 'absent':
                              return 'bg-red-50 text-red-800 border-red-100';
                            case 'late':
                              return 'bg-amber-50 text-amber-800 border-amber-100';
                            default:
                              return 'bg-gray-50 text-gray-800 border-gray-100';
                          }
                        };

                        return (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{new Date(log.date).toLocaleDateString()}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-gray-900">{sub ? sub.name : 'Unknown Course'}</span>
                              <span className="text-gray-400 font-semibold ml-2">({sub?.code})</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full border tracking-wide ${getStatusBadge(log.status)}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="p-4 text-gray-500 font-medium italic">{log.remarks || 'No remarks provided.'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
