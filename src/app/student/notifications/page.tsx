'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { Bell, Volume2, Calendar, Shield, Users, User } from 'lucide-react';

export default function NoticeBoardPage() {
  const { user } = useAuth();

  // Child switcher (for parents)
  const [myStudents, setMyStudents] = useState<T.Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<T.Student | null>(null);

  const [notifs, setNotifs] = useState<T.SchoolNotification[]>([]);
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [loading, setLoading] = useState(true);

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
          setActiveStudent(mine[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadIdentity();
  }, [user]);

  useEffect(() => {
    const currentStudent = activeStudent;
    if (!currentStudent) {
      if (myStudents.length === 0) setLoading(false);
      return;
    }
    const studentId = currentStudent.id;
    const classId = currentStudent.class_id;

    async function loadNoticeBoard() {
      setLoading(true);
      try {
        const [clsList, notifList] = await Promise.all([
          dbService.getClasses(),
          dbService.getNotifications()
        ]);
        setClasses(clsList);

        // Filter notifications based on targets
        const filtered = notifList.filter(n => 
          n.audience_type === 'all' || 
          (n.audience_type === 'class' && n.audience_id === classId) ||
          (n.audience_type === 'student' && n.audience_id === studentId)
        );
        setNotifs(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadNoticeBoard();
  }, [activeStudent, myStudents]);

  useEffect(() => {
    if (notifs.length > 0 && user) {
      const readKey = `aud_read_notifs_${user.id}`;
      const readIds = JSON.parse(localStorage.getItem(readKey) || '[]');
      let updated = false;
      notifs.forEach(n => {
        if (!readIds.includes(n.id)) {
          readIds.push(n.id);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(readKey, JSON.stringify(readIds));
        window.dispatchEvent(new Event('aud_notifications_read'));
      }
    }
  }, [notifs, user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const getAudienceBadgeColor = (type: string) => {
    switch (type) {
      case 'all': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'class': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'student': return 'bg-purple-50 text-purple-800 border-purple-100';
      default: return 'bg-gray-50 text-gray-800 border-gray-100';
    }
  };

  const getAudienceLabel = (type: string, id?: string) => {
    if (type === 'all') return 'School Announcement';
    if (type === 'class') {
      const cls = classes.find(c => c.id === id);
      return cls ? `Class notice: ${cls.name}` : 'Class Announcement';
    }
    return 'Private Bulletin';
  };

  const getAudienceIcon = (type: string) => {
    switch (type) {
      case 'all': return Shield;
      case 'class': return Users;
      case 'student': return User;
      default: return Bell;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Notice Board</h1>
            <p className="text-sm text-gray-500 mt-1">Review school news letters, classroom bulletins, and administrative alerts.</p>
          </div>

          {user?.role === 'parent' && myStudents.length > 1 && (
            <select
              value={activeStudent?.id}
              onChange={e => {
                const match = myStudents.find(s => s.id === e.target.value);
                if (match) setActiveStudent(match);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-bold text-gray-950 shadow-sm"
            >
              {myStudents.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Bulletins Feed List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-150 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900">Active Notice Board Bulletins</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {notifs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs font-semibold">No notifications or bulletins posted.</div>
            ) : (
              notifs.map(notif => {
                const Icon = getAudienceIcon(notif.audience_type);
                return (
                  <div key={notif.id} className="p-6 hover:bg-gray-50/25 transition-colors flex gap-4 text-xs font-medium">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-extrabold text-gray-950 text-sm leading-tight truncate">{notif.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[9px] uppercase tracking-wider ${getAudienceBadgeColor(notif.audience_type)}`}>
                          {getAudienceLabel(notif.audience_type, notif.audience_id)}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed font-semibold">{notif.content}</p>
                      <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] pt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Published on {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
