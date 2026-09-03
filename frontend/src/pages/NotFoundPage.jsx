import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display">
        404 — Page Not Found
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
        The requested compliance route does not exist or has been relocated.
      </p>

      <Link to="/dashboard">
        <Button variant="primary" icon={ArrowLeft}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
