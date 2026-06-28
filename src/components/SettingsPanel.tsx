/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { isSupabaseConfigured, supabase, dbService } from '@/lib/db';
import { Shield, Key, CheckCircle2, AlertCircle, RefreshCw, User } from 'lucide-react';

export default function SettingsPanel() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          setError(error.message);
        } else {
          await dbService.markPasswordChanged(user.id);
          setSuccess('Your password has been successfully updated in your Supabase Auth registry!');
          setNewPassword('');
          setConfirmPassword('');
        }
      } else {
        // Mock mode success fallback
        await dbService.markPasswordChanged(user.id);
        setSuccess('Password updated successfully (Demo Mode Local Storage mock save)!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Info Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs text-xs font-semibold">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-gray-900">User Profile Registry Card</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Full Name</span>
            <span className="text-gray-900 font-bold text-sm block mt-0.5">{user.full_name}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Registered Email</span>
            <span className="text-gray-900 font-bold text-sm block mt-0.5">{user.email}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Access Group / Role</span>
            <span className="text-emerald-800 font-extrabold uppercase bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full text-[9px] mt-1.5 inline-block tracking-wider">
              {user.role}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Profile Account ID</span>
            <span className="text-gray-500 font-mono text-[10px] block mt-0.5">{user.id}</span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
          <Key className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-gray-900">Change Portal Password</h2>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-2.5 text-xs font-semibold">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-start gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" />
            <p className="leading-relaxed">{success}</p>
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[11px] font-bold text-gray-700">New Password</label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700">Confirm New Password</label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Key className="h-4 w-4" />
            )}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* Supabase Security Policy details */}
      <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl flex gap-3 text-xs leading-relaxed text-gray-600 font-medium">
        <Shield className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-gray-800 block">Security Policy Notice</span>
          <p>
            Ansar-Ud-Deen Schools enforces direct connection parameters on user accounts. Password changes take effect instantly on your next sign-in. Make sure you use a secure, complex password containing letters and numbers.
          </p>
        </div>
      </div>
    </div>
  );
}
