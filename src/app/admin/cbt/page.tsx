'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import * as T from '@/lib/types';
import { Award, CheckCircle, XCircle, Eye, AlertCircle, Clock, ShieldAlert, Trophy, HelpCircle, FileCheck, CheckCircle2 } from 'lucide-react';

export default function AdminCBTPage() {
  const [exams, setExams] = useState<T.CBTExam[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [submissions, setSubmissions] = useState<T.CBTSubmission[]>([]);
  const [students, setStudents] = useState<T.Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'approvals' | 'results'
  const [activeTab, setActiveTab] = useState<'approvals' | 'results'>('approvals');

  // Preview Modal States
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<T.CBTQuestion[]>([]);

  // Submissions Modal States
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedExamSubmissions, setSelectedExamSubmissions] = useState<T.CBTSubmission[]>([]);

  const loadData = async () => {
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
      setExams(examsList);
      setClassSubjects(csList);
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
  }, []);

  const handleAuditQuestions = async (examId: string) => {
    try {
      const qList = await dbService.getCbtQuestions(examId);
      setPreviewQuestions(qList);
      setSelectedExamId(examId);
      setShowPreviewModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveExam = async (examId: string) => {
    try {
      await dbService.updateCBTExamStatus(examId, 'approved');
      setShowPreviewModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectExam = async (examId: string) => {
    try {
      await dbService.updateCBTExamStatus(examId, 'rejected');
      setShowPreviewModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewSubmissions = (examId: string) => {
    const examSubs = submissions.filter(s => s.exam_id === examId);
    setSelectedExamSubmissions(examSubs);
    setSelectedExamId(examId);
    setShowSubmissionsModal(true);
  };

  const handleReleaseResults = async (examId: string) => {
    try {
      await dbService.releaseCBTResults(examId);
      setShowSubmissionsModal(false);
      loadData();
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

  const pendingExams = exams.filter(e => e.status === 'pending_approval');
  const approvedExams = exams.filter(e => e.status === 'approved');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="relative rounded-2xl bg-gradient-to-r from-emerald-800 via-primary to-emerald-700 text-white p-6 shadow-md overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 -translate-y-4 translate-x-4">
            <Award className="h-64 w-64" />
          </div>
          <div className="relative z-10 space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">CBT Administration Control</h1>
            <p className="text-xs md:text-sm text-emerald-100 font-medium max-w-2xl leading-relaxed">
              Audit questions created by teaching staff, approve exams for students, inspect integrity proctoring logs, and release scores.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-start text-xs font-semibold">
          <div className="inline-flex rounded-lg border border-gray-250 p-0.5 bg-gray-50/50">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-md font-bold transition-colors cursor-pointer ${
                activeTab === 'approvals' ? 'bg-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Pending Approvals ({pendingExams.length})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-md font-bold transition-colors cursor-pointer ${
                activeTab === 'results' ? 'bg-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Audit & Release Results ({approvedExams.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activeTab === 'approvals' ? (
          /* Approvals Roster */
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-150 bg-gray-50/50 text-xs font-bold text-gray-700">
              Exam Auditing Queue
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-750">
                    <th className="p-4">Exam Details</th>
                    <th className="p-4">Class & Subject</th>
                    <th className="p-4 text-center">Duration</th>
                    <th className="p-4 text-center">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingExams.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500 font-semibold bg-white">
                        No online exams are awaiting approval in the queue.
                      </td>
                    </tr>
                  ) : (
                    pendingExams.map(exam => (
                      <tr key={exam.id} className="hover:bg-gray-50/30">
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{exam.title}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Submitted: {new Date(exam.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4 font-bold text-gray-700">
                          {getClassSubjectLabel(exam.class_subject_id)}
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold flex items-center justify-center gap-1 text-gray-600">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {exam.duration_minutes} Mins
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleAuditQuestions(exam.id)}
                            className="px-3.5 py-1.8 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Audit Questions
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Results Release tab */
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-150 bg-gray-50/50 text-xs font-bold text-gray-700">
              Exam Submissions & Results Release
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-750">
                    <th className="p-4">Exam Title</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4 text-center">Submissions</th>
                    <th className="p-4 text-center">Result Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approvedExams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-semibold bg-white">
                        No approved online exams available.
                      </td>
                    </tr>
                  ) : (
                    approvedExams.map(exam => {
                      const examSubs = submissions.filter(s => s.exam_id === exam.id);
                      const isAnyReleased = examSubs.some(s => s.status === 'released');

                      return (
                        <tr key={exam.id} className="hover:bg-gray-50/30">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{exam.title}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Approved: {new Date(exam.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="p-4 font-bold text-gray-700">
                            {getClassSubjectLabel(exam.class_subject_id)}
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-extrabold text-gray-800 bg-gray-50 px-2 py-0.5 border border-gray-200 rounded-md">
                              {examSubs.length} Submitted
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {examSubs.length === 0 ? (
                              <span className="text-gray-400 font-semibold">-</span>
                            ) : isAnyReleased ? (
                              <span className="px-2.5 py-0.8 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-bold text-[9px] inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Released
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.8 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg font-bold text-[9px] inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Awaiting Release
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleViewSubmissions(exam.id)}
                              className="px-3.5 py-1.8 border border-gray-200 hover:bg-gray-50 rounded-lg font-bold text-gray-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Audit Submissions
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Audit Questions Modal */}
      {showPreviewModal && selectedExamId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border shadow-xl overflow-hidden text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-sm font-extrabold text-gray-900">Audit Exam Questions Roster</h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Questions List */}
            <div className="p-5 space-y-4 max-h-[58vh] overflow-y-auto pr-2">
              {previewQuestions.length === 0 ? (
                <p className="text-gray-400 italic text-center py-4">No questions set inside this questionnaire.</p>
              ) : (
                previewQuestions.map((q, idx) => (
                  <div key={q.id} className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-primary">Question {idx + 1}</span>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-bold text-[9px]">
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

            {/* Action buttons */}
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold">Inspect details before releasing to students.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRejectExam(selectedExamId)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <XCircle className="h-4.5 w-4.5" />
                  Reject & Edit
                </button>
                <button
                  onClick={() => handleApproveExam(selectedExamId)}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle className="h-4.5 w-4.5" />
                  Approve & Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submissions list Audit Modal */}
      {showSubmissionsModal && selectedExamId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border shadow-xl overflow-hidden text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-250 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Audit Student CBT Submissions</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Inspect grades, proctoring violations logs, and release scores.</p>
              </div>
              <button 
                onClick={() => setShowSubmissionsModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="p-5 max-h-[50vh] overflow-y-auto pr-2">
              <div className="border border-gray-150 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px] font-semibold bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold">
                      <th className="p-3">Student Name</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3 text-center">Punctuality/Log</th>
                      <th className="p-3 text-center">Proctoring Status</th>
                      <th className="p-3 text-center">Result Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedExamSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                          No student submissions recorded for this exam yet.
                        </td>
                      </tr>
                    ) : (
                      selectedExamSubmissions.map(sub => {
                        const std = students.find(s => s.id === sub.student_id);
                        return (
                          <tr key={sub.id} className="hover:bg-gray-50/20">
                            <td className="p-3">
                              <div className="font-bold text-gray-900">{std ? std.full_name : 'Unknown Student'}</div>
                              <div className="text-[9px] text-gray-400 font-mono mt-0.5">{std?.admission_no}</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-extrabold text-primary">{sub.score} / {sub.total_questions}</span>
                              <span className="text-[9px] text-gray-400 font-bold block mt-0.5">
                                ({sub.total_questions > 0 ? ((sub.score / sub.total_questions) * 100).toFixed(0) : 0}%)
                              </span>
                            </td>
                            <td className="p-3 text-center text-gray-500 font-medium">
                              {new Date(sub.submitted_at).toLocaleTimeString()}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                {sub.proctor_violated ? (
                                  <span className="px-2 py-0.5 bg-red-50 text-red-850 border border-red-100 rounded-md font-bold text-[9px] flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" />
                                    Violated Lockout
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-bold text-[9px]">
                                    Integrity Passed
                                  </span>
                                )}
                                <span className="text-[9px] text-gray-400 font-medium mt-0.5">
                                  Switches: {sub.tab_switch_count} | Noise spikes: {sub.noise_spike_count}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {sub.status === 'released' ? (
                                <span className="px-2.5 py-0.8 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-bold text-[9px]">
                                  Released
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.8 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg font-bold text-[9px]">
                                  Pending
                                </span>
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

            {/* Footer */}
            <div className="p-5 border-t border-gray-250 bg-gray-50 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold">Release results to make grades visible on student dashboards.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSubmissionsModal(false)}
                  className="px-4 py-2 border rounded-lg font-bold text-gray-700 cursor-pointer"
                >
                  Close
                </button>
                {selectedExamSubmissions.length > 0 && selectedExamSubmissions.some(s => s.status !== 'released') && (
                  <button
                    onClick={() => handleReleaseResults(selectedExamId!)}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <FileCheck className="h-4.5 w-4.5" />
                    Release Results
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
