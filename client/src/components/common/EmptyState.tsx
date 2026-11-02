import React, { type ReactNode } from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  label: string;
  sublabel?: string;
  icon?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  label, 
  sublabel, 
  icon = <Search size={44}/> 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-orange-100 rounded-3xl p-6 text-center">
      <div className="w-20 h-20 bg-orange-50 text-orange-400 rounded-3xl flex items-center justify-center mb-4 border border-orange-100">
        {icon}
      </div>
      <p className="text-stone-800 font-black text-xl tracking-tight">{label}</p>
      {sublabel && <p className="text-stone-400 text-xs font-semibold mt-1 max-w-sm">{sublabel}</p>}
    </div>
  );
};