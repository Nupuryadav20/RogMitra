// Logo.jsx — RogMitra logo with green cross-leaf icon
import React from 'react';
import { HeartPulse } from 'lucide-react';

export default function Logo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2.5">
      {/* Green cross-leaf icon */}
      <div
        className={`${s.icon} rounded-xl bg-brand flex items-center justify-center text-white shadow-button-green flex-shrink-0`}
      >
        <HeartPulse className="w-5 h-5" />
      </div>
      {showText && (
        <div>
          <div className={`font-extrabold tracking-tight text-gray-900 leading-tight ${s.text}`}>
            RogMitra
          </div>
          <div className={`text-gray-500 ${s.sub} leading-none`}>
            AI Case-Taking Platform
          </div>
        </div>
      )}
    </div>
  );
}
