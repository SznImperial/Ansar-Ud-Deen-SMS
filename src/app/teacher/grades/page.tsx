'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { FileText, Save, CheckCircle, Award } from 'lucide-react';

interface GradeRowState {
  studentId: string;
  caScore: string;
  examScore: string;
  isSaving: boolean;
  isSaved: boolean;
}

export default function GradeEntryPage() {
  const { user } = useAuth();
  const [myAllocations, setMyAllocations] = useState<{ id: string; className: string; subjectName: string }[]>([]);
  const [students, setStudents] = useState<T.Student[]>([]);
  const [selectedCsId, setSelectedCsId] = useState('');
  const [term, setTerm] = useState<T.Grade['term']>('1st Term');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [gradeRows, setGradeRows] = useState<GradeRowState[]>([]);
  const [loading, setLoading] = useState(true);

  // Load teacher allocations
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
            className: cls ? cls.name : 'Unknown Class',
            subjectName: sub ? `${sub.name} (${sub.code})` : 'Unknown Subject',
            classId: cs.class_id
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

  // Load students & existing grades when Class-Subject, Term, or Year changes
  useEffect(() => {
    if (!selectedCsId) return;

    async function loadGradeData() {
      try {
        const cs = await dbService.getClassSubjects();
        const selectedCS = cs.find(x => x.id === selectedCsId);
        if (!selectedCS) return;

        // Fetch students enrolled for this class subject
        const classStudents = await dbService.getStudentsForClassSubject(selectedCsId);
        setStudents(classStudents);

        // Load existing grades
        const gradesList = await dbService.getGrades();
        const activeGrades = gradesList.filter(g => 
          g.class_subject_id === selectedCsId && 
          g.term === term && 
          g.academic_year === academicYear
        );

        // Map to state rows
        const rows = classStudents.map(student => {
          const grade = activeGrades.find(g => g.student_id === student.id);
          return {
            studentId: student.id,
            caScore: grade ? grade.ca_score.toString() : '0',
            examScore: grade ? grade.exam_score.toString() : '0',
            isSaving: false,
            isSaved: !!grade
          };
        });
        setGradeRows(rows);
      } catch (err) {
        console.error(err);
      }
    }
    loadGradeData();
  }, [selectedCsId, term, academicYear]);

  const handleScoreChange = (studentId: string, field: 'caScore' | 'examScore', val: string) => {
    const numVal = parseInt(val) || 0;
    const max = field === 'caScore' ? 40 : 60;
    
    // Constraint check
    if (numVal < 0 || numVal > max) return;

    setGradeRows(prev => prev.map(r => r.studentId === studentId ? { ...r, [field]: val, isSaved: false } : r));
  };

  const handleSaveRow = async (studentId: string) => {
    const row = gradeRows.find(r => r.studentId === studentId);
    if (!row) return;

    const ca = Number(row.caScore) || 0;
    const exam = Number(row.examScore) || 0;

    // Trigger row spinner
    setGradeRows(prev => prev.map(r => r.studentId === studentId ? { ...r, isSaving: true } : r));

    try {
      await dbService.saveGrade({
        student_id: studentId,
        class_subject_id: selectedCsId,
        term,
        academic_year: academicYear,
        ca_score: ca,
        exam_score: exam
      });

      // Update state
      setGradeRows(prev => prev.map(r => r.studentId === studentId ? { ...r, isSaving: false, isSaved: true } : r));
    } catch (e) {
      console.error(e);
      setGradeRows(prev => prev.map(r => r.studentId === studentId ? { ...r, isSaving: false } : r));
    }
  };

  // Helper to calculate total and grade letter on frontend
  const calculateTotalAndGrade = (caStr: string, examStr: string) => {
    const ca = Number(caStr) || 0;
    const exam = Number(examStr) || 0;
    const total = ca + exam;

    let letter = 'F';
    if (total >= 70) letter = 'A';
    else if (total >= 60) letter = 'B';
    else if (total >= 50) letter = 'C';
    else if (total >= 45) letter = 'D';
    else if (total >= 40) letter = 'E';

    const color = letter === 'F' ? 'text-red-600' : 'text-emerald-700 font-bold';

    return { total, letter, color };
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Grade Book Entry</h1>
          <p className="text-sm text-gray-500 mt-1">Select class subject, set term session, and record student Continuous Assessments (max 40) and Exam scores (max 60).</p>
        </div>

        {myAllocations.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 rounded-xl text-center text-xs text-gray-500">
            You are not allocated to teach any classes. Please contact administration.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-white border border-gray-200 p-5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 shadow-xs text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Classroom & Subject</label>
                <select
                  value={selectedCsId}
                  onChange={e => setSelectedCsId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {myAllocations.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.className} — {item.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Term Session</label>
                <select
                  value={term}
                  onChange={e => setTerm(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Academic Session</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-1.8 border border-gray-300 rounded-lg bg-white font-bold focus:outline-none focus:ring-1 focus:ring-primary text-gray-700"
                />
              </div>
            </div>

            {/* Grades Ledger Sheet */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                      <th className="p-4 w-40">Admission No</th>
                      <th className="p-4">Student</th>
                      <th className="p-4 w-32">CA Score (Max 40)</th>
                      <th className="p-4 w-32">Exam Score (Max 60)</th>
                      <th className="p-4 w-28">Total (100)</th>
                      <th className="p-4 w-24">Grade</th>
                      <th className="p-4 text-right w-28">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">No students registered in this class.</td>
                      </tr>
                    ) : (
                      gradeRows.map(row => {
                        const student = students.find(s => s.id === row.studentId)!;
                        if (!student) return null;
                        const { total, letter, color } = calculateTotalAndGrade(row.caScore, row.examScore);

                        return (
                          <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-gray-900">{student.admission_no}</td>
                            <td className="p-4 font-bold text-gray-900">{student.full_name}</td>
                            <td className="p-4">
                              <input
                                type="number"
                                required
                                max={40}
                                min={0}
                                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                                value={row.caScore}
                                onChange={e => handleScoreChange(student.id, 'caScore', e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                required
                                max={60}
                                min={0}
                                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                                value={row.examScore}
                                onChange={e => handleScoreChange(student.id, 'examScore', e.target.value)}
                              />
                            </td>
                            <td className="p-4 font-extrabold text-sm text-gray-900">{total}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 text-[11px] font-extrabold uppercase border rounded-full ${color}`}>
                                {letter}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleSaveRow(student.id)}
                                disabled={row.isSaving}
                                className={`px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 w-full cursor-pointer border transition-colors ${
                                  row.isSaved 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-150 hover:bg-emerald-100' 
                                    : 'bg-primary hover:bg-primary-dark text-white border-transparent'
                                }`}
                              >
                                {row.isSaving ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-b-transparent rounded-full animate-spin"></span>
                                ) : row.isSaved ? (
                                  <>
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Saved</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-3.5 w-3.5" />
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
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
                  <div className="p-8 text-center text-gray-500 bg-white border rounded-2xl">No students registered in this class.</div>
                ) : (
                  gradeRows.map(row => {
                    const student = students.find(s => s.id === row.studentId)!;
                    if (!student) return null;
                    const { total, letter, color } = calculateTotalAndGrade(row.caScore, row.examScore);

                    return (
                      <div key={student.id} className="bg-white border border-gray-250 rounded-2xl p-4 space-y-3.5 shadow-xs premium-card-hover">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-gray-955 text-xs leading-tight font-sans">{student.full_name}</h4>
                            <p className="text-[9px] text-gray-400 font-mono mt-0.5">Admission: {student.admission_no}</p>
                          </div>
                        </div>

                        {/* Dual Score Inputs */}
                        <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-gray-505">
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-400 font-bold block">CA Score (Max 40)</label>
                            <input
                              type="number"
                              required
                              max={40}
                              min={0}
                              className="w-full px-3 py-1.8 border border-gray-300 rounded-lg text-center font-extrabold focus:outline-none focus:ring-1 focus:ring-primary text-gray-905 bg-white"
                              value={row.caScore}
                              onChange={e => handleScoreChange(student.id, 'caScore', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-400 font-bold block">Exam Score (Max 60)</label>
                            <input
                              type="number"
                              required
                              max={60}
                              min={0}
                              className="w-full px-3 py-1.8 border border-gray-300 rounded-lg text-center font-extrabold focus:outline-none focus:ring-1 focus:ring-primary text-gray-905 bg-white"
                              value={row.examScore}
                              onChange={e => handleScoreChange(student.id, 'examScore', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Auto-calculate Row */}
                        <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-[10px] font-bold">
                          <div className="flex items-center gap-1 text-gray-500">
                            <span>Calculated Total:</span>
                            <span className="text-gray-900 font-extrabold text-xs">{total} / 100</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <span>Grade Letter:</span>
                            <span className={`px-2 py-0.5 border rounded-md font-extrabold text-[9px] ${color}`}>{letter}</span>
                          </div>
                        </div>

                        {/* Save button block */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(student.id)}
                            disabled={row.isSaving}
                            className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer border text-xs transition-colors ${
                              row.isSaved 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-150 hover:bg-emerald-100' 
                                : 'bg-primary hover:bg-primary-dark text-white border-transparent'
                            }`}
                          >
                            {row.isSaving ? (
                              <span className="w-4 h-4 border-2 border-white border-b-transparent rounded-full animate-spin"></span>
                            ) : row.isSaved ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <span>Grade Saved Successfully</span>
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                <span>Save Student Grade</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
