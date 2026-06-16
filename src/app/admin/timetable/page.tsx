'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import * as T from '@/lib/types';
import { Calendar, Plus, Trash2, Clock, MapPin } from 'lucide-react';

export default function TimetableBuilderPage() {
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [subjects, setSubjects] = useState<T.Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<T.ClassSubject[]>([]);
  const [teachers, setTeachers] = useState<T.Profile[]>([]);
  const [slots, setSlots] = useState<T.TimetableSlot[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [allocCsId, setAllocCsId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<T.TimetableSlot['day_of_week']>('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsList, subList, csList, profList, slotList] = await Promise.all([
        dbService.getClasses(),
        dbService.getSubjects(),
        dbService.getClassSubjects(),
        dbService.getProfiles(),
        dbService.getTimetableSlots()
      ]);
      setClasses(clsList);
      setSubjects(subList);
      setClassSubjects(csList);
      setTeachers(profList.filter(p => p.role === 'teacher'));
      setSlots(slotList);

      if (clsList.length > 0) {
        setSelectedClassId(clsList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter class subjects for form dropdown based on selectedClassId
  const currentClassSubjects = classSubjects.filter(cs => cs.class_id === selectedClassId);

  useEffect(() => {
    if (currentClassSubjects.length > 0) {
      setAllocCsId(currentClassSubjects[0].id);
    } else {
      setAllocCsId('');
    }
  }, [selectedClassId, classSubjects]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocCsId || !dayOfWeek || !startTime || !endTime || !room) return;

    if (startTime >= endTime) {
      alert('Start time must be before End time');
      return;
    }

    try {
      await dbService.addTimetableSlot({
        class_subject_id: allocCsId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        room
      });
      setRoom('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    try {
      await dbService.deleteTimetableSlot(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Group slots by class_subject_id class checks
  const filteredSlots = slots.filter(slot => {
    const cs = classSubjects.find(x => x.id === slot.class_subject_id);
    return cs && cs.class_id === selectedClassId;
  });

  const days: T.TimetableSlot['day_of_week'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Timetable & Schedule Planner</h1>
          <p className="text-sm text-gray-500 mt-1">Build daily class periods, assign subject locations, and structure student hours.</p>
        </div>

        {/* Class selector */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-700">Select Class to Manage:</span>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold text-gray-900"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
              ))}
            </select>
          </div>
          <span className="text-xs font-semibold text-gray-500">{filteredSlots.length} schedule periods</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Slot Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-gray-900">Add Time Slot</h2>
            </div>
            
            {currentClassSubjects.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-center text-xs text-amber-800 font-semibold">
                No mapped subjects found for this class. Go to Classes & Subjects to assign subjects first.
              </div>
            ) : (
              <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Mapped Class Subject</label>
                  <select
                    required
                    value={allocCsId}
                    onChange={e => setAllocCsId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {currentClassSubjects.map(cs => {
                      const sub = subjects.find(s => s.id === cs.subject_id);
                      const tchr = teachers.find(t => t.id === cs.teacher_id);
                      return (
                        <option key={cs.id} value={cs.id}>
                          {sub ? `${sub.name} (${sub.code})` : 'Unknown Subject'} - {tchr ? tchr.full_name : 'No Teacher'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Day of the Week</label>
                  <select
                    required
                    value={dayOfWeek}
                    onChange={e => setDayOfWeek(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {days.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">End Time</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700">Class Room / Lab</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Lab, Room 3"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Schedule Slot
                </button>
              </form>
            )}
          </div>

          {/* Timetable Grid View */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-150 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900">Weekly Scheduled Timetable</h2>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
              {days.map(day => {
                const daySlots = filteredSlots
                  .filter(s => s.day_of_week === day)
                  .sort((a,b) => a.start_time.localeCompare(b.start_time));
                
                return (
                  <div key={day} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="w-24 shrink-0">
                      <span className="text-xs font-extrabold text-primary uppercase tracking-wider">{day}</span>
                    </div>
                    
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {daySlots.length === 0 ? (
                        <span className="text-[11px] text-gray-400 font-semibold italic">No classes scheduled.</span>
                      ) : (
                        daySlots.map(slot => {
                          const cs = classSubjects.find(x => x.id === slot.class_subject_id);
                          const sub = subjects.find(s => s.id === cs?.subject_id);
                          const tchr = teachers.find(t => t.id === cs?.teacher_id);
                          
                          return (
                            <div key={slot.id} className="p-3 border rounded-lg bg-gray-50 flex items-start justify-between gap-3 text-[11px]">
                              <div className="space-y-1">
                                <div className="font-extrabold text-gray-900">{sub ? sub.name : 'Subject'} ({sub?.code})</div>
                                <div className="text-gray-500 font-bold flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  <span>{slot.start_time} - {slot.end_time}</span>
                                </div>
                                <div className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <MapPin className="h-3 w-3 text-primary" />
                                  <span>{slot.room}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold">
                                  Teacher: {tchr ? tchr.full_name : 'N/A'}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="text-gray-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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
      </div>
    </DashboardLayout>
  );
}
