'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import * as T from '@/lib/types';
import { CreditCard, Search, Plus, Filter, Save, AlertCircle } from 'lucide-react';

export default function FeeManagementPage() {
  const [students, setStudents] = useState<T.Student[]>([]);
  const [classes, setClasses] = useState<T.Class[]>([]);
  const [fees, setFees] = useState<T.FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');

  // Edit / Input Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<T.Student | null>(null);

  // Form Fields
  const [term, setTerm] = useState<T.FeeRecord['term']>('1st Term');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [amountOwed, setAmountOwed] = useState(120000);
  const [amountPaid, setAmountPaid] = useState(0);

  // Class fee allocation states
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocClassId, setAllocClassId] = useState('');
  const [allocTerm, setAllocTerm] = useState<'1st Term' | '2nd Term' | '3rd Term'>('1st Term');
  const [allocAcademicYear, setAllocAcademicYear] = useState('2025/2026');
  const [allocAmount, setAllocAmount] = useState(120000);
  const [allocating, setAllocating] = useState(false);
  const [allocModalError, setAllocModalError] = useState('');
  const [allocSuccessMessage, setAllocSuccessMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [stdList, clsList, feeList] = await Promise.all([
        dbService.getStudents(),
        dbService.getClasses(),
        dbService.getFees()
      ]);
      setStudents(stdList);
      setClasses(clsList);
      setFees(feeList);
      if (clsList.length > 0 && !allocClassId) {
        setAllocClassId(clsList[0].id);
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

  const handleOpenPaymentModal = (student: T.Student) => {
    setSelectedStudent(student);
    
    // Find existing fee record for student if any
    const existing = fees.find(f => f.student_id === student.id && f.term === term && f.academic_year === academicYear);
    if (existing) {
      setAmountOwed(existing.amount_owed);
      setAmountPaid(existing.amount_paid);
    } else {
      // Set default depending on school level
      const cls = classes.find(c => c.id === student.class_id);
      const isSecondary = cls?.level === 'secondary';
      setAmountOwed(isSecondary ? 120000 : 80000);
      setAmountPaid(0);
    }
    
    setShowModal(true);
  };

  // Triggered when term or academic year changes to fetch active records for modal
  useEffect(() => {
    if (selectedStudent) {
      const existing = fees.find(f => f.student_id === selectedStudent.id && f.term === term && f.academic_year === academicYear);
      if (existing) {
        setAmountOwed(existing.amount_owed);
        setAmountPaid(existing.amount_paid);
      } else {
        const cls = classes.find(c => c.id === selectedStudent.class_id);
        const isSecondary = cls?.level === 'secondary';
        setAmountOwed(isSecondary ? 120000 : 80000);
        setAmountPaid(0);
      }
    }
  }, [term, academicYear, selectedStudent, fees, classes]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (amountPaid > amountOwed) {
      alert('Paid amount cannot exceed amount owed.');
      return;
    }

    let status: T.FeeRecord['status'] = 'unpaid';
    if (amountPaid === amountOwed) status = 'paid';
    else if (amountPaid > 0) status = 'partial';

    try {
      await dbService.saveFeeRecord({
        student_id: selectedStudent.id,
        term,
        academic_year: academicYear,
        amount_owed: Number(amountOwed),
        amount_paid: Number(amountPaid),
        status
      });
      setShowModal(false);
      setSelectedStudent(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocateFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocClassId || !allocTerm || !allocAcademicYear || !allocAmount) return;

    setAllocating(true);
    setAllocModalError('');
    setAllocSuccessMessage('');
    try {
      const billedCount = await dbService.allocateClassFees(
        allocClassId,
        allocTerm,
        allocAcademicYear,
        Number(allocAmount)
      );

      const clsName = classes.find(c => c.id === allocClassId)?.name || 'Class';
      setAllocSuccessMessage(`Successfully billed ₦${Number(allocAmount).toLocaleString()} to ${billedCount} students in ${clsName}!`);
      loadData();
    } catch (err: any) {
      console.error(err);
      setAllocModalError(err.message || 'An error occurred during billing allocation.');
    } finally {
      setAllocating(false);
    }
  };

  // Filter students based on selection
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.admission_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassId === 'all' || s.class_id === selectedClassId;
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate totals
  const totalOutstanding = fees.reduce((sum, f) => sum + (f.amount_owed - f.amount_paid), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tuition & Fee Records</h1>
            <p className="text-sm text-gray-500 mt-1">Record student payments, track outstanding balances, and print receipt statuses.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              onClick={() => {
                setAllocModalError('');
                setAllocSuccessMessage('');
                setAllocAmount(120000);
                if (classes.length > 0) setAllocClassId(classes[0].id);
                setShowAllocModal(true);
              }}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Allocate Class Bill</span>
            </button>
            <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold text-red-700 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Outstanding Balance: ₦{totalOutstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {allocSuccessMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-lg text-xs font-bold flex items-center gap-2">
            <span>✓ {allocSuccessMessage}</span>
          </div>
        )}

        {/* Filters Controls */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search student or admission no..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Class filter */}
            <div className="relative w-full sm:w-48">
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold text-gray-700"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-500">Showing {filteredStudents.length} students</span>
        </div>

        {/* Ledger Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                  <th className="p-4">Admission No</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Owed (Term)</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Outstanding</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">No student matching filter criteria.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    // Get student fee record for the active term/year context
                    const record = fees.find(f => f.student_id === student.id && f.term === term && f.academic_year === academicYear);
                    const owed = record ? record.amount_owed : 0;
                    const paid = record ? record.amount_paid : 0;
                    const balance = owed - paid;
                    const status = record ? record.status : 'unpaid';

                    const getStatusColor = (st: T.FeeRecord['status']) => {
                      switch (st) {
                        case 'paid': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
                        case 'partial': return 'bg-amber-50 text-amber-800 border-amber-100';
                        case 'unpaid': return 'bg-red-50 text-red-800 border-red-100';
                        default: return 'bg-gray-50 text-gray-800 border-gray-100';
                      }
                    };

                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors font-medium">
                        <td className="p-4 font-bold text-gray-900">{student.admission_no}</td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{student.full_name}</div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                            {classes.find(c => c.id === student.class_id)?.name}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          {record ? `₦${owed.toLocaleString()}` : '—'}
                          <span className="text-[10px] font-normal text-gray-400 block mt-0.5">{term}</span>
                        </td>
                        <td className="p-4 font-bold text-emerald-700">
                          {record ? `₦${paid.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-4 font-bold text-red-600">
                          {record ? `₦${balance.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold border text-[9px] uppercase tracking-wider ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenPaymentModal(student)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-150 hover:bg-emerald-100 rounded-lg font-bold cursor-pointer transition-colors"
                          >
                            Update Ledger
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

        {/* Ledgers Update Modal */}
        {showModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full overflow-hidden border shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-extrabold text-gray-900">Record Fee Ledger</h2>
                </div>
                <button onClick={() => { setShowModal(false); setSelectedStudent(null); }} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
              </div>
              <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-lg">
                  <div className="font-bold text-gray-900 text-sm">{selectedStudent.full_name}</div>
                  <div className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                    Class: {classes.find(c => c.id === selectedStudent.class_id)?.name} | Admission: {selectedStudent.admission_no}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">Academic Year</label>
                    <input
                      type="text"
                      required
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">Term Session</label>
                    <select
                      value={term}
                      onChange={e => setTerm(e.target.value as any)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">Amount Owed (₦)</label>
                    <input
                      type="number"
                      required
                      value={amountOwed}
                      onChange={e => setAmountOwed(Number(e.target.value))}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">Amount Paid (₦)</label>
                    <input
                      type="number"
                      required
                      value={amountPaid}
                      onChange={e => setAmountPaid(Number(e.target.value))}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="p-3 bg-red-50/50 border border-red-150 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-gray-700">Outstanding Balance:</span>
                  <span className="font-extrabold text-red-600 text-sm">₦{(amountOwed - amountPaid).toLocaleString()}</span>
                </div>

                <div className="pt-4 border-t border-gray-150 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); setSelectedStudent(null); }} 
                    className="px-4 py-2 border rounded-lg font-bold text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold cursor-pointer"
                  >
                    Save Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Allocate Class Bill Modal */}
        {showAllocModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full overflow-hidden border shadow-lg animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-base font-extrabold text-gray-900">Allocate Class Bill</h2>
                <button 
                  onClick={() => setShowAllocModal(false)} 
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAllocateFees} className="p-6 space-y-4">
                {allocModalError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-[11px]">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{allocModalError}</span>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-800 text-[11px] font-semibold leading-relaxed">
                  💡 This operation will generate outstanding tuition bills for all students currently registered in the selected class who have not already been billed for this term and year.
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700">Target Class</label>
                  <select
                    required
                    value={allocClassId}
                    onChange={e => setAllocClassId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white font-bold text-gray-950 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Session Year</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026/2027"
                      value={allocAcademicYear}
                      onChange={e => setAllocAcademicYear(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white font-bold text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Term</label>
                    <select
                      value={allocTerm}
                      onChange={e => setAllocTerm(e.target.value as any)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white font-bold text-gray-950 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700">Fee Amount (₦)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={allocAmount}
                    onChange={e => setAllocAmount(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white font-extrabold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="pt-4 border-t border-gray-150 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAllocModal(false)} 
                    className="px-4 py-2 border rounded-lg font-bold text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={allocating}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white rounded-lg font-bold cursor-pointer transition-colors"
                  >
                    {allocating ? 'Allocating...' : 'Allocate Fees'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
