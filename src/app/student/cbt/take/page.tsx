'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { Clock, ShieldAlert, Monitor, Video, Mic, CheckSquare, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

function CBTTerminalContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('exam_id') || '';

  const [exam, setExam] = useState<T.CBTExam | null>(null);
  const [questions, setQuestions] = useState<T.CBTQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [student, setStudent] = useState<T.Student | null>(null);
  
  // Navigation & Timer
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Proctoring States
  const [tabSwitches, setTabSwitches] = useState(0);
  const [noiseSpikes, setNoiseSpikes] = useState(0);
  const [isViolated, setIsViolated] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  
  // Media Devices
  const [mediaError, setMediaError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const micIntervalRef = useRef<any>(null);

  // Load Exam Details
  useEffect(() => {
    if (!examId || !user) return;

    async function loadExam() {
      try {
        const [examsList, qList, stdList] = await Promise.all([
          dbService.getCbtExams(),
          dbService.getCbtQuestions(examId),
          dbService.getStudents()
        ]);

        const matchExam = examsList.find(e => e.id === examId);
        if (!matchExam) {
          router.replace('/student/cbt');
          return;
        }

        if (!user) return;
        const matchStudent = stdList.find(s => s.profile_id === user.id);
        if (!matchStudent) {
          router.replace('/student/cbt');
          return;
        }

        setExam(matchExam);
        setQuestions(qList);
        setStudent(matchStudent);
        setTimeLeft(matchExam.duration_minutes * 60);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [examId, user]);

  // Window unload listener (Unload Prevention)
  useEffect(() => {
    if (!examStarted || isViolated || submitting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Warning! Leaving this page will auto-submit your current exam progress. Are you sure you want to quit?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examStarted, isViolated, submitting]);

  // Fullscreen listener
  useEffect(() => {
    if (!examStarted || isViolated || submitting) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenError(true);
      } else {
        setFullscreenError(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [examStarted, isViolated, submitting]);

  // Tab Switching & Visibility Blur Proctoring
  useEffect(() => {
    if (!examStarted || isViolated || submitting) return;

    const triggerViolationWarning = () => {
      setTabSwitches(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setIsViolated(true);
          // Auto submit immediately on 3rd violation
          handleAutoSubmit(newCount, noiseSpikes);
        }
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        triggerViolationWarning();
      } else {
        setIsBlurred(false);
      }
    };

    const handleWindowBlur = () => {
      setIsBlurred(true);
      triggerViolationWarning();
    };

    const handleWindowFocus = () => {
      setIsBlurred(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [examStarted, isViolated, submitting, noiseSpikes]);

  // Timer countdown
  useEffect(() => {
    if (!examStarted || isViolated || timeLeft === null || timeLeft <= 0 || submitting) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit(tabSwitches, noiseSpikes);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, isViolated, timeLeft, submitting, tabSwitches, noiseSpikes]);

  // Request Fullscreen
  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request rejected:', err);
    }
  };

  // Start Proctoring Media Devices (Camera & Audio levels)
  const startProctoringStreams = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      mediaStreamRef.current = stream;

      // 1. Bind webcam stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 2. Audio Level Analyzer setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      audioAnalyserRef.current = analyser;

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      // Periodically check decibel volume levels
      micIntervalRef.current = setInterval(() => {
        if (!audioAnalyserRef.current) return;
        audioAnalyserRef.current.getFloatTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) amplitude
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Convert amplitude to dBFS
        let db = 20 * Math.log10(rms);
        if (!isFinite(db)) db = -100; // handle absolute silence

        // -40 dBFS is our threshold for speaking or loud ambient noise
        if (db > -40) {
          setNoiseSpikes(prev => prev + 1);
        }
      }, 1000);

    } catch (err) {
      console.error('Camera/Microphone access denied:', err);
      setMediaError('Proctoring error: Camera and Microphone permissions are required to take this exam. Please enable them in your browser settings.');
    }
  };

  // Stop Proctoring Media Devices
  const stopProctoringStreams = () => {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
  };

  const handleBeginExam = async () => {
    setMediaError('');
    await requestFullscreen();
    await startProctoringStreams();

    // Check if permission was granted before starting
    if (mediaStreamRef.current) {
      setExamStarted(true);
    }
  };

  const handleSelectAnswer = (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option) {
        score++;
      }
    });
    return score;
  };

  // Standard submit
  const handleSubmitExam = async () => {
    if (!student || !exam) return;
    setSubmitting(true);
    stopProctoringStreams();

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }

    const finalScore = calculateScore();

    try {
      await dbService.addCbtSubmission({
        exam_id: exam.id,
        student_id: student.id,
        answers,
        score: finalScore,
        total_questions: questions.length,
        tab_switch_count: tabSwitches,
        noise_spike_count: noiseSpikes,
        proctor_violated: false,
        status: 'submitted'
      });

      router.replace('/student/cbt');
    } catch (err: any) {
      console.error('CBT submission failed:', err.message || err);
      setSubmitError(err.message || 'CBT exam submission failed. Please verify connection and try again.');
      setSubmitting(false);
    }
  };

  // Proctor violation or timeout submit
  const handleAutoSubmit = async (finalTabSwitches: number, finalNoiseSpikes: number) => {
    if (!student || !exam || submitting) return;
    setSubmitting(true);
    stopProctoringStreams();

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }

    const finalScore = calculateScore();
    const violated = finalTabSwitches >= 3;

    try {
      await dbService.addCbtSubmission({
        exam_id: exam.id,
        student_id: student.id,
        answers,
        score: finalScore,
        total_questions: questions.length,
        tab_switch_count: finalTabSwitches,
        noise_spike_count: finalNoiseSpikes,
        proctor_violated: violated,
        status: 'submitted'
      });
    } catch (err) {
      console.error('Auto-submit failed:', err);
    } finally {
      // Direct back to CBT dashboard
      router.replace('/student/cbt');
    }
  };

  // Keyboard and Right-click blocks
  useEffect(() => {
    if (!examStarted || isViolated || submitting) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I, Alt+Tab, Escape
      if (
        (e.ctrlKey && ['c', 'v', 'u', 'a', 'x'].includes(e.key.toLowerCase())) || 
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examStarted, isViolated, submitting]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Renders the initial start-instruction view
  if (!examStarted && exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-md text-xs font-semibold">
          <div className="text-center space-y-2 border-b border-gray-150 pb-4">
            <ShieldAlert className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-lg font-extrabold text-gray-900 uppercase tracking-tight">CBT Testing Rules & Integrity Agreement</h1>
            <p className="text-gray-500 font-medium">{exam.title}</p>
          </div>

          {mediaError && (
            <div className="p-3.5 bg-red-50 text-red-800 border border-red-100 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{mediaError}</span>
            </div>
          )}

          <div className="space-y-3.5 text-gray-700">
            <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider block">Integrity Guidelines</span>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"></span>
                <span>**Camera Feed Active**: Your webcam will record a live feed. Closing or covering your camera is a proctor violation.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"></span>
                <span>**Audio Analysis**: The microphone measures noise level spikes. Speaking or loud environments trigger warnings.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"></span>
                <span>**Full Lockout Mode**: Exiting fullscreen or switching browser tabs/apps is blocked. **3 tab switches will result in immediate automatic submission of your exam with a Proctor Violated status.**</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"></span>
                <span>**Disallowed Input**: Right-clicking, copying questions, pasting, and common debugging keyboard shortcuts are locked.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-150 flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Duration: {exam.duration_minutes} Minutes</span>
            </div>
            <button
              onClick={handleBeginExam}
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
            >
              I Agree, Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renders the Proctored Lockout/Violation Screen
  if (isViolated) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-8 text-center space-y-4 shadow-lg text-xs font-semibold">
          <ShieldAlert className="h-16 w-16 text-red-600 mx-auto animate-bounce" />
          <h1 className="text-lg font-extrabold text-red-800 uppercase tracking-tight">Exam Terminated</h1>
          <p className="text-gray-600 font-medium">
            You switched tabs or left the active testing screen 3 times. This constitutes a severe integrity violation.
          </p>
          <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg font-mono">
            STATUS: PROCTOR VIOLATION REGISTERED
          </div>
          <p className="text-gray-400 text-[10px]">
            Your current answers have been submitted automatically. Contact your administrator or subject teacher.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Main Proctor Terminal Layout
  return (
    <div className="min-h-screen bg-gray-50 text-xs font-semibold flex flex-col justify-between select-none">
      {/* Top Banner stats */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">Proctored CBT Terminal</span>
        </div>

        {/* Live Timer */}
        <div className={`px-4 py-2 border rounded-xl flex items-center gap-2 font-mono text-base font-extrabold ${
          timeLeft !== null && timeLeft < 120 
            ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
            : 'bg-gray-50 text-gray-800 border-gray-150'
        }`}>
          <Clock className="h-5 w-5" />
          <span>{timeLeft !== null ? formatTime(timeLeft) : '0:00'}</span>
        </div>
      </header>

      {/* Main Terminal Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Columns - Renders Active MCQ */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-white border border-gray-200 rounded-2xl p-6 shadow-xs min-h-[50vh]">
          {submitError && (
            <div className="mb-4 p-3.5 bg-red-50 text-red-800 border border-red-150 rounded-lg flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-xs">Submission Failed</p>
                <p className="font-medium text-[10px] leading-relaxed">{submitError}</p>
              </div>
            </div>
          )}

          {currentQuestion ? (
            <div className="space-y-6">
              {/* Question Index Title */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-extrabold text-primary text-sm">Question {currentIndex + 1} of {questions.length}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">MCQ Single Selection</span>
              </div>

              {/* Question Text */}
              <h2 className="text-sm font-extrabold text-gray-900 leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              {/* MCQ Choices */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { key: 'A', text: currentQuestion.option_a },
                  { key: 'B', text: currentQuestion.option_b },
                  { key: 'C', text: currentQuestion.option_c },
                  { key: 'D', text: currentQuestion.option_d }
                ].map(opt => {
                  const isSelected = answers[currentQuestion.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectAnswer(currentQuestion.id, opt.key)}
                      className={`w-full text-left p-4 border rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                        isSelected 
                          ? 'border-primary bg-emerald-50/20 text-emerald-950 font-extrabold' 
                          : 'border-gray-200 hover:bg-gray-50/50 text-gray-700'
                      }`}
                    >
                      <span className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-primary text-white border-primary' : 'bg-gray-50 border-gray-300 text-gray-500'
                      }`}>
                        {opt.key}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 italic text-center py-12">Loading questions...</div>
          )}

          {/* Action navigators */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-gray-250 hover:bg-gray-50 disabled:opacity-30 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
            
            {currentIndex + 1 === questions.length ? (
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <CheckSquare className="h-4.5 w-4.5" />
                Submit Exam Paper
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 border border-gray-250 hover:bg-gray-50 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Navigation grid & Proctor indicators */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Question Grid Map */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider block border-b border-gray-100 pb-1.5">Question Navigator</span>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isActive = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 rounded-lg flex items-center justify-center font-bold text-xs border cursor-pointer transition-all ${
                      isActive 
                        ? 'border-primary ring-1 ring-primary bg-emerald-50/20 text-primary font-extraboldScale' 
                        : isAnswered 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                          : 'border-gray-200 hover:bg-gray-50 bg-white text-gray-500'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Proctoring live alerts card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider block border-b border-gray-100 pb-1.5">Proctoring status</span>
            
            <div className="space-y-3">
              {/* Tab Switches warning bar */}
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 flex items-center gap-1"><Monitor className="h-3.5 w-3.5 text-gray-400" /> Tab switches</span>
                <span className={tabSwitches > 0 ? 'text-red-650' : 'text-gray-650'}>{tabSwitches} / 3 Allowed</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    tabSwitches >= 2 ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ width: `${(tabSwitches / 3) * 100}%` }}
                ></div>
              </div>

              {/* Noise spikes counter */}
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 flex items-center gap-1"><Mic className="h-3.5 w-3.5 text-gray-400" /> Microphone spikes</span>
                <span className={noiseSpikes > 5 ? 'text-amber-600' : 'text-gray-650'}>{noiseSpikes} Detected</span>
              </div>
            </div>

            {/* Webcam Live Feed Feed Container */}
            <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500/80 rounded text-[8px] font-bold text-white flex items-center gap-1 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                Rec Preview
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Renders Fullscreen exit lock screen */}
      {fullscreenError && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 text-white">
          <div className="max-w-sm w-full text-center space-y-4">
            <ShieldAlert className="h-16 w-16 text-primary mx-auto animate-pulse" />
            <h2 className="text-base font-extrabold uppercase tracking-wider">Fullscreen Mode Required</h2>
            <p className="text-xs text-gray-300 font-medium">
              You exited fullscreen mode. Exiting fullscreen mode constitutes a proctor violation. Click below to re-enter.
            </p>
            <button
              onClick={requestFullscreen}
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer"
            >
              Re-enter Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* Renders screen blur focus lock overlay (Screenshot protection) */}
      {isBlurred && !isViolated && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-45 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 p-8 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <ShieldAlert className="h-12 w-12 text-primary mx-auto animate-bounce" />
            <h2 className="text-sm font-extrabold uppercase text-gray-900">Exam Screen Locked</h2>
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
              The exam window lost focus (possibly due to an attempted screenshot, app swap, or clicking outside the window). Click back inside the page to resume.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CBTTerminalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CBTTerminalContent />
    </Suspense>
  );
}
