'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import * as T from '@/lib/types';
import { CreditCard, AlertCircle, Info, FileText } from 'lucide-react';

export default function StudentFeesPage() {
  const { user } = useAuth();

  // Child switcher (for parents)
  const [myStudents, setMyStudents] = useState<T.Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<T.Student | null>(null);

  const [fees, setFees] = useState<T.FeeRecord[]>([]);
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

    async function loadFeesData() {
      setLoading(true);
      try {
        const feeList = await dbService.getFees();
        const filtered = feeList.filter(f => f.student_id === studentId);
        setFees(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFeesData();
  }, [activeStudent, myStudents]);

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
  const totalOwed = fees.reduce((sum, f) => sum + Number(f.amount_owed), 0);
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.amount_paid), 0);
  const totalOutstanding = totalOwed - totalPaid;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tuition & Financial Invoices</h1>
            <p className="text-sm text-gray-500 mt-1">Review term invoices, historical receipts, and outstanding tuition balances.</p>
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

        {fees.length === 0 ? (
          <div className="bg-white border p-8 rounded-xl text-center text-xs text-gray-500">
            No fee invoices recorded in system database.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Financial ledger details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Billed Fees</span>
                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">₦{totalOwed.toLocaleString()}</span>
              </div>
              <div className="bg-white border border-emerald-100 p-5 rounded-xl shadow-xs text-emerald-700">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Paid Tuition</span>
                <span className="text-2xl font-extrabold mt-1 block">₦{totalPaid.toLocaleString()}</span>
              </div>
              <div className={`p-5 rounded-xl shadow-xs border ${totalOutstanding > 0 ? 'bg-red-50 text-red-700 border-red-150' : 'bg-emerald-50 text-emerald-700 border-emerald-150'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider block">Total Outstanding Balance</span>
                <span className="text-2xl font-extrabold mt-1 block">₦{totalOutstanding.toLocaleString()}</span>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-150 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Term invoices</h3>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 font-bold text-gray-700">
                      <th className="p-4">Academic Year</th>
                      <th className="p-4">Term Session</th>
                      <th className="p-4">Amount Owed</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4">Remaining Balance</th>
                      <th className="p-4">Payment Status</th>
                      <th className="p-4">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {fees.map(f => {
                      const balance = f.amount_owed - f.amount_paid;

                      const getStatusBadge = (st: T.FeeRecord['status']) => {
                        switch (st) {
                          case 'paid':
                            return 'bg-emerald-50 text-emerald-800 border-emerald-100';
                          case 'partial':
                            return 'bg-amber-50 text-amber-800 border-amber-100';
                          case 'unpaid':
                            return 'bg-red-50 text-red-800 border-red-100';
                          default:
                            return 'bg-gray-50 text-gray-800 border-gray-100';
                        }
                      };

                      return (
                        <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{f.academic_year}</td>
                          <td className="p-4 font-bold text-gray-700">{f.term}</td>
                          <td className="p-4 font-bold">₦{f.amount_owed.toLocaleString()}</td>
                          <td className="p-4 font-bold text-emerald-700">₦{f.amount_paid.toLocaleString()}</td>
                          <td className="p-4 font-bold text-red-600">₦{balance.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full border tracking-wide ${getStatusBadge(f.status)}`}>
                              {f.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400 font-semibold">{new Date(f.updated_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note banner detailing manual payments */}
            <div className="bg-emerald-50/50 border border-emerald-150 p-4 rounded-xl flex gap-3 text-xs">
              <Info className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-emerald-800">
                <span className="font-extrabold block">Bursary Notice: Fee Payment Policy</span>
                <p className="leading-relaxed font-semibold">
                  Ansar-Ud-Deen Schools runs a manual fee verification policy. All school fees and tuition must be paid via bank draft or bank transfer directly to the school accounts. Please submit physical proof of payment (receipt/bank teller) to the school bursar desk to update your invoice ledger online.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
