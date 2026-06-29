'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { BookOpen, UserCheck, FileText, Calendar, Users, Award, Bell } from 'lucide-react';
import Link from 'next/link';

interface ExtendedClassSubject {
  cs: T.ClassSubject;
  cls: T.Class;
  sub: T.Subject;
  studentCount: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [myAllocations, setMyAllocations] = useState<ExtendedClassSubject[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<T.TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [notifs, setNotifs] = useState<T.SchoolNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [csList, clsList, subList, slotsList, studentList, notifList] = await Promise.all([
          dbService.getClassSubjects(),
          dbService.getClasses(),
          dbService.getSubjects(),
          dbService.getTimetableSlots(),
          dbService.getStudents(),
          dbService.getNotifications()
        ]);

        setSubjects(subList);
        setClasses(clsList);
        setNotifs(notifList);

        // Filter allocations assigned to this teacher
        const mine = csList.filter(cs => cs.teacher_id === user.id);
        const extended: ExtendedClassSubject[] = mine.map(cs => {
          const cls = clsList.find(c => c.id === cs.class_id)!;
          const sub = subList.find(s => s.id === cs.subject_id)!;
          const studentCount = studentList.filter(s => s.class_id === cs.class_id).length;
          return { cs, cls, sub, studentCount };
        }).filter(item => item.cls && item.sub); // filter out dangling links

        setMyAllocations(extended);

        // Filter timetable slots for my allocations
        const myAllocationIds = mine.map(m => m.id);
        const mySlots = slotsList.filter(slot => myAllocationIds.includes(slot.class_subject_id));
        setTimetableSlots(mySlots);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Group timetable slots by day
  const days: T.TimetableSlot['day_of_week'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Banner Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Academic Faculty Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Manage roll calls, continuous assessments, report cards, and course hours.</p>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-205 rounded-2xl p-5 shadow-xs flex items-center justify-between premium-card-hover">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Classes</span>
              <h3 className="text-2xl font-extrabold text-gray-900">{myAllocations.length}</h3>
              <p className="text-[10px] text-gray-500 font-semibold">Subjects assigned to teach</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/50 rounded-xl">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-gray-205 rounded-2xl p-5 shadow-xs flex items-center justify-between premium-card-hover">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Weekly Periods</span>
              <h3 className="text-2xl font-extrabold text-gray-900">{timetableSlots.length}</h3>
              <p className="text-[10px] text-gray-500 font-semibold">Taught timetable hours</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/50 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-gray-205 rounded-2xl p-5 shadow-xs flex items-center justify-between premium-card-hover">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Taught Pupils</span>
              <h3 className="text-2xl font-extrabold text-gray-900">
                {myAllocations.reduce((sum, item) => sum + item.studentCount, 0)}
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold">Enrolled classroom students</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-100 text-purple-700 dark:bg-purple-950/25 dark:text-purple-400 dark:border-purple-900/50 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Class List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-150 bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-900 font-sans">My Subjects & Assigned Classrooms</h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myAllocations.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center sm:col-span-2 font-medium">No subjects allocated to you yet.</p>
                ) : (
                  myAllocations.map(({ cs, cls, sub, studentCount }) => (
                    <div key={cs.id} className="p-4 border rounded-2xl bg-gray-50 border-gray-150 flex flex-col justify-between space-y-4 text-xs premium-card-hover">
                      <div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-150 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/40 rounded-md font-extrabold uppercase text-[9px]">
                          {cls.name}
                        </span>
                        <h3 className="text-sm font-extrabold text-gray-900 mt-2 leading-tight font-sans">{sub.name}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Code: {sub.code} | {studentCount} Students</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-gray-200/65 pt-3">
                        <Link 
                          href="/teacher/attendance"
                          className="flex items-center justify-center gap-1.5 py-1.5 bg-white border border-gray-200 hover:bg-emerald-50/55 hover:border-emerald-250 dark:hover:bg-emerald-955/20 dark:hover:border-emerald-900/50 rounded-lg font-bold text-gray-700 text-[11px] transition-colors"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Attendance</span>
                        </Link>
                        <Link 
                          href="/teacher/grades"
                          className="flex items-center justify-center gap-1.5 py-1.5 bg-white border border-gray-200 hover:bg-emerald-50/55 hover:border-emerald-250 dark:hover:bg-emerald-955/20 dark:hover:border-emerald-900/50 rounded-lg font-bold text-gray-700 text-[11px] transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span>Grades CA</span>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Today's Schedule Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-primary" />
                  <h2 className="text-sm font-bold text-gray-900 font-sans">Teacher Schedule</h2>
                </div>
                <Link href="/teacher/timetable" className="text-[11px] font-bold text-primary hover:underline">
                  Full Schedule
                </Link>
              </div>

              <div className="p-5 divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {timetableSlots.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No teaching hours scheduled in the system.</p>
                ) : (
                  timetableSlots.slice(0, 5).map(slot => {
                    const cs = myAllocations.find(a => a.cs.id === slot.class_subject_id);
                    return (
                      <div key={slot.id} className="py-3 first:pt-0 last:pb-0 text-xs">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{slot.day_of_week}</span>
                            <h4 className="font-extrabold text-gray-900 mt-0.5">{cs?.sub.name}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Class: {cs?.cls.name} | Room: {slot.room}</p>
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-emerald-50/25 dark:bg-emerald-950/15 rounded-b-xl flex items-start gap-3">
              <Bell className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed font-semibold">
                Remember: Mark daily attendance prior to the end of lessons. Grades must be entered per child for Continuous Assessment and Examinations.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
