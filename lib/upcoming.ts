import { Habit } from '../types/habit';

export type UpcomingHabit = Habit & { minutesFromNow: number };

export function getNextUpcomingHabit(habits: Habit[]): UpcomingHabit | undefined {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return habits
    .filter((habit) => !habit.completed && habit.reminderEnabled && habit.reminderTime)
    .map((habit) => {
      const [hrs, mins] = habit.reminderTime.split(':').map(Number);
      const reminderMinutes = hrs * 60 + mins;
      return { ...habit, minutesFromNow: reminderMinutes - currentMinutes };
    })
    .filter((habit) => habit.minutesFromNow > 0)
    .sort((a, b) => a.minutesFromNow - b.minutesFromNow)[0];
}

export function getUpNextMorningHabit(habits: Habit[]): Habit | undefined {
  return habits
    .filter((habit) => !habit.completed && habit.timeOfDay === 'morning' && habit.reminderTime)
    .sort((a, b) => {
      const [aHours, aMinutes] = a.reminderTime.split(':').map(Number);
      const [bHours, bMinutes] = b.reminderTime.split(':').map(Number);
      return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
    })[0];
}

export function formatMinutesUntil(minutes: number): string {
  if (minutes < 60) {
    const label = minutes === 1 ? 'minute' : 'minutes';
    return `in ${minutes} ${label}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    const label = hours === 1 ? 'hour' : 'hours';
    return `in ${hours} ${label}`;
  }

  const hourLabel = hours === 1 ? 'hour' : 'hours';
  const minuteLabel = remainder === 1 ? 'minute' : 'minutes';
  return `in ${hours} ${hourLabel} ${remainder} ${minuteLabel}`;
}
