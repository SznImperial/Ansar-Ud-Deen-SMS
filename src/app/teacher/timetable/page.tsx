'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const [timetableSlots, setTimetableSlots] = useState<T.TimetableSlot[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [csList, clsList, subList, slotsList] = await Promise.all([
          dbService.getClassSubjects(),
          dbService.getClasses(),
          dbService.getSubjects(),
          dbService.getTimetableSlots()
        ]);

        setClasses(clsList);
        setSubjects(subList);
        setClassSubjects(csList);

        // Filter timetable slots for my allocations
        const mine = csList.filter(cs => cs.teacher_id === user.id);
        const myAllocationIds = mine.map(m => m.id);
        const mySlots = slotsList.filter(slot => myAllocationIds.includes(slot.class_subject_id));
        
        setTimetableSlots(mySlots);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const days: T.TimetableSlot['day_of_week'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Teaching Timetable</h1>
          <p className="text-sm text-gray-500 mt-1">Review scheduled teaching slots, periods, and classroom locations.</p>
        </div>

        {/* Timetable schedule grid */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-150 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900">Weekly Schedule</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {days.map(day => {
              const daySlots = timetableSlots
                .filter(s => s.day_of_week === day)
                .sort((a,b) => a.start_time.localeCompare(b.start_time));
              
              return (
                <div key={day} className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center text-xs">
                  <div className="w-24 shrink-0">
                    <span className="text-xs font-extrabold text-primary uppercase tracking-wider">{day}</span>
                  </div>
                  
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {daySlots.length === 0 ? (
                      <span className="text-[11px] text-gray-400 font-semibold italic">No lectures scheduled.</span>
                    ) : (
                      daySlots.map(slot => {
                        const cs = classSubjects.find(x => x.id === slot.class_subject_id);
                        const cls = classes.find(c => c.id === cs?.class_id);
                        const sub = subjects.find(s => s.id === cs?.subject_id);
                        
                        return (
                          <div key={slot.id} className="p-3.5 border border-gray-150 rounded-lg bg-gray-50/50 flex flex-col space-y-2">
                            <div>
                              <span className="px-2 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full font-bold uppercase text-[9px]">
                                {cls ? cls.name : 'Unknown Class'}
                              </span>
                              <h3 className="font-extrabold text-gray-950 mt-1.5 leading-tight">{sub ? sub.name : 'Subject'}</h3>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Code: {sub?.code}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 font-bold pt-1.5 border-t border-gray-200/50">
                              <Clock className="h-3 w-3" />
                              <span>{slot.start_time} - {slot.end_time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
                              <MapPin className="h-3 w-3 text-primary" />
                              <span>{slot.room}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
