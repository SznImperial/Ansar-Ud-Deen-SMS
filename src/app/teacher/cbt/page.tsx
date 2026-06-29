'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { Plus, Trash2, Edit3, ClipboardList, BookOpen, Clock, Play, CheckCircle, AlertCircle, Eye, ShieldAlert, Award, AlertTriangle } from 'lucide-react';

interface QuestionDraft {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}

export default function TeacherCBTPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<T.CBTExam[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [submissions, setSubmissions] = useState<T.CBTSubmission[]>([]);
  const [students, setStudents] = useState<T.Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'exams' | 'results'
  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('exams');

  // Authoring Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  // Results View State
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [viewQuestionsModal, setViewQuestionsModal] = useState(false);
  const [examQuestions, setExamQuestions] = useState<T.CBTQuestion[]>([]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [examsList, csList, clsList, subList, submsList, stdList] = await Promise.all([
        dbService.getCbtExams(),
        dbService.getClassSubjects(),
        dbService.getClasses(),
        dbService.getSubjects(),
        dbService.getCbtSubmissions(),
        dbService.getStudents()
      ]);

      // Only show exams created by this teacher
      setExams(examsList.filter(e => e.created_by === user.id));
      
      // Get class subjects taught by this teacher
      const teacherCs = csList.filter(cs => cs.teacher_id === user.id);
      setClassSubjects(teacherCs);
      if (teacherCs.length > 0) {
        setSelectedClassSubjectId(teacherCs[0].id);
      }

      setClasses(clsList);
      setSubjects(subList);
      setSubmissions(submsList);
      setStudents(stdList);
    } catch (err) {
      console.error('Failed to load CBT data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Question handlers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: keyof QuestionDraft, val: string) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val } as QuestionDraft;
    setQuestions(updated);
  };

  // Create exam submission
  const handleSubmitExam = async (status: 'draft' | 'pending_approval') => {
    setErrorMsg('');
    if (!examTitle || !selectedClassSubjectId || duration <= 0) {
      setErrorMsg('Please fill in exam details.');
      return;
    }

    // Verify all questions have content
    const invalid = questions.some(q => !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d);
    if (invalid) {
      setErrorMsg('Please fill in all question texts and option choices.');
      return;
    }

    try {
      await dbService.addCbtExam({
        class_subject_id: selectedClassSubjectId,
        title: examTitle,
        duration_minutes: duration,
        status,
        created_by: user!.id
      }, questions);

      // Reset
      setExamTitle('');
      setDuration(30);
      setQuestions([{ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }]);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create exam.');
    }
  };

  // Inspect questions
  const handleViewQuestions = async (examId: string) => {
    try {
      const qList = await dbService.getCbtQuestions(examId);
      setExamQuestions(qList);
      setSelectedExamId(examId);
      setViewQuestionsModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getClassSubjectLabel = (csId: string) => {
    const cs = classSubjects.find(x => x.id === csId);
    const cls = classes.find(c => c.id === cs?.class_id);
    const sub = subjects.find(s => s.id === cs?.subject_id);
    return cs ? `${cls?.name} - ${sub?.name}` : 'Unknown';
  };

  const getStatusBadge = (status: T.CBTExam['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'pending_approval':
        return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-150';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-150';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="relative rounded-2xl bg-gradient-to-r from-emerald-800 via-primary to-emerald-700 text-white p-6 shadow-md overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 -translate-y-4 translate-x-4">
            <ClipboardList className="h-64 w-64" />
          </div>
          <div className="relative z-10 space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">CBT Exams Manager</h1>
            <p className="text-xs md:text-sm text-emerald-100 font-medium max-w-2xl leading-relaxed">
              Design online multiple-choice question sheets, set time limits, monitor submissions, and review students proctor logs.
            </p>
          </div>
        </div>

        {/* Tab Controls & Add Exam Button */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 text-xs font-semibold">
          <div className="inline-flex rounded-lg border border-gray-250 p-0.5 bg-gray-50/50">
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-md font-bold transition-colors cursor-pointer ${
                activeTab === 'exams' ? 'bg-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              My Exams
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-md font-bold transition-colors cursor-pointer ${
                activeTab === 'results' ? 'bg-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Exams Results
            </button>
          </div>

          {classSubjects.length > 0 && activeTab === 'exams' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Create CBT Exam</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : classSubjects.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 rounded-xl text-center text-xs text-gray-500">
            <AlertCircle className="h-8 w-8 text-gray-350 mx-auto mb-3" />
            You are not currently assigned to teach any subjects. Please contact the administrator to map your staff profile.
          </div>
        ) : activeTab === 'exams' ? (
          /* Exams List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.length === 0 ? (
              <div className="col-span-full bg-white border border-gray-200 p-12 rounded-xl text-center text-xs text-gray-500">
                <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                No online exams created yet. Click &quot;Create CBT Exam&quot; above to build your first questionnaire!
              </div>
            ) : (
              exams.map(exam => (
                <div key={exam.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(exam.status)}`}>
                        {exam.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {exam.duration_minutes} Mins
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 leading-snug">{exam.title}</h3>
                    <p className="text-[10px] text-gray-500 font-extrabold tracking-wide uppercase">{getClassSubjectLabel(exam.class_subject_id)}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                    <button
                      onClick={() => handleViewQuestions(exam.id)}
                      className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Questions
                    </button>
                    <span className="text-[9px] text-gray-400">Created: {new Date(exam.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Results tab */
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-150 bg-gray-50/50 text-xs font-bold text-gray-700">
              Exam Submissions & Scores
            </div>
            <div className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs bg-white">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                      <th className="p-4">Student</th>
                      <th className="p-4">Exam Paper</th>
                      <th className="p-4 text-center">Score</th>
                      <th className="p-4 text-center">Proctoring Log</th>
                      <th className="p-4 text-center">Results Release</th>
                      <th className="p-4">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissions.filter(s => exams.some(e => e.id === s.exam_id)).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 font-semibold bg-white">
                          No submissions recorded for your exams yet.
                        </td>
                      </tr>
                    ) : (
                      submissions
                        .filter(s => exams.some(e => e.id === s.exam_id))
                        .map(sub => {
                          const ex = exams.find(e => e.id === sub.exam_id);
                          const std = students.find(s => s.id === sub.student_id);

                          return (
                            <tr key={sub.id} className="hover:bg-gray-50/30">
                              <td className="p-4">
                                <div className="font-bold text-gray-900">{std ? std.full_name : 'Unknown Student'}</div>
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{std?.admission_no}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-gray-800">{ex?.title}</div>
                                <div className="text-[10px] text-gray-500 font-medium mt-0.5">{ex && getClassSubjectLabel(ex.class_subject_id)}</div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="font-extrabold text-primary">{sub.score} / {sub.total_questions}</span>
                                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                                  ({sub.total_questions > 0 ? ((sub.score / sub.total_questions) * 100).toFixed(0) : 0}%)
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {sub.proctor_violated ? (
                                    <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md font-bold text-[9px] flex items-center gap-1">
                                      <ShieldAlert className="h-3 w-3" />
                                      Violated Lockout
                                    </span>
                                  ) : sub.tab_switch_count > 0 || sub.noise_spike_count > 5 ? (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[9px] flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Integrity Warning
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-bold text-[9px] flex items-center gap-1">
                                      ✓ Integrity Passed
                                    </span>
                                  )}
                                  <span className="text-[9px] text-gray-400 font-medium mt-0.5">
                                    Switches: {sub.tab_switch_count} | Noise spikes: {sub.noise_spike_count}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                {sub.status === 'released' ? (
                                  <span className="px-2.5 py-0.8 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-bold text-[9px]">
                                    Released
                                  </span>
                                ) : sub.status === 'withheld' ? (
                                  <span className="px-2.5 py-0.8 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg font-bold text-[9px]">
                                    Withheld
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.8 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg font-bold text-[9px]">
                                    Awaiting release
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-gray-500 font-medium">
                                {new Date(sub.submitted_at).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden block p-4 space-y-4">
                {submissions.filter(s => exams.some(e => e.id === s.exam_id)).length === 0 ? (
                  <div className="p-8 text-center text-gray-400 italic bg-white border border-gray-205 rounded-xl">
                    No submissions recorded for your exams yet.
                  </div>
                ) : (
                  submissions
                    .filter(s => exams.some(e => e.id === s.exam_id))
                    .map(sub => {
                      const ex = exams.find(e => e.id === sub.exam_id);
                      const std = students.find(s => s.id === sub.student_id);

                      return (
                        <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3.5 shadow-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-extrabold text-gray-900 text-xs">{std ? std.full_name : 'Unknown Student'}</div>
                              <div className="text-[9px] text-gray-400 font-mono mt-0.5">{std?.admission_no}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-primary text-xs">{sub.score} / {sub.total_questions}</span>
                              <span className="text-[9px] text-gray-400 font-bold block">
                                ({sub.total_questions > 0 ? ((sub.score / sub.total_questions) * 100).toFixed(0) : 0}%)
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-2.5 rounded-lg space-y-2 text-[10px]">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 font-bold">Exam Paper:</span>
                              <span className="text-gray-800 font-extrabold">{ex?.title}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-100 pt-1.5">
                              <span className="text-gray-400 font-bold">Proctor status:</span>
                              {sub.proctor_violated ? (
                                <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold flex items-center gap-0.5">
                                  <ShieldAlert className="h-3 w-3" /> Violated
                                </span>
                              ) : sub.tab_switch_count > 0 || sub.noise_spike_count > 5 ? (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold flex items-center gap-0.5">
                                  <AlertTriangle className="h-3 w-3" /> Warning
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded font-bold">
                                  Passed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-bold">Violations log:</span>
                            <span className="text-gray-600 font-extrabold">Switches: {sub.tab_switch_count} | Noise: {sub.noise_spike_count}</span>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-bold">Submitted:</span>
                            <span className="text-gray-500 font-semibold">{new Date(sub.submitted_at).toLocaleString()}</span>
                          </div>

                          <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-bold">Release status:</span>
                            {sub.status === 'released' ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded font-bold">
                                Released
                              </span>
                            ) : sub.status === 'withheld' ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-100 rounded font-bold">
                                Withheld
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded font-bold">
                                Awaiting release
                              </span>
                            )}
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

      {/* CBT Creator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border shadow-xl overflow-hidden text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-gray-900">Design Online CBT Examination</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[66vh] overflow-y-auto pr-2">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase text-gray-400 font-extrabold tracking-wider mb-1">Exam Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Term Mathematics Exam"
                    className="w-full px-3 py-2 border rounded-lg bg-white text-gray-950 font-bold"
                    value={examTitle}
                    onChange={e => setExamTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-extrabold tracking-wider mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-white text-gray-950 font-bold"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-extrabold tracking-wider mb-1">Class & Subject Allocation</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg bg-white text-gray-955 font-bold"
                  value={selectedClassSubjectId}
                  onChange={e => setSelectedClassSubjectId(e.target.value)}
                >
                  {classSubjects.map(cs => (
                    <option key={cs.id} value={cs.id}>{getClassSubjectLabel(cs.id)}</option>
                  ))}
                </select>
              </div>

              {/* Questions Area */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                  <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider">Exam Questions List ({questions.length})</span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-2.5 py-1 border border-primary text-primary hover:bg-primary hover:text-white rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Question
                  </button>
                </div>

                <div className="space-y-5">
                  {questions.map((q, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-primary">Question {idx + 1}</span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase text-gray-400 font-extrabold mb-1">Question Description</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Type your question text here..."
                          className="w-full px-3 py-2 border rounded-lg bg-white text-gray-950 font-bold"
                          value={q.question_text}
                          onChange={e => handleQuestionChange(idx, 'question_text', e.target.value)}
                        />
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase text-gray-400 font-extrabold mb-1">Option A</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-950 font-bold"
                            value={q.option_a}
                            onChange={e => handleQuestionChange(idx, 'option_a', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-gray-400 font-extrabold mb-1">Option B</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-955 font-bold"
                            value={q.option_b}
                            onChange={e => handleQuestionChange(idx, 'option_b', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-gray-400 font-extrabold mb-1">Option C</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-955 font-bold"
                            value={q.option_c}
                            onChange={e => handleQuestionChange(idx, 'option_c', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-gray-400 font-extrabold mb-1">Option D</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-955 font-bold"
                            value={q.option_d}
                            onChange={e => handleQuestionChange(idx, 'option_d', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Correct Option Radio */}
                      <div className="flex items-center gap-4 pt-1">
                        <span className="text-[9px] uppercase text-gray-400 font-extrabold">Correct Option:</span>
                        <div className="flex items-center gap-3">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <label key={opt} className="flex items-center gap-1 cursor-pointer font-bold">
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={q.correct_option === opt}
                                onChange={() => handleQuestionChange(idx, 'correct_option', opt)}
                                className="h-3.5 w-3.5 text-primary"
                              />
                              <span>Option {opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg font-bold text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmitExam('draft')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmitExam('pending_approval')}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Questions Detail Modal */}
      {viewQuestionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border shadow-xl overflow-hidden text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-gray-900">Exam Questionnaire Preview</h2>
              <button 
                onClick={() => setViewQuestionsModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {examQuestions.length === 0 ? (
                <p className="text-gray-400 italic text-center py-4">No questions set for this exam paper.</p>
              ) : (
                examQuestions.map((q, idx) => (
                  <div key={q.id} className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-primary">Question {idx + 1}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-bold text-[9px]">
                        Correct: Option {q.correct_option}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 leading-snug">{q.question_text}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div><span className="text-gray-400 font-mono">A.</span> {q.option_a}</div>
                      <div><span className="text-gray-400 font-mono">B.</span> {q.option_b}</div>
                      <div><span className="text-gray-400 font-mono">C.</span> {q.option_c}</div>
                      <div><span className="text-gray-400 font-mono">D.</span> {q.option_d}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewQuestionsModal(false)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
