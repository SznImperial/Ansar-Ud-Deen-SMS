'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { GraduationCap } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(`/${user.role === 'parent' ? 'student' : user.role}`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <GraduationCap className="h-16 w-16 text-primary" />
        <h1 className="text-xl font-bold text-primary-dark">Loading Ansar-Ud-Deen Portal...</h1>
        <div className="w-12 h-1.5 bg-accent rounded-full overflow-hidden">
          <div className="w-full h-full bg-primary origin-left animate-ping"></div>
        </div>
      </div>
    </div>
  );
}
