'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { BookOpen, Plus, Calendar, FileText, CheckCircle, Clock, Trash2, X, ClipboardList, Award } from 'lucide-react';

interface ExtendedAssignment extends T.Assignment {
  submissionCount: number;
}

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();
  
  // Data States
  const [allocations, setAllocations] = useState<{ id: string; className: string; subjectName: string; classId: string }[]>([]);
  const [selectedCsId, setSelectedCsId] = useState('');
  const [assignments, setAssignments] = useState<ExtendedAssignment[]>([]);
  const [students, setStudents] = useState<T.Student[]>([]);
  const [submissions, setSubmissions] = useState<T.Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<T.Assignment | null>(null);

  // Form States - Create Assignment
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Form States - Grading
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState('A');
  const [feedbackText, setFeedbackText] = useState('');
  const [grading, setGrading] = useState(false);

  // Load teacher allocations and students
  useEffect(() => {
    async function loadInitialData() {
      if (!user) return;
      try {
        const [csList, clsList, subList, stdList] = await Promise.all([
          dbService.getClassSubjects(),
          dbService.getClasses(),
          dbService.getSubjects(),
          dbService.getStudents()
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

        setAllocations(mapped);
        setStudents(stdList);

        if (mapped.length > 0) {
          setSelectedCsId(mapped[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [user]);

  // Load assignments when Class-Subject changes
  const loadAssignments = async () => {
    if (!selectedCsId) return;
    try {
      const allAssignments = await dbService.getAssignments({ classSubjectId: selectedCsId });
      const extended: ExtendedAssignment[] = await Promise.all(
        allAssignments.map(async (a) => {
          const subs = await dbService.getSubmissions(a.id);
          return {
            ...a,
            submissionCount: subs.length
          };
        })
      );
      setAssignments(extended);
    } catch (err) {
      console.error(err);
    }
  };

  const [activeClassStudents, setActiveClassStudents] = useState<T.Student[]>([]);

  useEffect(() => {
    loadAssignments();
    async function loadClassStudents() {
      if (!selectedCsId) return;
      try {
        const enrolled = await dbService.getStudentsForClassSubject(selectedCsId);
        setActiveClassStudents(enrolled);
      } catch (err) {
        console.error(err);
      }
    }
    loadClassStudents();
  }, [selectedCsId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDueDate || !selectedCsId) return;

    setCreating(true);
    try {
      await dbService.addAssignment({
        class_subject_id: selectedCsId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        due_date: new Date(newDueDate).toISOString()
      });

      // Reset Form & Close Modal
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setCreateModalOpen(false);
      
      // Reload assignments
      await loadAssignments();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment and all its submissions?')) return;
    try {
      await dbService.deleteAssignment(id);
      await loadAssignments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSubmissions = async (assignment: T.Assignment) => {
    setActiveAssignment(assignment);
    setSubmissionsModalOpen(true);
    setGradingSubmissionId(null);
    setFeedbackText('');
    setGradeValue('A');
    try {
      const subs = await dbService.getSubmissions(assignment.id);
      setSubmissions(subs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;

    setGrading(true);
    try {
      await dbService.gradeSubmission(gradingSubmissionId, gradeValue, feedbackText.trim());
      
      // Refresh submissions
      if (activeAssignment) {
        const subs = await dbService.getSubmissions(activeAssignment.id);
        setSubmissions(subs);
        loadAssignments(); // update count
      }
      setGradingSubmissionId(null);
      setFeedbackText('');
      setGradeValue('A');
    } catch (err) {
      console.error(err);
    } finally {
      setGrading(false);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Assignments Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Post assignments, track student uploads, and grade submitted materials.</p>
          </div>
          {allocations.length > 0 && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-md hover:bg-primary/95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center gap-4">
          <div className="flex flex-col gap-1 w-full max-w-md">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Class Subject</span>
            {allocations.length === 0 ? (
              <p className="text-xs text-red-500 font-bold">You are not assigned to teach any class subjects.</p>
            ) : (
              <select
                value={selectedCsId}
                onChange={e => setSelectedCsId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-bold text-gray-900 shadow-sm cursor-pointer"
              >
                {allocations.map(a => (
                  <option key={a.id} value={a.id}>{a.className} — {a.subjectName}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-150 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900">Active Assignments</h2>
          </div>
          
          <div className="p-5 divide-y divide-gray-150">
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-10 w-10 text-gray-350 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-bold">No assignments posted yet for this class subject.</p>
              </div>
            ) : (
              assignments.map((assignment) => {
                const isOverdue = new Date(assignment.due_date) < new Date();
                return (
                  <div key={assignment.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                    <div className="space-y-1.5 max-w-2xl">
                      <h3 className="text-sm font-extrabold text-gray-900">{assignment.title}</h3>
                      <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-line">{assignment.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                          <Calendar className="h-3.5 w-3.5" />
                          Posted: {new Date(assignment.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          Due: {new Date(assignment.due_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} {isOverdue && '(Overdue)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleOpenSubmissions(assignment)}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>Submissions ({assignment.submissionCount} / {activeClassStudents.length})</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/25 dark:hover:bg-red-950/50 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-950 rounded-lg font-bold transition-all cursor-pointer"
                        title="Delete Assignment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MODAL: Create Assignment */}
        {createModalOpen && (
          <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-150 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-155">
              <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
                <h3 className="font-extrabold text-sm text-gray-900">Publish New Assignment</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="p-6 space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Assignment Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Quadratic Equations Problems"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Instructions / Guidelines</label>
                  <textarea
                    required
                    rows={4}
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Provide specific questions, reading reference page numbers, or submission criteria..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none resize-none font-medium leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary/95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? 'Publishing...' : 'Publish Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Submissions Viewer & Grading */}
        {submissionsModalOpen && activeAssignment && (
          <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl w-full max-w-4xl border border-gray-150 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-155 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50 shrink-0">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Submissions: {activeAssignment.title}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase">
                    Class Size: {activeClassStudents.length} Students | Submissions: {submissions.length}
                  </p>
                </div>
                <button onClick={() => setSubmissionsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Roster & Grade panel split */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
                {/* Student Roster List */}
                <div className="w-full md:w-3/5 border-r border-gray-150 overflow-y-auto p-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Class Roster & Submissions</h4>
                  
                  {activeClassStudents.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">No students registered in this class.</p>
                  ) : (
                    activeClassStudents.map(student => {
                      const submission = submissions.find(s => s.student_id === student.id);
                      return (
                        <div 
                          key={student.id} 
                          className={`p-4 border rounded-xl transition-all ${
                            gradingSubmissionId && submission?.id === gradingSubmissionId
                              ? 'bg-primary/5 border-primary/45 shadow-xs ring-1 ring-primary/25'
                              : submission 
                                ? 'bg-white border-gray-200' 
                                : 'bg-gray-50/50 border-gray-150'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="text-xs font-bold text-gray-950">{student.full_name}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Admission: {student.admission_no}</p>
                            </div>
                            {submission ? (
                              submission.status === 'graded' ? (
                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-md font-extrabold text-[9px] uppercase">
                                  Graded: {submission.grade}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded-md font-extrabold text-[9px] uppercase">
                                  Submitted
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-md font-extrabold text-[9px] uppercase">
                                Missing
                              </span>
                            )}
                          </div>

                          {/* Submission content details */}
                          {submission && (
                            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-150 text-[11px]">
                              {submission.submission_text && (
                                <>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Answer Text:</p>
                                  <p className="text-gray-700 font-medium whitespace-pre-wrap leading-relaxed mb-2">{submission.submission_text}</p>
                                </>
                              )}

                              {submission.file_url && (
                                <div className="mt-2 pt-2 border-t border-gray-150/40 space-y-1">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Attachment:</p>
                                  {submission.file_url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(submission.file_url) ? (
                                    <div className="border border-gray-150 rounded-lg overflow-hidden bg-white max-h-[160px] flex items-center justify-center relative group">
                                      <img 
                                        src={submission.file_url} 
                                        alt="Submission Sheet" 
                                        className="max-h-[160px] w-auto object-contain"
                                      />
                                      <a 
                                        href={submission.file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white px-2 py-0.5 rounded text-[8px] font-bold transition-all"
                                      >
                                        View Full
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between p-2 bg-white border border-gray-150 rounded-lg">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="text-[10px] font-bold text-gray-750 truncate max-w-[140px]">Solution Sheet (PDF)</span>
                                      </div>
                                      <a 
                                        href={submission.file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-2 py-0.5 bg-primary text-white rounded text-[8px] font-bold shadow-xs hover:bg-primary/95 transition-all"
                                      >
                                        Open PDF
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-[9px] text-gray-400 font-bold mt-2 pt-1 border-t border-gray-150/40">
                                Submitted on: {new Date(submission.submitted_at).toLocaleString()}
                              </p>

                              {submission.status === 'graded' && (
                                <div className="mt-2.5 pt-2 border-t border-gray-150/50 space-y-1">
                                  <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                    <Award className="h-3 w-3" /> Grade Feedback:
                                  </p>
                                  <p className="text-gray-650 font-medium italic">"{submission.feedback || 'No written feedback.'}"</p>
                                </div>
                              )}

                              {submission.status !== 'graded' && (
                                <button
                                  onClick={() => {
                                    setGradingSubmissionId(submission.id);
                                    setGradeValue('A');
                                    setFeedbackText('');
                                  }}
                                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 bg-primary text-white hover:bg-primary/95 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Grade & Give Feedback</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Grading Panel */}
                <div className="w-full md:w-2/5 p-5 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-150 overflow-y-auto">
                  {gradingSubmissionId ? (
                    <form onSubmit={handleGradeSubmissionSubmit} className="space-y-4 text-xs font-semibold">
                      <div className="flex items-center justify-between border-b border-gray-150 pb-2 mb-2">
                        <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[10px] text-primary">Enter Evaluation</h4>
                        <button 
                          type="button" 
                          onClick={() => setGradingSubmissionId(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      {/* Display Student Name */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Student Evaluated</span>
                        <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                          {(() => {
                            const sub = submissions.find(s => s.id === gradingSubmissionId);
                            const std = students.find(s => s.id === sub?.student_id);
                            return std ? std.full_name : 'Unknown Student';
                          })()}
                        </p>
                      </div>

                      {/* Display Selected Submission Details for Grading */}
                      {(() => {
                        const sub = submissions.find(s => s.id === gradingSubmissionId);
                        if (!sub) return null;
                        const isImg = sub.file_url && (sub.file_url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(sub.file_url));
                        return (
                          <div className="bg-white p-3 rounded-lg border border-gray-150 space-y-2 mt-2">
                            {sub.submission_text && (
                              <div>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Submitted Answer Text:</span>
                                <p className="text-gray-700 font-medium whitespace-pre-wrap leading-relaxed text-[10px] max-h-[85px] overflow-y-auto mt-0.5">{sub.submission_text}</p>
                              </div>
                            )}
                            {sub.file_url && (
                              <div className={sub.submission_text ? "pt-2 border-t border-gray-150/50" : ""}>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Attachment Homework Sheet:</span>
                                {isImg ? (
                                  <div className="border border-gray-150 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center max-h-[150px] relative">
                                    <img 
                                      src={sub.file_url} 
                                      alt="Student Calculation Sheet" 
                                      className="max-h-[150px] w-auto object-contain"
                                    />
                                    <a 
                                      href={sub.file_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white px-1.5 py-0.5 rounded text-[8px] font-bold"
                                    >
                                      Open Image
                                    </a>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-1.5 bg-gray-50 border border-gray-150 rounded-lg text-[9px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span className="font-bold text-gray-700 truncate max-w-[110px]">Homework.pdf</span>
                                    </div>
                                    <a 
                                      href={sub.file_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="px-2 py-0.5 bg-primary text-white rounded font-bold shadow-xs hover:bg-primary/95 text-[8px]"
                                    >
                                      View PDF
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 uppercase tracking-wider">Select Grade Letter</label>
                        <select
                          value={gradeValue}
                          onChange={e => setGradeValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-bold text-gray-900 shadow-sm cursor-pointer"
                        >
                          <option value="A">Grade A (Excellent)</option>
                          <option value="B">Grade B (Good)</option>
                          <option value="C">Grade C (Satisfactory)</option>
                          <option value="D">Grade D (Pass)</option>
                          <option value="E">Grade E (Poor Pass)</option>
                          <option value="F">Grade F (Fail)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 uppercase tracking-wider">Academic Feedback / Remarks</label>
                        <textarea
                          required
                          rows={4}
                          value={feedbackText}
                          onChange={e => setFeedbackText(e.target.value)}
                          placeholder="e.g. Excellent presentation of steps. Review question 3 on integers."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none resize-none font-medium leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={grading}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle className="h-4.5 w-4.5" />
                        <span>{grading ? 'Recording...' : 'Submit Evaluation'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-center py-12 px-4 text-gray-400">
                      <Award className="h-12 w-12 mb-3 text-gray-300 animate-pulse" />
                      <p className="text-xs font-bold leading-normal">
                        Select a submission on the left panel to record a grade evaluation and write feedback remarks.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
