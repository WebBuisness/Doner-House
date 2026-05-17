import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the current time in Lebanon (Asia/Beirut)
 * Regardless of the user's local timezone.
 */
export function getLebanonTime() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Beirut',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date());
}

/**
 * Formats a date string or object to Lebanon time
 */
export function formatToLebanonTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Beirut',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}
