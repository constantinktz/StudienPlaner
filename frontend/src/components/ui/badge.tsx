import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variant === 'default' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        variant === 'secondary' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        variant === 'destructive' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        variant === 'outline' && 'border border-gray-300 text-gray-700',
        className
      )}
      {...props}
    />
  );
}
