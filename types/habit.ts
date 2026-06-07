export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export type HabitIcon =
  | 'leaf'
  | 'water'
  | 'book'
  | 'fitness'
  | 'moon'
  | 'sunny'
  | 'heart'
  | 'walk';

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export type DbHabit = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  time_of_day: TimeOfDay;
  frequency: HabitFrequency;
  custom_days: number[] | null;
  reminder_time: string | null;
  reminder_enabled: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Habit = {
  id: string;
  name: string;
  icon: HabitIcon;
  color: string;
  timeOfDay: TimeOfDay;
  frequency: HabitFrequency;
  customDays: number[] | null;
  reminderTime: string;
  reminderEnabled: boolean;
  completed: boolean;
  sortOrder: number;
};

export type NewHabit = {
  name: string;
  icon: HabitIcon;
  timeOfDay: TimeOfDay;
  reminderTime: string;
  reminderEnabled?: boolean;
  frequency?: HabitFrequency;
  customDays?: number[] | null;
  color?: string;
};

export type HabitUpdate = Partial<
  Pick<
    Habit,
    'name' | 'icon' | 'color' | 'timeOfDay' | 'frequency' | 'customDays' | 'reminderTime' | 'reminderEnabled'
  >
>;

export type NotifiableHabit = {
  id: string;
  name: string;
  reminder_time: string | null;
  reminder_enabled: boolean;
  frequency: string;
  custom_days: number[] | null;
};
