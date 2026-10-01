'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

const placementClasses = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
};

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: keyof typeof placementClasses;
  className?: string;
}

function Tooltip({ content, children, placement = 'top', className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-[700] whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md animate-in pointer-events-none',
            placementClasses[placement],
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { Tooltip };
