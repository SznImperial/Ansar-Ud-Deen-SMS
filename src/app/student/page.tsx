'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { GraduationCap, Calendar, CreditCard, Bell, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  // Student selection (for parent multiple children support)
  const [myStudents, setMyStudents] = useState<T.Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<T.Student | null>(null);
  
  const [activeClass, setActiveClass] = useState<T.Class | null>(null);
  const [grades, setGrades] = useState<T.Grade[]>([]);
  const [attendance, setAttendance] = useState<T.Attendance[]>([]);
  const [fees, setFees] = useState<T.FeeRecord[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [notifs, setNotifs] = useState<T.SchoolNotification[]>([]);
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
          setActiveStudent(mine[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadIdentity();
  }, [user]);

  // Load selected student records
  useEffect(() => {
    const currentStudent = activeStudent;
    if (!currentStudent) {
      if (myStudents.length === 0) setLoading(false);
      return;
    }
    const studentId = currentStudent.id;
    const classId = currentStudent.class_id;

    async function loadStudentData() {
      setLoading(true);
      try {
        const [clsList, gradeList, attList, feeList, csList, subList, notifList] = await Promise.all([
          dbService.getClasses(),
          dbService.getGrades(),
          dbService.getAttendance(),
          dbService.getFees(),
          dbService.getClassSubjects(),
          dbService.getSubjects(),
          dbService.getNotifications()
        ]);

        // Find class
        const cls = clsList.find(c => c.id === classId);
        if (cls) setActiveClass(cls);

        // Filter grades
        const stdGrades = gradeList.filter(g => g.student_id === studentId);
        setGrades(stdGrades);

        // Filter attendance
        const stdAtt = attList.filter(a => a.student_id === studentId);
        setAttendance(stdAtt);

        // Filter fees
        const stdFees = feeList.filter(f => f.student_id === studentId);
        setFees(stdFees);

        setClassSubjects(csList);
        setSubjects(subList);

        // Filter notifications for school or class target
        const filteredNotifs = notifList.filter(n => 
          n.audience_type === 'all' || 
          (n.audience_type === 'class' && n.audience_id === classId) ||
          (n.audience_type === 'student' && n.audience_id === studentId)
        );
        setNotifs(filteredNotifs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
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

  if (myStudents.length === 0) {
    return (
      <DashboardLayout>
        <div className="bg-white border p-8 rounded-xl text-center text-xs text-gray-500">
          No student record is linked to your portal account. Please contact the administration office.
        </div>
      </DashboardLayout>
    );
  }

  // Attendance stats
  const totalAttDays = attendance.length;
  const presentAttDays = attendance.filter(a => a.status === 'present').length;
  const lateAttDays = attendance.filter(a => a.status === 'late').length;
  const attRate = totalAttDays > 0 ? ((presentAttDays + lateAttDays) / totalAttDays) * 100 : 100;

  // Fee totals
  const totalOwed = fees.reduce((sum, f) => sum + Number(f.amount_owed), 0);
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.amount_paid), 0);
  const feeBalance = totalOwed - totalPaid;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Banner Title & Child Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {user?.role === 'parent' ? "Parent Portal Dashboard" : "Student Portal Dashboard"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Access report cards, timetables, notifications, and ledger receipts.
            </p>
          </div>

          {/* Child Switcher for Parents */}
          {user?.role === 'parent' && myStudents.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Select Child:</span>
              <select
                value={activeStudent?.id}
                onChange={e => {
                  const match = myStudents.find(s => s.id === e.target.value);
                  if (match) setActiveStudent(match);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-bold text-gray-900 shadow-sm cursor-pointer"
              >
                {myStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Student card block */}
        {activeStudent && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl shrink-0">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-gray-950 leading-tight">{activeStudent.full_name}</h2>
                <p className="text-gray-500 font-bold uppercase">Class Room: {activeClass?.name || 'Loading...'}</p>
                <p className="text-[10px] text-gray-400 font-bold">Admission Number: {activeStudent.admission_no}</p>
              </div>
            </div>
            
            {user?.role === 'parent' && (
              <div className="text-[11px] bg-amber-50 text-amber-800 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50 p-3 rounded-lg font-medium leading-normal max-w-sm">
                <span className="font-bold">Parent Access:</span> Logged in as <span className="font-bold">{user.full_name}</span>. Viewing academic reports.
              </div>
            )}
          </div>
        )}

        {/* Quick summaries widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attendance Widget */}
          <Link href="/student/attendance" className="bg-white border rounded-xl p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</span>
              <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{attRate.toFixed(0)}%</h3>
              <p className="text-[10px] text-gray-500 font-semibold">{presentAttDays} present of {totalAttDays} classes</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/50 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
          </Link>

          {/* Fees Widget */}
          <Link href="/student/fees" className="bg-white border rounded-xl p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tuition Balance</span>
              <h3 className={`text-2xl font-extrabold ${feeBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                ₦{feeBalance.toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold">Total Owed: ₦{totalOwed.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-xl border ${feeBalance > 0 ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/50'}`}>
              <CreditCard className="h-5 w-5" />
            </div>
          </Link>

          {/* Grades Widget */}
          <Link href="/student/grades" className="bg-white border rounded-xl p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Report Cards</span>
              <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
                {grades.length} Grades
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold">Grades recorded for current term</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/50 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
          </Link>
        </div>

        {/* Notice Board Preview */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-primary animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900">Notice Board Bulletins</h2>
            </div>
            <Link href="/student/notifications" className="text-[11px] font-bold text-primary hover:underline">
              View Notice Board
            </Link>
          </div>

          <div className="p-5 divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No active bulletins published on notice board.</p>
            ) : (
              notifs.slice(0, 3).map(notif => (
                <div key={notif.id} className="py-4 first:pt-0 last:pb-0 text-xs">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-extrabold text-gray-950">{notif.title}</h4>
                      <p className="text-gray-600 mt-1 leading-relaxed font-medium">{notif.content}</p>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 shrink-0 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-150">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
