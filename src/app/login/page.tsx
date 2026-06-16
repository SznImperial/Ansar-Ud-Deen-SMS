'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { isSupabaseConfigured } from '@/lib/db';
import { GraduationCap, User, Users, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';

import { useTheme } from '@/components/ThemeWrapper';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setSubmitting(true);
    
    // Pass password if Supabase is configured
    const success = await login(email, isSupabaseConfigured ? password : 'password123');
    if (!success) {
      setError(
        isSupabaseConfigured
          ? 'Invalid email or password. Please verify your Supabase credentials or verify your database setup.'
          : 'Invalid email address. Please check your credentials or use the Quick Demo Login below.'
      );
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setError('');
    setSubmitting(true);
    const success = await login(demoEmail, 'password123');
    if (!success) {
      setError('Failed to login. Please make sure your Supabase database has been seeded with seed.sql.');
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Teacher',
      name: 'Mrs. Folashade Adebayo',
      email: 'teacher.folade@aud.edu.ng',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50'
    },
    {
      role: 'Student',
      name: 'Kamil Yusuf',
      email: 'student.kamil@aud.edu.ng',
      icon: GraduationCap,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50'
    },
    {
      role: 'Parent',
      name: 'Mr. Yusuf Alao',
      email: 'parent.yusuf@aud.edu.ng',
      icon: User,
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 relative font-sans">
      {/* Floating Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 z-50 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        title="Toggle dark mode"
      >
        {isDarkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
      </button>
      {/* Left side panel - School branding */}
      <div className="md:w-1/2 bg-primary text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-20 rounded-full blur-3xl transform translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent opacity-10 rounded-full blur-3xl transform -translate-x-12 translate-y-12"></div>

        <div className="flex items-center gap-3 relative z-10">
          <GraduationCap className="h-10 w-10 text-surface" />
          <span className="font-bold text-xl tracking-wide">ANSAR-UD-DEEN SCHOOLS</span>
        </div>

        <div className="my-auto py-12 relative z-10 max-w-lg">
          <span className="px-3 py-1 bg-accent/40 text-xs rounded-full font-medium tracking-wide uppercase">
            School Management System
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-6 leading-tight">
            Nurturing Knowledge, Character & Faith
          </h1>
          <p className="text-surface/85 text-lg leading-relaxed">
            Welcome to the unified portal for Ansar-Ud-Deen Primary and Secondary Schools. Access grades, attendance, timetables, and school communications with ease.
          </p>
        </div>

        <div className="text-sm text-surface/70 relative z-10">
          © {new Date().getFullYear()} Ansar-Ud-Deen Schools. All Rights Reserved.
        </div>
      </div>

      {/* Right side panel - Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sign In</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your school-registered email to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={submitting}
                  className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 text-sm transition-colors"
                  placeholder="e.g. name@aud.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {isSupabaseConfigured && (
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    disabled={submitting}
                    className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 text-sm transition-colors"
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !email || (isSupabaseConfigured && !password)}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Quick Demo Section */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm font-medium">
              <span className="bg-gray-50 px-3 text-gray-500">Quick Demo Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.role}
                  onClick={() => handleQuickLogin(account.email)}
                  disabled={submitting}
                  className={`p-3 border rounded-xl flex flex-col items-start text-left cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-50 ${account.color}`}
                >
                  <div className="flex items-center gap-2 mb-1 w-full justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{account.role}</span>
                    <Icon className="h-4 w-4 opacity-80" />
                  </div>
                  <span className="text-sm font-bold text-gray-900 truncate w-full">{account.name}</span>
                  <span className="text-[11px] opacity-75 truncate w-full mt-0.5">{account.email}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center">
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              {isSupabaseConfigured ? (
                <span><span className="font-bold">Live Mode:</span> Connected to Supabase. Sign in using your registered email and password. (Demo profiles use <code>password123</code>).</span>
              ) : (
                <span><span className="font-bold">Demo Mode:</span> Supabase connection is currently in fallback mode. All logins will work using local storage preseeded databases.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
