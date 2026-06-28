'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { dbService } from '@/lib/db';
import { SchoolNotification } from '@/lib/types';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Bell, 
  LogOut, 
  UserCheck, 
  FileText,
  User as UserIcon,
  Menu,
  X,
  Settings,
  Sun,
  Moon,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

import { useTheme } from '@/components/ThemeWrapper';

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      try {
        const notifs = await dbService.getNotifications();
        
        // Filter notifications that match the audience scope
        let audienceNotifs = notifs;
        
        if (user.role === 'student' || user.role === 'parent') {
          const stdList = await dbService.getStudents();
          let studentIds: string[] = [];
          let classIds: string[] = [];
          
          if (user.role === 'student') {
            const match = stdList.filter(s => s.profile_id === user.id);
            studentIds = match.map(s => s.id);
            classIds = match.map(s => s.class_id || '').filter(Boolean);
          } else {
            const match = stdList.filter(s => s.parent_email?.toLowerCase() === user.email.toLowerCase());
            studentIds = match.map(s => s.id);
            classIds = match.map(s => s.class_id || '').filter(Boolean);
          }
          
          audienceNotifs = notifs.filter(n => 
            n.audience_type === 'all' ||
            (n.audience_type === 'class' && classIds.includes(n.audience_id || '')) ||
            (n.audience_type === 'student' && studentIds.includes(n.audience_id || ''))
          );
        } else if (user.role === 'teacher') {
          audienceNotifs = notifs.filter(n => 
            n.audience_type === 'all' || 
            n.created_by === user.id
          );
        }

        const readKey = `aud_read_notifs_${user.id}`;
        const readIds = JSON.parse(localStorage.getItem(readKey) || '[]');
        const unread = audienceNotifs.filter(n => !readIds.includes(n.id)).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error(err);
      }
    }
    
    loadNotifications();

    const handleUpdate = () => loadNotifications();
    window.addEventListener('aud_notifications_read', handleUpdate);
    return () => {
      window.removeEventListener('aud_notifications_read', handleUpdate);
    };
  }, [user, pathname]);

  if (!user) return null;

  const adminLinks = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Students & Staff', href: '/admin/users', icon: Users },
    { label: 'Classes & Subjects', href: '/admin/curriculum', icon: BookOpen },
    { label: 'Timetable Builder', href: '/admin/timetable', icon: Calendar },
    { label: 'Fee Records', href: '/admin/fees', icon: CreditCard },
    { label: 'Broadsheet', href: '/admin/broadsheet', icon: Award },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    { label: 'Portal Settings', href: '/admin/settings', icon: Settings },
  ];

  const teacherLinks = [
    { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { label: 'Assignments', href: '/teacher/assignments', icon: BookOpen },
    { label: 'Mark Attendance', href: '/teacher/attendance', icon: UserCheck },
    { label: 'Grade Entry', href: '/teacher/grades', icon: FileText },
    { label: 'My Timetable', href: '/teacher/timetable', icon: Calendar },
    { label: 'Portal Settings', href: '/teacher/settings', icon: Settings },
  ];

  const studentLinks = [
    { label: 'My Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'Assignments', href: '/student/assignments', icon: BookOpen },
    { label: 'Report Card', href: '/student/grades', icon: FileText },
    { label: 'Attendance Log', href: '/student/attendance', icon: UserCheck },
    { label: 'Fee Status', href: '/student/fees', icon: CreditCard },
    { label: 'Notice Board', href: '/student/notifications', icon: Bell },
    { label: 'Portal Settings', href: '/student/settings', icon: Settings },
  ];


  let links = adminLinks;
  if (user.role === 'teacher') links = teacherLinks;
  if (user.role === 'student' || user.role === 'parent') links = studentLinks;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40';
      case 'teacher': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40';
      case 'student': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40';
      case 'parent': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-750';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 md:flex-row">
      {/* Mobile Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-bold text-sm text-gray-900 uppercase tracking-tight">Ansar-Ud-Deen Portal</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen shrink-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Header branding */}
          <div className="p-6 border-b border-gray-200 flex items-center gap-3">
            <GraduationCap className="h-9 w-9 text-primary shrink-0" />
            <div>
              <h1 className="font-extrabold text-sm text-gray-900 uppercase tracking-tight leading-none">Ansar-Ud-Deen</h1>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-1">Primary & Secondary</p>
            </div>
          </div>

          {/* User profile summary */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-base border border-primary/20 uppercase">
                {user.full_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate leading-tight">{user.full_name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Links list */}
          <nav className="p-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== `/${user.role}`);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all
                    ${isActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <span>{link.label}</span>
                  {link.label === 'Notifications' && unreadCount > 0 && (
                    <span className={`ml-auto text-[11px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                      {unreadCount}
                    </span>
                  )}
                  {link.label === 'Notice Board' && unreadCount > 0 && (
                    <span className="ml-auto text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-red-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-gray-200 space-y-1.5">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            {isDarkMode ? (
              <>
                <Sun className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 shrink-0 text-indigo-500" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen relative">
        {/* Top desktop sub-header */}
        <header className="hidden md:flex bg-white border-b border-gray-200 px-8 py-4 items-center justify-between sticky top-0 z-40 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Welcome back, {user.full_name.split(' ')[0]}
            </h2>
            <p className="text-xs text-gray-500">
              Managing Ansar-Ud-Deen Portal ({user.role === 'admin' ? 'Primary & Secondary' : 'Personal Dashboard'})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="relative">
              <span className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-sm text-gray-700 uppercase border border-gray-200">
                {user.full_name.slice(0,2)}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
      
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}
    </div>
  );
}
