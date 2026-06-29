'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import Link from 'next/link';
import { ClipboardList, Clock, HelpCircle, AlertCircle, Play, CheckCircle2, Award, ArrowRight, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function StudentCBTPage() {
  const { user } = useAuth();
  const [myStudents, setMyStudents] = useState<T.Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<T.Student | null>(null);

  const [exams, setExams] = useState<T.CBTExam[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [submissions, setSubmissions] = useState<T.CBTSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Parent child rosters
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

  // Load exams and performance data for selected student
  useEffect(() => {
    const currentStudent = activeStudent;
    if (!currentStudent) {
      if (myStudents.length === 0) setLoading(false);
      return;
    }

    async function loadExamsData(studentObj: T.Student) {
      setLoading(true);
      try {
        const [examsList, csList, subList, submsList] = await Promise.all([
          dbService.getCbtExams(),
          dbService.getClassSubjects(),
          dbService.getSubjects(),
          dbService.getCbtSubmissions()
        ]);

        // Filter class subjects mapped to student's class
        const clsCs = csList.filter(cs => cs.class_id === studentObj.class_id);
        setClassSubjects(clsCs);

        const clsCsIds = new Set(clsCs.map(cs => cs.id));
        // Only show approved exams for student's class subjects
        setExams(examsList.filter(e => e.status === 'approved' && clsCsIds.has(e.class_subject_id)));
        setSubjects(subList);
        
        // Only load submissions matching this student
        setSubmissions(submsList.filter(s => s.student_id === studentObj.id));
      } catch (err) {
        console.error('Failed to load CBT data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadExamsData(currentStudent);
  }, [activeStudent, myStudents]);

  const getSubjectName = (csId: string) => {
    const cs = classSubjects.find(x => x.id === csId);
    const sub = subjects.find(s => s.id === cs?.subject_id);
    return sub ? sub.name : 'Unknown Subject';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title & Child Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Online Exams & Testing Center</h1>
            <p className="text-sm text-gray-500 mt-1">Review active CBT exams, view instructions, and inspect released results.</p>
          </div>

          {/* Child Switcher for Parents */}
          {user?.role === 'parent' && myStudents.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Select Child:</span>
              <select
                value={activeStudent?.id}
                onChange={e => {
                  const match = myStudents.find(s => s.id === e.target.value);
                  if (match) {
                    setActiveStudent(match);
                    localStorage.setItem('parent_active_student_id', match.id);
                  }
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

        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activeStudent === null ? (
          <div className="bg-white border border-gray-200 p-12 rounded-xl text-center text-xs text-gray-500">
            <AlertCircle className="h-8 w-8 text-gray-350 mx-auto mb-3" />
            No student profile found connected to this account.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header statistics block */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="p-3 bg-emerald-50 text-primary border border-emerald-100 rounded-xl shrink-0">
                  <ClipboardList className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Currently Selected Student</p>
                  <h3 className="text-base font-extrabold text-gray-900 leading-none">{activeStudent.full_name}</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Admission: {activeStudent.admission_no}</p>
                </div>
              </div>
            </div>

            {/* Exams Roster */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.length === 0 ? (
                <div className="col-span-full bg-white border border-gray-200 p-12 rounded-xl text-center text-xs text-gray-500">
                  <HelpCircle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  No active CBT online exams are currently scheduled for your class. Check back later!
                </div>
              ) : (
                exams.map(exam => {
                  const submission = submissions.find(s => s.exam_id === exam.id);
                  const isTaken = submission !== undefined;

                  return (
                    <div key={exam.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {exam.duration_minutes} Mins
                          </span>
                          
                          {/* Status Badge */}
                          {isTaken ? (
                            submission.status === 'released' ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Score: {submission.score}/{submission.total_questions}
                              </span>
                            ) : submission.status === 'withheld' ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Withheld
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-850 border border-amber-100 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Submitted
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-100 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                              Unattempted
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-extrabold text-gray-900 leading-snug">{exam.title}</h3>
                        <p className="text-[10px] text-gray-500 font-extrabold tracking-wide uppercase">{getSubjectName(exam.class_subject_id)}</p>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-semibold">
                        {isTaken ? (
                          submission.status === 'released' ? (
                            <div className="text-[10px] text-emerald-800 font-extrabold flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              Grade Released ({((submission.score / submission.total_questions) * 100).toFixed(0)}%)
                            </div>
                          ) : submission.status === 'withheld' ? (
                            <div className="text-[10px] text-rose-700 font-extrabold flex items-center gap-1">
                              <ShieldAlert className="h-4 w-4" />
                              Result Withheld
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-700 font-extrabold">
                              Awaiting Result Audit
                            </div>
                          )
                        ) : (
                          user?.role === 'student' ? (
                            <Link
                              href={`/student/cbt/take?exam_id=${exam.id}`}
                              className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                              Start Exam
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic font-medium">Student attempt required</span>
                          )
                        )}
                        <span className="text-[9px] text-gray-450 font-medium">Academic Year: 2025/2026</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
