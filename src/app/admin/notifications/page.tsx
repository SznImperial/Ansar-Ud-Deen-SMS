'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { Bell, Volume2, User, Users, Globe, Plus, Trash2, Send } from 'lucide-react';

export default function NotificationsManagementPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [students, setStudents] = useState<T.Student[]>([]);
  const [notifs, setNotifs] = useState<T.SchoolNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audienceType, setAudienceType] = useState<'all' | 'class' | 'student'>('all');
  const [audienceId, setAudienceId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsList, stdList, notifList] = await Promise.all([
        dbService.getClasses(),
        dbService.getStudents(),
        dbService.getNotifications()
      ]);
      setClasses(clsList);
      setStudents(stdList);
      setNotifs(notifList);

      if (clsList.length > 0) setAudienceId(clsList[0].id);
      else if (stdList.length > 0) setAudienceId(stdList[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Update default audienceId when type changes
  useEffect(() => {
    if (audienceType === 'class' && classes.length > 0) {
      setAudienceId(classes[0].id);
    } else if (audienceType === 'student' && students.length > 0) {
      setAudienceId(students[0].id);
    } else {
      setAudienceId('');
    }
  }, [audienceType, classes, students]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      await dbService.addNotification(
        title,
        content,
        audienceType,
        audienceType === 'all' ? undefined : audienceId,
        user?.id
      );
      
      // Reset
      setTitle('');
      setContent('');
      setAudienceType('all');
      
      loadData();
    } catch (err) {
      console.error(err);
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

  const getAudienceLabel = (type: string, id?: string) => {
    switch (type) {
      case 'all': return 'All School';
      case 'class': 
        const cls = classes.find(c => c.id === id);
        return cls ? `Class: ${cls.name}` : 'Unknown Class';
      case 'student':
        const std = students.find(s => s.id === id);
        return std ? `Student: ${std.full_name}` : 'Unknown Student';
      default: return 'General';
    }
  };

  const getAudienceIcon = (type: string) => {
    switch (type) {
      case 'all': return Globe;
      case 'class': return Users;
      case 'student': return User;
      default: return Bell;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Announcements Broadcast</h1>
          <p className="text-sm text-gray-500 mt-1">Publish bulletins to the entire school, specific classroom grades, or individual parents.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Announcement Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Send className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-gray-900">Publish Announcement</h2>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700">Bulletin Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Third Term Examination Date"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700">Audience Scope</label>
                <select
                  value={audienceType}
                  onChange={e => setAudienceType(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white font-semibold text-gray-700"
                >
                  <option value="all">Broad Public (All Portals)</option>
                  <option value="class">Target Class Room</option>
                  <option value="student">Individual Student/Parent</option>
                </select>
              </div>

              {/* Conditional dropdown depending on audienceType */}
              {audienceType === 'class' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Select Target Class</label>
                  <select
                    value={audienceId}
                    onChange={e => setAudienceId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
              )}

              {audienceType === 'student' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Select Target Student</label>
                  <select
                    value={audienceId}
                    onChange={e => setAudienceId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-700">Bulletin Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the message body here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer transition-colors"
              >
                Send Broadcast
              </button>
            </form>
          </div>

          {/* Bulletins Feed List */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-150 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900">Broadcast Bulletins Ledger</h2>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">No notifications sent. Publish a message on the left panel.</div>
              ) : (
                notifs.map(notif => {
                  const Icon = getAudienceIcon(notif.audience_type);
                  return (
                    <div key={notif.id} className="p-5 hover:bg-gray-50/50 transition-colors flex gap-4 text-xs">
                      <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-extrabold text-gray-900 leading-tight truncate">{notif.title}</h3>
                          <span className="text-[10px] font-bold text-gray-400 shrink-0 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-md border border-gray-150 uppercase tracking-wider">
                            {getAudienceLabel(notif.audience_type, notif.audience_id)}
                          </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed font-medium">{notif.content}</p>
                        <p className="text-[10px] text-gray-400 font-bold">
                          Published on {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
