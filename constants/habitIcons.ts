import { HabitIcon } from '../types/habit';

export const HABIT_ICONS: { id: HabitIcon; label: string }[] = [
  { id: 'leaf', label: 'Leaf' },
  { id: 'water', label: 'Water' },
  { id: 'book', label: 'Book' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'moon', label: 'Moon' },
  { id: 'sunny', label: 'Sun' },
  { id: 'heart', label: 'Heart' },
  { id: 'walk', label: 'Walk' },
];

export const TIME_OF_DAY_OPTIONS = [
  { id: 'morning' as const, label: 'Morning' },
  { id: 'afternoon' as const, label: 'Afternoon' },
  { id: 'evening' as const, label: 'Evening' },
  { id: 'anytime' as const, label: 'Anytime' },
];
