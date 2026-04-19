import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { ModuleStatus } from '@/types/modules';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getGradeColor(grade: number | null): string {
  if (grade === null) return 'text-gray-500';
  if (grade <= 1.5) return 'text-green-600';
  if (grade <= 2.5) return 'text-blue-600';
  if (grade <= 3.5) return 'text-yellow-600';
  if (grade <= 4.0) return 'text-orange-600';
  return 'text-red-600';
}

export function getStatusColor(status: ModuleStatus): string {
  switch (status) {
    case 'passed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'enrolled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'planned':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'open':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

export function formatDateTime(date: string): string {
  try {
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de });
  } catch {
    return date;
  }
}

export function formatDate(date: string): string {
  try {
    return format(new Date(date), 'dd.MM.yyyy', { locale: de });
  } catch {
    return date;
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}
