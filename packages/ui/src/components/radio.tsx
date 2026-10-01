import * as React from 'react';
import { cn } from '../lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
}

function RadioGroup({ name, options, value, onChange, label, className }: RadioGroupProps) {
  return (
    <fieldset className={cn('flex flex-col gap-2', className)}>
      {label && <legend className="text-sm font-medium text-foreground mb-1">{label}</legend>}
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'flex items-start gap-3 cursor-pointer',
            opt.disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <div className="relative flex h-4 w-4 shrink-0 items-center justify-center mt-0.5">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              disabled={opt.disabled}
              onChange={() => onChange?.(opt.value)}
              className={cn(
                'peer h-4 w-4 appearance-none rounded-full border border-input bg-transparent',
                'checked:border-primary',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed transition-colors cursor-pointer',
              )}
            />
            <span className="pointer-events-none absolute h-2 w-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-none">{opt.label}</span>
            {opt.description && (
              <span className="text-xs text-muted-foreground">{opt.description}</span>
            )}
          </div>
        </label>
      ))}
    </fieldset>
  );
}

export { RadioGroup };
