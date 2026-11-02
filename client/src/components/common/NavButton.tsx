import React, { type ReactNode } from 'react';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

export const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center px-5 py-3.5 rounded-2xl transition-all group relative cursor-pointer ${
        active 
          ? 'bg-linear-to-r from-amber-500 to-orange-500 text-white font-black shadow-md shadow-orange-500/25' 
          : 'text-stone-500 hover:bg-orange-50/60 hover:text-orange-600 font-bold'
      }`}
    >
      <span className={`mr-3.5 transition-transform ${active ? 'scale-105' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="text-sm tracking-tight">{label}</span>
      {active && <div className="ml-auto w-2 h-2 bg-white rounded-full shadow" />}
    </button>
  );
};