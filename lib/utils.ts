import { Ionicons } from '@expo/vector-icons';
import { HabitIcon } from '../types/habit';

const iconMap: Record<HabitIcon, keyof typeof Ionicons.glyphMap> = {
  leaf: 'leaf-outline',
  water: 'water-outline',
  book: 'book-outline',
  fitness: 'barbell-outline',
  moon: 'moon-outline',
  sunny: 'sunny-outline',
  heart: 'heart-outline',
  walk: 'walk-outline',
};

export function getHabitIconName(icon: HabitIcon): keyof typeof Ionicons.glyphMap {
  return iconMap[icon];
}

export function formatTimeOfDay(timeOfDay: string): string {
  return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
}

export function formatReminderTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatDateHeader(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(from = new Date()): string {
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow);
}
