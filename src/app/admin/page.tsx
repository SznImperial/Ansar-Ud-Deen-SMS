'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import * as T from '@/lib/types';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  Plus, 
  Calendar, 
  Volume2, 
  TrendingUp 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [students, setStudents] = useState<T.Student[]>([]);
  const [teachers, setTeachers] = useState<T.Teacher[]>([]);
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [fees, setFees] = useState<T.FeeRecord[]>([]);
  const [notifs, setNotifs] = useState<T.SchoolNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [stdList, tchrList, clsList, feeList, notifList] = await Promise.all([
          dbService.getStudents(),
          dbService.getTeachers(),
          dbService.getClasses(),
          dbService.getFees(),
          dbService.getNotifications()
        ]);
        setStudents(stdList);
        setTeachers(tchrList);
        setClasses(clsList);
        setFees(feeList);
        setNotifs(notifList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate Fee Statistics
  const totalOwed = fees.reduce((sum, f) => sum + Number(f.amount_owed), 0);
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.amount_paid), 0);
  const collectionRate = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;
  const outstandingFees = totalOwed - totalPaid;

  // Level split
  const primaryClasses = classes.filter(c => c.level === 'primary').length;
  const secondaryClasses = classes.filter(c => c.level === 'secondary').length;

  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      description: `${students.filter(s => {
        const cls = classes.find(c => c.id === s.class_id);
        return cls?.level === 'secondary';
      }).length} Secondary, ${students.filter(s => {
        const cls = classes.find(c => c.id === s.class_id);
        return cls?.level === 'primary';
      }).length} Primary`,
      icon: GraduationCap,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/50',
    },
    {
      title: 'Total Staff',
      value: teachers.length,
      description: 'Academic Teachers',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/50',
    },
    {
      title: 'Classes Setup',
      value: classes.length,
      description: `${primaryClasses} Primary, ${secondaryClasses} Secondary`,
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/25 dark:text-purple-400 dark:border-purple-900/50',
    },
    {
      title: 'Fee Collection',
      value: `₦${totalPaid.toLocaleString()}`,
      description: `${collectionRate.toFixed(1)}% collected (₦${outstandingFees.toLocaleString()} unpaid)`,
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-900/50',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">System Administration</h1>
            <p className="text-sm text-gray-600 mt-1">Supervising administrative metrics, courses, enrollment, and tuition fees.</p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/admin/users" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Register Student</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`bg-white border rounded-xl p-6 shadow-xs flex items-center justify-between`}>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.title}</span>
                  <h3 className="text-3xl font-extrabold text-gray-900 leading-none">{stat.value}</h3>
                  <p className="text-xs text-gray-500 font-semibold">{stat.description}</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${stat.color} shrink-0`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Notices */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="p-6 border-b border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold text-gray-900">Recent Notifications</h2>
                </div>
                <Link href="/admin/notifications" className="text-xs font-bold text-primary hover:underline">
                  Manage Notices
                </Link>
              </div>
              <div className="p-6 divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No announcements broadcasted yet.</p>
                ) : (
                  notifs.slice(0, 4).map((notif) => (
                    <div key={notif.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.content}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 shrink-0 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          Target: {notif.audience_type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 font-semibold">
                        Broadcast on {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Quick Actions Panel */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Quick Navigation</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link 
                  href="/admin/curriculum" 
                  className="bg-white border border-gray-200 p-3 rounded-lg text-center hover:border-primary hover:bg-emerald-50/20 transition-all text-xs font-bold text-gray-700"
                >
                  Configure Classes
                </Link>
                <Link 
                  href="/admin/timetable" 
                  className="bg-white border border-gray-200 p-3 rounded-lg text-center hover:border-primary hover:bg-emerald-50/20 transition-all text-xs font-bold text-gray-700"
                >
                  Timetable Builder
                </Link>
                <Link 
                  href="/admin/fees" 
                  className="bg-white border border-gray-200 p-3 rounded-lg text-center hover:border-primary hover:bg-emerald-50/20 transition-all text-xs font-bold text-gray-700"
                >
                  Update Fees
                </Link>
                <Link 
                  href="/admin/notifications" 
                  className="bg-white border border-gray-200 p-3 rounded-lg text-center hover:border-primary hover:bg-emerald-50/20 transition-all text-xs font-bold text-gray-700"
                >
                  Send Broadcast
                </Link>
              </div>
            </div>
          </div>

          {/* School Identity Card */}
          <div className="bg-gradient-to-br from-primary to-accent border border-primary-dark rounded-xl p-6 text-white shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-surface" />
                <span className="font-extrabold tracking-wide text-lg">ANSAR-UD-DEEN</span>
              </div>
              <h3 className="text-2xl font-bold leading-tight pt-2">Ansar-Ud-Deen Schools Administrative Portal</h3>
              <p className="text-xs text-surface/85 leading-relaxed">
                Use this dashboard to run central registrar and bursar tasks. You have authority to enroll students, hire and assign staff, build and allocate timetable slots, record tuition payments, and announce critical events.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Fee Collection Goal</span>
              </div>
              <span className="text-sm font-extrabold">{collectionRate.toFixed(0)}% Achieved</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
