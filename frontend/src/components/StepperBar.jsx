// StepperBar.jsx — Horizontal stepper for interview/ayurveda flows
import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * @param {string[]} steps — array of step labels
 * @param {number} current — 0-based index of current step
 */
export default function StepperBar({ steps = [], current = 0 }) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const upcoming = i > current;

          return (
            <li key={i} className={clsx('flex items-center', i < steps.length - 1 && 'flex-1')}>
              {/* Circle + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                    done && 'bg-brand border-brand text-white',
                    active && 'bg-white border-brand text-brand ring-4 ring-mint-200',
                    upcoming && 'bg-white border-surface-border text-gray-400'
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={clsx(
                    'text-[11px] font-medium text-center max-w-[70px] leading-tight hidden sm:block',
                    active && 'text-brand font-bold',
                    done && 'text-brand',
                    upcoming && 'text-gray-400'
                  )}
                >
                  {step}
                </span>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 mx-2 mt-[-16px] transition-all',
                    i < current ? 'bg-brand' : 'bg-surface-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
