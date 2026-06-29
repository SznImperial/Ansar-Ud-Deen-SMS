'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { FileText, Printer, Award } from 'lucide-react';

export default function StudentGradesPage() {
  const { user } = useAuth();
  
  // Child switcher context (for parents)
  const [myStudents, setMyStudents] = useState<T.Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<T.Student | null>(null);

  const [grades, setGrades] = useState<T.Grade[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [term, setTerm] = useState<'1st Term' | '2nd Term' | '3rd Term'>('1st Term');
  const [academicYear, setAcademicYear] = useState('2025/2026');
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

    async function loadGradesData() {
      setLoading(true);
      try {
        const [gradesList, csList, subList] = await Promise.all([
          dbService.getGrades(),
          dbService.getClassSubjects(),
          dbService.getSubjects()
        ]);

        setClassSubjects(csList);
        setSubjects(subList);

        // Filter student's grades for selected term/session
        const filtered = gradesList.filter(g => 
          g.student_id === studentId && 
          g.term === term && 
          g.academic_year === academicYear
        );
        setGrades(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGradesData();
  }, [activeStudent, term, academicYear, myStudents]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate stats
  const totalSubjects = grades.length;
  const totalScoreSum = grades.reduce((sum, g) => sum + Number(g.total_score), 0);
  const averageScore = totalSubjects > 0 ? totalScoreSum / totalSubjects : 0;

  const getEvaluation = (avg: number) => {
    if (avg >= 70) return { label: 'Excellent Performance', style: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
    if (avg >= 60) return { label: 'Very Good Performance', style: 'text-blue-700 bg-blue-50 border-blue-100' };
    if (avg >= 50) return { label: 'Satisfactory Performance', style: 'text-amber-700 bg-amber-50 border-amber-100' };
    return { label: 'Needs Improvement', style: 'text-red-700 bg-red-50 border-red-100' };
  };

  const evalBadge = getEvaluation(averageScore);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Title and switch controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Report Card Result Sheet</h1>
            <p className="text-sm text-gray-500 mt-1">Review academic transcripts, term grades, and teacher reviews.</p>
          </div>
          
          <div className="flex items-center gap-3">
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
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-bold text-gray-950"
              >
                {myStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            )}
            <button 
              onClick={() => window.print()}
              className="px-3.5 py-1.8 border border-gray-200 hover:bg-gray-50 bg-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Print Results</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row gap-4 shadow-xs text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Term:</span>
            <select
              value={term}
              onChange={e => setTerm(e.target.value as any)}
              className="px-3 py-1.5 border rounded-lg bg-white font-bold text-gray-900"
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Session:</span>
            <input
              type="text"
              required
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-white font-bold text-gray-700 w-32"
            />
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="bg-white border p-8 rounded-xl text-center text-xs text-gray-500">
            No grading records published for {term} {academicYear}.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Performance card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Subjects Taken</span>
                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{totalSubjects}</span>
              </div>
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Term Average</span>
                <span className="text-2xl font-extrabold text-primary mt-1 block">{averageScore.toFixed(1)}%</span>
              </div>
              <div className={`border p-5 rounded-xl shadow-xs flex flex-col justify-center ${evalBadge.style}`}>
                <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider block">Academic Evaluation</span>
                <span className="text-sm font-extrabold mt-1 block uppercase tracking-wide">{evalBadge.label}</span>
              </div>
            </div>

            {/* Results sheet */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-150 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 font-sans">Term Academic Transcript</h3>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                      <th className="p-4">Subject Name</th>
                      <th className="p-4">Subject Code</th>
                      <th className="p-4">Continuous Assessment (40)</th>
                      <th className="p-4">Final Examination (60)</th>
                      <th className="p-4">Total Score (100)</th>
                      <th className="p-4">Grade Letter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {grades.map(grade => {
                      const cs = classSubjects.find(x => x.id === grade.class_subject_id);
                      const sub = subjects.find(s => s.id === cs?.subject_id);

                      const getGradeColor = (g: string) => {
                        if (g === 'A') return 'text-emerald-700 bg-emerald-50 border border-emerald-100';
                        if (['B', 'C'].includes(g)) return 'text-blue-700 bg-blue-50 border border-blue-100';
                        if (['D', 'E'].includes(g)) return 'text-amber-700 bg-amber-50 border border-amber-100';
                        return 'text-red-700 bg-red-50 border border-red-100';
                      };

                      return (
                        <tr key={grade.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{sub ? sub.name : 'Unknown Subject'}</td>
                          <td className="p-4 font-bold text-gray-500">{sub ? sub.code : 'N/A'}</td>
                          <td className="p-4 font-bold">{grade.ca_score}</td>
                          <td className="p-4 font-bold">{grade.exam_score}</td>
                          <td className="p-4 font-extrabold text-sm text-gray-900">{grade.total_score}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-[11px] font-extrabold border rounded-full ${getGradeColor(grade.grade)}`}>
                              {grade.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden block space-y-4 p-4">
                {grades.map(grade => {
                  const cs = classSubjects.find(x => x.id === grade.class_subject_id);
                  const sub = subjects.find(s => s.id === cs?.subject_id);

                  const getGradeColor = (g: string) => {
                    if (g === 'A') return 'text-emerald-700 bg-emerald-50 border border-emerald-100';
                    if (['B', 'C'].includes(g)) return 'text-blue-700 bg-blue-50 border border-blue-100';
                    if (['D', 'E'].includes(g)) return 'text-amber-700 bg-amber-50 border border-amber-100';
                    return 'text-red-700 bg-red-50 border border-red-100';
                  };

                  return (
                    <div key={grade.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3.5 shadow-xs premium-card-hover">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-gray-900 text-xs leading-tight font-sans">{sub ? sub.name : 'Unknown Subject'}</h4>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5">Code: {sub ? sub.code : 'N/A'}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold border rounded-lg ${getGradeColor(grade.grade)}`}>
                          Grade: {grade.grade}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-150 text-[10px] font-bold text-gray-500">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-gray-450 uppercase tracking-wider block">Continuous Assessment</span>
                          <span className="font-extrabold text-gray-800">{grade.ca_score} / 40</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-gray-450 uppercase tracking-wider block">Final Examination</span>
                          <span className="font-extrabold text-gray-800">{grade.exam_score} / 60</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-gray-100 text-[11px]">
                        <span className="text-gray-450 font-bold">Total Term Score:</span>
                        <span className="text-xs font-extrabold text-primary">{grade.total_score} / 100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
