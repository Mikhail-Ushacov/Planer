import React, { type ReactNode } from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  required?: boolean;
  icon?: ReactNode;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  required = false, 
  icon, 
  placeholder 
}) => {
  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-3.5 text-stone-400">{icon}</div>}
        <input 
          type={type} 
          required={required} 
          value={value || ""}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className={`w-full py-3.5 pr-4 border border-stone-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-semibold bg-stone-50 focus:bg-white transition-all ${icon ? 'pl-11' : 'px-4'}`}
        />
      </div>
    </div>
  );
};