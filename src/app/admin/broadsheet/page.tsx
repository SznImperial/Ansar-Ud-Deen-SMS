'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import * as T from '@/lib/types';
import { Award, Search, Trophy, Filter, X, ArrowUpRight, TrendingUp, TrendingDown, BookOpen, AlertCircle } from 'lucide-react';

interface StudentPerformanceSummary {
  studentId: string;
  studentName: string;
  admissionNo: string;
  subjectScores: Record<string, number>; // classSubjectId -> score
  totalScore: number;
  averageScore: number;
  subjectsCount: number;
  overallRank: number;
}

export default function BroadsheetPage() {
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [students, setStudents] = useState<T.Student[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [grades, setGrades] = useState<T.Grade[]>([]);
  const [profiles, setProfiles] = useState<T.Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [term, setTerm] = useState<'1st Term' | '2nd Term' | '3rd Term'>('1st Term');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [searchQuery, setSearchQuery] = useState('');

  // Detailed Modal
  const [selectedStudentSummary, setSelectedStudentSummary] = useState<StudentPerformanceSummary | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Computed data states
  const [broadsheetRows, setBroadsheetRows] = useState<StudentPerformanceSummary[]>([]);
  const [activeClassSubjects, setActiveClassSubjects] = useState<T.ClassSubject[]>([]);
  const [subjectRanks, setSubjectRanks] = useState<Record<string, Record<string, number>>>({}); // classSubjectId -> studentId -> rank

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsList, stdList, subList, csList, gradeList, profList] = await Promise.all([
        dbService.getClasses(),
        dbService.getStudents(),
        dbService.getSubjects(),
        dbService.getClassSubjects(),
        dbService.getGrades(),
        dbService.getProfiles()
      ]);
      setClasses(clsList);
      setStudents(stdList);
      setSubjects(subList);
      setClassSubjects(csList);
      setGrades(gradeList);
      setProfiles(profList);

      if (clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].id);
      }
    } catch (err) {
      console.error('Failed to load broadsheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Broadsheet Data
  useEffect(() => {
    if (!selectedClassId) return;

    // 1. Get students in selected class
    const classStudents = students.filter(s => s.class_id === selectedClassId);
    
    // 2. Get class subjects for selected class
    const currentClassSubjects = classSubjects.filter(cs => cs.class_id === selectedClassId);
    setActiveClassSubjects(currentClassSubjects);

    // 3. Filter grades for selected class, term, session
    const classStudentIds = new Set(classStudents.map(s => s.id));
    const termGrades = grades.filter(g => 
      g.term === term && 
      g.academic_year === academicYear && 
      classStudentIds.has(g.student_id)
    );

    // 4. Calculate subject ranks
    const ranksBySubject: Record<string, Record<string, number>> = {};
    
    currentClassSubjects.forEach(cs => {
      const subjectGrades = termGrades.filter(g => g.class_subject_id === cs.id);
      // Sort descending by score
      const sorted = [...subjectGrades].sort((a, b) => b.total_score - a.total_score);
      
      const ranks: Record<string, number> = {};
      sorted.forEach((grade, idx) => {
        if (idx > 0 && grade.total_score === sorted[idx - 1].total_score) {
          ranks[grade.student_id] = ranks[sorted[idx - 1].student_id];
        } else {
          ranks[grade.student_id] = idx + 1;
        }
      });
      ranksBySubject[cs.id] = ranks;
    });
    setSubjectRanks(ranksBySubject);

    // 5. Generate Student Summaries
    const summaries: StudentPerformanceSummary[] = classStudents.map(student => {
      const studentGrades = termGrades.filter(g => g.student_id === student.id);
      
      const subjectScores: Record<string, number> = {};
      let total = 0;
      let count = 0;

      studentGrades.forEach(g => {
        subjectScores[g.class_subject_id] = g.total_score;
        total += g.total_score;
        count++;
      });

      const average = count > 0 ? total / count : 0;

      return {
        studentId: student.id,
        studentName: student.full_name,
        admissionNo: student.admission_no,
        subjectScores,
        totalScore: total,
        averageScore: average,
        subjectsCount: count,
        overallRank: 0 // Will assign next
      };
    });

    // 6. Sort and Rank Summaries Overall (by average score descending)
    const sortedSummaries = [...summaries].sort((a, b) => b.averageScore - a.averageScore);
    
    sortedSummaries.forEach((summary, idx) => {
      if (idx > 0 && summary.averageScore === sortedSummaries[idx - 1].averageScore) {
        summary.overallRank = sortedSummaries[idx - 1].overallRank;
      } else {
        summary.overallRank = idx + 1;
      }
    });

    setBroadsheetRows(sortedSummaries);
  }, [selectedClassId, term, academicYear, students, classSubjects, grades]);

  // Handle Search Filtering
  const filteredRows = broadsheetRows.filter(row => 
    row.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute Class Overview Stats
  const activeClass = classes.find(c => c.id === selectedClassId);
  const classAvg = broadsheetRows.length > 0 
    ? broadsheetRows.reduce((sum, r) => sum + r.averageScore, 0) / broadsheetRows.length 
    : 0;
  const topPerformer = broadsheetRows.find(r => r.overallRank === 1);

  // Helper for rank suffix
  const getRankSuffix = (rank: number) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
    if (rank === 2) return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700/50';
    if (rank === 3) return 'bg-orange-100 text-orange-855 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40';
    return 'bg-gray-50 text-gray-500 border-gray-150 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-800';
  };

  // Helper to retrieve strengths/weaknesses for the detail modal
  const getStudentStrengthsAndWeaknesses = (summary: StudentPerformanceSummary) => {
    const list = Object.entries(summary.subjectScores).map(([csId, score]) => {
      const cs = classSubjects.find(x => x.id === csId);
      const sub = subjects.find(s => s.id === cs?.subject_id);
      return {
        subjectName: sub ? sub.name : 'Unknown Subject',
        score
      };
    });

    if (list.length === 0) return { strengths: [], weaknesses: [] };

    // Sort ascending
    const sorted = [...list].sort((a, b) => a.score - b.score);
    const minScore = sorted[0].score;
    const maxScore = sorted[sorted.length - 1].score;

    // Filter strengths and weaknesses (handling ties)
    const strengths = list.filter(item => item.score === maxScore);
    const weaknesses = list.filter(item => item.score === minScore && item.score < 50); // only show weakness if below 50

    return { strengths, weaknesses };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title with Premium Gradient */}
        <div className="relative rounded-2xl bg-gradient-to-r from-emerald-800 via-primary to-emerald-700 text-white p-6 shadow-md overflow-hidden dark:from-emerald-950 dark:via-emerald-900 dark:to-primary/30">
          <div className="absolute right-0 top-0 opacity-10 -translate-y-4 translate-x-4">
            <Award className="h-64 w-64" />
          </div>
          <div className="relative z-10 space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Positional Broadsheet</h1>
            <p className="text-xs md:text-sm text-emerald-100 font-medium max-w-2xl leading-relaxed">
              Analyze class-wide grade reports, rank students by average performance, examine subject specific scores, and pinpoint strengths and weaknesses.
            </p>
          </div>
        </div>

        {/* Filter Toolbar Cards */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center shadow-xs dark:bg-gray-950 dark:border-gray-800 text-xs font-semibold">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Class Selection */}
            <div className="flex flex-col gap-1 sm:w-44">
              <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider">Class Setup</span>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Term Selection */}
            <div className="flex flex-col gap-1 sm:w-36">
              <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider">Session Term</span>
              <select
                value={term}
                onChange={e => setTerm(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
              >
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>

            {/* Session Year */}
            <div className="flex flex-col gap-1 sm:w-32">
              <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider">Academic Session</span>
              <input
                type="text"
                required
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64 mt-2 md:mt-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student by name..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:border-gray-800 dark:text-gray-250"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : broadsheetRows.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 rounded-xl text-center text-xs font-semibold text-gray-500 dark:bg-gray-950 dark:border-gray-800">
            <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            No grading records found for class &quot;{activeClass?.name}&quot; in {term} {academicYear}. Verify grades have been entered by teachers.
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Summaries Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Students */}
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs dark:bg-gray-950 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Class Roster</span>
                  <span className="text-2xl font-extrabold text-gray-900 mt-1 block dark:text-gray-100">{broadsheetRows.length} Students</span>
                </div>
                <div className="p-3 bg-emerald-50 text-primary border border-emerald-100 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-900/40">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              {/* Class Average */}
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs dark:bg-gray-950 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Class Average</span>
                  <span className="text-2xl font-extrabold text-primary mt-1 block">{classAvg.toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg dark:bg-blue-950/20 dark:border-blue-900/40">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>

              {/* Top Performer */}
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs dark:bg-gray-950 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Valedictorian / 1st Position</span>
                  <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate max-w-[180px] dark:text-gray-100">
                    {topPerformer ? topPerformer.studentName : 'N/A'}
                  </span>
                  {topPerformer && (
                    <span className="text-[10px] text-amber-600 font-bold block mt-0.5">Average: {topPerformer.averageScore.toFixed(1)}%</span>
                  )}
                </div>
                <div className="p-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg dark:bg-amber-950/20 dark:border-amber-900/40">
                  <Trophy className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Broadsheet Table Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden dark:bg-gray-950 dark:border-gray-800">
              <div className="p-4 border-b border-gray-150 bg-gray-50/50 dark:bg-gray-900/40 flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300">
                <span>Class Broadsheet Matrix</span>
                <span className="text-[10px] text-gray-400">Click any student row to view analytical report profile</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700 dark:bg-gray-900/20 dark:border-gray-850 dark:text-gray-300">
                      <th className="p-4 w-16">Rank</th>
                      <th className="p-4 min-w-[150px]">Student Name</th>
                      {activeClassSubjects.map(cs => {
                        const sub = subjects.find(s => s.id === cs.subject_id);
                        return (
                          <th key={cs.id} className="p-4 text-center min-w-[110px]" title={sub ? sub.name : ''}>
                            {sub ? sub.name : 'Subject'}
                          </th>
                        );
                      })}
                      <th className="p-4 text-center">Total</th>
                      <th className="p-4 text-center">Average</th>
                      <th className="p-4 text-center">Top Subject</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={5 + activeClassSubjects.length} className="p-8 text-center text-gray-500 font-medium bg-white dark:bg-gray-950">
                          No students matching search query.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map(row => {
                        // Find top subject for this row
                        let topSubName = 'N/A';
                        let topSubScore = 0;
                        Object.entries(row.subjectScores).forEach(([csId, score]) => {
                          if (score > topSubScore) {
                            topSubScore = score;
                            const cs = classSubjects.find(x => x.id === csId);
                            const sub = subjects.find(s => s.id === cs?.subject_id);
                            if (sub) topSubName = sub.name;
                          }
                        });

                        return (
                          <tr 
                            key={row.studentId} 
                            onClick={() => {
                              setSelectedStudentSummary(row);
                              setShowDetailModal(true);
                            }}
                            className="hover:bg-gray-50/75 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                          >
                            <td className="p-4">
                              <span className={`px-2.5 py-1 border rounded-full font-extrabold text-[10px] ${getRankStyle(row.overallRank)}`}>
                                {getRankSuffix(row.overallRank)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-gray-900 dark:text-gray-100">{row.studentName}</div>
                              <div className="text-[10px] text-gray-400 font-mono font-medium mt-0.5">{row.admissionNo}</div>
                            </td>
                            
                            {/* Subject Scores & Ranks */}
                            {activeClassSubjects.map(cs => {
                              const score = row.subjectScores[cs.id];
                              const rank = subjectRanks[cs.id]?.[row.studentId];
                              
                              if (score === undefined) {
                                  return (
                                    <td key={cs.id} className="p-4 text-center text-gray-300 dark:text-gray-700 font-bold">
                                      -
                                    </td>
                                  );
                              }

                              return (
                                <td key={cs.id} className="p-4 text-center">
                                  <div className="font-extrabold text-gray-900 dark:text-gray-100">{score}%</div>
                                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                    {getRankSuffix(rank)}
                                  </div>
                                </td>
                              );
                            })}

                            {/* Total and Average */}
                            <td className="p-4 text-center font-bold text-gray-800 dark:text-gray-250">
                              {row.totalScore}
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-extrabold text-primary dark:text-emerald-450">{row.averageScore.toFixed(1)}%</span>
                            </td>
                            <td className="p-4 text-center">
                              {topSubScore > 0 ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-bold text-[9px] dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 inline-block max-w-[100px] truncate" title={`${topSubName}: ${topSubScore}%`}>
                                  {topSubName} ({topSubScore}%)
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
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
        )}
      </div>

      {/* Student Details Performance Modal */}
      {showDetailModal && selectedStudentSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold dark:bg-gray-950 dark:border-gray-800">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 dark:border-gray-805">
              <div>
                <span className={`px-2 py-0.5 border rounded-full font-bold uppercase tracking-wide text-[9px] ${getRankStyle(selectedStudentSummary.overallRank)}`}>
                  Overall: {getRankSuffix(selectedStudentSummary.overallRank)} Rank
                </span>
                <h2 className="text-base font-extrabold text-gray-900 mt-1 dark:text-gray-100">{selectedStudentSummary.studentName}</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Admission: {selectedStudentSummary.admissionNo}</p>
              </div>
              <button 
                onClick={() => { setShowDetailModal(false); setSelectedStudentSummary(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto pr-2">
              {/* Profile Analytical Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl dark:bg-gray-900/30 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Average score</span>
                  <span className="text-xl font-extrabold text-primary block mt-1">{selectedStudentSummary.averageScore.toFixed(1)}%</span>
                </div>
                <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl dark:bg-gray-900/30 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Subjects</span>
                  <span className="text-xl font-extrabold text-gray-900 block mt-1 dark:text-gray-100">{selectedStudentSummary.subjectsCount} Offered</span>
                </div>
              </div>

              {/* Strengths and Weaknesses Analyzers */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 pb-1.5 dark:border-gray-850">
                  <span>Performance Analysis Overview</span>
                </h3>
                
                {/* Strengths */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase text-emerald-700 font-extrabold tracking-wider flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Academic Strengths (Top Score)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {getStudentStrengthsAndWeaknesses(selectedStudentSummary).strengths.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-lg dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40">
                        <span>{item.subjectName}</span>
                        <span className="font-extrabold">{item.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weaknesses (Below 50%) */}
                {getStudentStrengthsAndWeaknesses(selectedStudentSummary).weaknesses.length > 0 && (
                  <div className="space-y-2 pt-1.5">
                    <div className="text-[10px] uppercase text-red-700 font-extrabold tracking-wider flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5" />
                      <span>Areas for Improvement (Score &lt; 50%)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {getStudentStrengthsAndWeaknesses(selectedStudentSummary).weaknesses.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-red-50 text-red-950 border border-red-100 rounded-lg dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40">
                          <span>{item.subjectName}</span>
                          <span className="font-extrabold">{item.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Individual subject-wise performance breakdown */}
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 pb-1.5 dark:border-gray-850">
                  <span>Subject-wise Breakdown</span>
                </h3>
                
                <div className="border border-gray-150 rounded-xl overflow-hidden dark:border-gray-850">
                  <table className="w-full text-left border-collapse text-[11px] font-semibold bg-white dark:bg-gray-950">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold dark:bg-gray-900/40 dark:border-gray-800">
                        <th className="p-3">Subject</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-center">Class Rank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                      {Object.entries(selectedStudentSummary.subjectScores).map(([csId, score]) => {
                        const cs = classSubjects.find(x => x.id === csId);
                        const sub = subjects.find(s => s.id === cs?.subject_id);
                        const rank = subjectRanks[csId]?.[selectedStudentSummary.studentId];

                        return (
                          <tr key={csId} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/20">
                            <td className="p-3 font-bold text-gray-900 dark:text-gray-250">
                              {sub ? sub.name : 'Unknown Subject'}
                            </td>
                            <td className="p-3 text-center font-extrabold text-gray-800 dark:text-gray-100">
                              {score}%
                            </td>
                            <td className="p-3 text-center font-extrabold text-primary dark:text-emerald-450">
                              {getRankSuffix(rank || 1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-150 bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedStudentSummary(null); }}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
