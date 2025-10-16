"use client";

import React from 'react';

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ id, checked = false, onCheckedChange }) => {
  return (
    <label htmlFor={id} className="inline-flex items-center cursor-pointer">
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      />
      <span className={`w-10 h-6 flex items-center bg-muted rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-border'}`}>
        <span className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </label>
  );
};

export default Switch;
