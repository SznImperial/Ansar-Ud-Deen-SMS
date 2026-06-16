'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsPanel from '@/components/SettingsPanel';

export default function AdminSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Portal Configuration & Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage administrative account profiles and change security credentials.</p>
        </div>
        <SettingsPanel />
      </div>
    </DashboardLayout>
  );
}
