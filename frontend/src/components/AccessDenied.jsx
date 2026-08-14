import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-slate-500">
      <ShieldAlert className="w-10 h-10 mb-3 text-slate-400" />
      <p className="font-medium text-slate-700">You don't have access to this page</p>
      <p className="text-sm">Ask a farm admin if you think this is a mistake.</p>
    </div>
  );
}
