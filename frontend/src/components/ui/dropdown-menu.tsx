import { type ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: ReactNode;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
  children: ReactNode;
  open: boolean;
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      {Array.isArray(children)
        ? children.map((child, i) => {
            if (i === 0) {
              return (
                <div key={i} onClick={() => setOpen((prev) => !prev)}>
                  {child}
                </div>
              );
            }
            if (i === 1) {
              return (
                <DropdownMenuContentInternal key={i} open={open} align="end">
                  {child}
                </DropdownMenuContentInternal>
              );
            }
            return child;
          })
        : children}
    </div>
  );
}

function DropdownMenuContentInternal({
  open,
  align = 'end',
  className,
  children,
  ...props
}: DropdownMenuContentProps) {
  if (!open) return null;
  return (
    <div
      className={cn(
        'absolute z-50 mt-1 min-w-[8rem] rounded-md border border-gray-200 bg-white p-1 shadow-md dark:border-gray-700 dark:bg-gray-900',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  return <>{children}</>;
}

export function DropdownMenuContent({ className, children, ...props }: Omit<DropdownMenuContentProps, 'open'>) {
  return <div className={cn('contents', className)} {...props}>{children}</div>;
}

export function DropdownMenuItem({ className, children, ...props }: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('my-1 h-px bg-gray-200 dark:bg-gray-700', className)} {...props} />;
}
