'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { BookOpen, Calendar, Clock, FileText, CheckCircle, Award, X, Send, AlertCircle } from 'lucide-react';

interface DisplayAssignment {
  assignment: T.Assignment;
  subjectName: string;
  subjectCode: string;
  submission?: T.Submission;
}

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  
  // Identity & Child Switcher (Parent Mode)
  const [myStudents, setMyStudents] = useState<T.Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<T.Student | null>(null);
  
  // Data States
  const [displayAssignments, setDisplayAssignments] = useState<DisplayAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal States
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<T.Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View Grade Modal States
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<T.Submission | null>(null);
  const [activeAssignmentTitle, setActiveAssignmentTitle] = useState('');

  // File Attachment State
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // 1. Resolve Identity
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
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    loadIdentity();
  }, [user]);

  // 2. Load Selected Student Assignments & Submissions
  const loadStudentData = async () => {
    if (!activeStudent) return;
    setLoading(true);
    try {
      const [allAssignments, classSubjects, subjects] = await Promise.all([
        dbService.getAssignments({ studentId: activeStudent.id }),
        dbService.getClassSubjects(),
        dbService.getSubjects()
      ]);
      
      // Fetch submissions matching this student in parallel
      const mapped: DisplayAssignment[] = await Promise.all(
        allAssignments.map(async (a) => {
          const cs = classSubjects.find(x => x.id === a.class_subject_id);
          const sub = cs ? subjects.find(s => s.id === cs.subject_id) : null;
          
          const subs = await dbService.getSubmissions(a.id);
          const studentSub = subs.find(s => s.student_id === activeStudent.id);

          return {
            assignment: a,
            subjectName: sub ? sub.name : 'Unknown Subject',
            subjectCode: sub ? sub.code : '',
            submission: studentSub
          };
        })
      );

      setDisplayAssignments(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [activeStudent]);

  // Handle Answer Upload
  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !activeStudent || (!submissionText.trim() && !attachmentFile)) return;

    setSubmitting(true);
    try {
      let fileUrl = '';
      if (attachmentFile) {
        const cleanName = `${activeStudent.id}_${selectedAssignment.id}_${Date.now()}_${attachmentFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        fileUrl = await dbService.uploadSubmissionFile(attachmentFile, cleanName);
      }

      await dbService.submitAssignment({
        assignment_id: selectedAssignment.id,
        student_id: activeStudent.id,
        submission_text: submissionText.trim(),
        file_url: fileUrl || undefined
      });

      // Clear Form & Close
      setSubmissionText('');
      setAttachmentFile(null);
      setSubmitModalOpen(false);
      setSelectedAssignment(null);
      
      // Reload lists
      await loadStudentData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSubmit = (assignment: T.Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText('');
    setAttachmentFile(null);
    setSubmitModalOpen(true);
  };

  const handleOpenGrade = (title: string, sub: T.Submission) => {
    setActiveAssignmentTitle(title);
    setActiveSubmission(sub);
    setGradeModalOpen(true);
  };

  if (loading && myStudents.length > 0) {
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
        <div className="bg-white border border-gray-150 p-8 rounded-xl text-center text-xs text-gray-500">
          No student record is linked to your portal account. Please contact the administration office.
        </div>
      </DashboardLayout>
    );
  }

  // Split assignments into Pending (Not submitted or submitted but not graded) and Graded
  const pendingTasks = displayAssignments.filter(d => !d.submission || d.submission.status !== 'graded');
  const gradedTasks = displayAssignments.filter(d => d.submission && d.submission.status === 'graded');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title & Child Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Assignments Portal</h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === 'parent' ? "Track your child's course works and view grades." : "View active tasks, type homework submissions, and inspect feedback."}
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

        {/* Info Box */}
        {activeStudent && (
          <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-gray-950">{activeStudent.full_name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Admission: {activeStudent.admission_no}</p>
              </div>
            </div>
            {user?.role === 'parent' && (
              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900 rounded-md font-extrabold text-[9px] uppercase">
                Parent View Only
              </span>
            )}
          </div>
        )}

        {/* Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="p-5 border-b border-gray-150 bg-gray-50/50 flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900">Pending Assignments ({pendingTasks.length})</h2>
            </div>
            
            <div className="p-4 lg:p-5 flex-1 overflow-y-auto max-h-[550px] space-y-3">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold">All caught up! No pending assignments.</p>
                </div>
              ) : (
                pendingTasks.map(({ assignment, subjectName, subjectCode, submission }) => {
                  const isOverdue = new Date(assignment.due_date) < new Date();
                  return (
                    <div key={assignment.id} className="p-4 bg-gray-50/40 border border-gray-150 rounded-xl space-y-3 text-xs premium-card-hover">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-extrabold text-[9px] uppercase">
                            {subjectName} ({subjectCode})
                          </span>
                          {submission ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md font-extrabold text-[9px] uppercase">
                              Submitted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md font-extrabold text-[9px] uppercase">
                              To Do
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-extrabold text-gray-900 mt-2 leading-tight font-sans">{assignment.title}</h3>
                        <p className="text-gray-600 mt-1 font-medium whitespace-pre-line leading-relaxed">{assignment.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-gray-200/60">
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${isOverdue && !submission ? 'text-red-500' : 'text-gray-400'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          Due: {new Date(assignment.due_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        
                        {user?.role === 'student' && !submission && (
                          <button
                            onClick={() => handleOpenSubmit(assignment)}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            Submit Answer
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Graded & Completed Tasks */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            <div className="p-5 border-b border-gray-150 bg-gray-50/50 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-900 font-sans">Graded Course Works ({gradedTasks.length})</h2>
            </div>
            
            <div className="p-4 lg:p-5 flex-1 overflow-y-auto max-h-[550px] space-y-3">
              {gradedTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold">No graded items to show.</p>
                </div>
              ) : (
                gradedTasks.map(({ assignment, subjectName, subjectCode, submission }) => (
                  <div key={assignment.id} className="p-4 bg-gray-50/40 border border-gray-150 rounded-xl space-y-3 text-xs premium-card-hover">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/40 rounded-md font-extrabold text-[9px] uppercase">
                          {subjectName}
                        </span>
                        <h3 className="text-xs font-extrabold text-gray-950 mt-2 leading-tight font-sans">{assignment.title}</h3>
                      </div>
                      
                      {submission && (
                        <button
                          onClick={() => handleOpenGrade(assignment.title, submission)}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100 hover:scale-[1.02] rounded-lg font-extrabold text-[10px] transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Grade: {submission.grade}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MODAL: Submit Answer */}
        {submitModalOpen && selectedAssignment && (
          <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-150 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-155">
              <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
                <h3 className="font-extrabold text-sm text-gray-900">Submit Assignment Answer</h3>
                <button onClick={() => setSubmitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmission} className="p-6 space-y-4 text-xs font-semibold">
                <div className="bg-gray-50 p-4 border border-gray-150 rounded-xl space-y-1">
                  <h4 className="font-extrabold text-gray-950 leading-tight">{selectedAssignment.title}</h4>
                  <p className="text-gray-600 font-medium whitespace-pre-wrap leading-relaxed mt-1">{selectedAssignment.description}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Your Answer Text</label>
                  <textarea
                    required={!attachmentFile}
                    rows={4}
                    value={submissionText}
                    onChange={e => setSubmissionText(e.target.value)}
                    placeholder="Write your homework answers or explanations here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none resize-none font-medium leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Solution Attachment (Take a photo of your calculations or attach a PDF)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File size is too large. Max allowed is 5MB.');
                          e.target.value = '';
                          return;
                        }
                        // Alert on localStorage warning if size is relatively large in demo mode
                        if (!dbService.uploadSubmissionFile.toString().includes('storage') && file.size > 800 * 1024) {
                          alert('Demo Mode Warning: Storing files larger than 800KB in LocalStorage may exceed browser storage quotas. If possible, upload a smaller/compressed image.');
                        }
                        setAttachmentFile(file);
                      } else {
                        setAttachmentFile(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>

                <div className="flex gap-3 pt-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setSubmitModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Upload Answer'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: View Grade Evaluation & Feedback */}
        {gradeModalOpen && activeSubmission && (
          <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl w-full max-w-md border border-gray-150 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-155">
              <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
                <h3 className="font-extrabold text-sm text-gray-900">Academic Assessment</h3>
                <button onClick={() => setGradeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider">Assignment Title</span>
                  <h4 className="text-xs font-extrabold text-gray-900 mt-0.5">{activeAssignmentTitle}</h4>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-center shrink-0 min-w-[80px]">
                    <span className="text-[9px] font-bold uppercase block tracking-wider opacity-85">Grade</span>
                    <span className="text-3xl font-extrabold block leading-tight mt-0.5">{activeSubmission.grade}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Evaluation Date</span>
                    <p className="text-gray-750 font-bold">{new Date(activeSubmission.submitted_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border border-gray-150 rounded-xl space-y-1 leading-normal font-medium text-gray-600">
                  <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wider block flex items-center gap-1 mb-1">
                    <Award className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    Teacher's Feedback Remarks
                  </span>
                  <p className="italic">"{activeSubmission.feedback || 'No remarks provided.'}"</p>
                </div>

                {activeSubmission.submission_text && (
                  <div className="pt-2 border-t border-gray-150 space-y-1">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">Your Submitted Answer</span>
                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 max-h-[120px] overflow-y-auto text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">
                      {activeSubmission.submission_text}
                    </div>
                  </div>
                )}

                {activeSubmission.file_url && (
                  <div className="pt-2 border-t border-gray-150 space-y-1">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Attachment Submission</span>
                    {activeSubmission.file_url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(activeSubmission.file_url) ? (
                      <div className="relative mt-1 border border-gray-150 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center max-h-[180px]">
                        <img 
                          src={activeSubmission.file_url} 
                          alt="Homework Submission Attachment" 
                          className="max-h-[180px] w-auto object-contain"
                        />
                        <a 
                          href={activeSubmission.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded text-[9px] font-bold transition-all"
                        >
                          View Full Image
                        </a>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between p-2.5 bg-gray-50 border border-gray-150 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-[10px] font-bold text-gray-750 truncate max-w-[185px]">Math Calculations (PDF)</span>
                        </div>
                        <a 
                          href={activeSubmission.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-primary text-white rounded text-[9px] font-bold shadow-xs hover:bg-primary/95 transition-all"
                        >
                          Open PDF
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setGradeModalOpen(false)}
                  className="w-full py-2 bg-gray-150 hover:bg-gray-200 text-gray-800 rounded-lg font-bold transition-all cursor-pointer text-center"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
