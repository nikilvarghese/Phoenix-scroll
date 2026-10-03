import React from 'react';
import { Check } from 'lucide-react';

interface PasswordRequirementsChecklistProps {
  password?: string;
}

export const isPasswordStrong = (password?: string): boolean => {
  if (!password) return false;
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

export const PasswordRequirementsChecklist: React.FC<PasswordRequirementsChecklistProps> = ({
  password = '',
}) => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const requirements = [
    { label: 'Min 8 characters', met: hasMinLength },
    { label: 'One uppercase letter', met: hasUppercase },
    { label: 'One lowercase letter', met: hasLowercase },
    { label: 'One number', met: hasNumber },
  ];

  return (
    <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-3.5 space-y-2 text-xs">
      <span className="block font-semibold text-stone-600 font-sans">
        Password must contain:
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 transition-colors duration-200 ${
              req.met ? 'text-emerald-700 font-semibold' : 'text-stone-400'
            }`}
          >
            {req.met ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 stroke-[2.5]" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 flex-shrink-0" />
            )}
            <span className="font-sans text-[11px] sm:text-xs">{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
