-- Run in Supabase SQL editor before using Phase 2 features

create table profiles (
  id uuid references auth.users primary key,
  email text,
  subscription_status text default 'free',
  subscription_expires_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz default now()
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  icon text default '⭐',
  color text default '#6366f1',
  time_of_day text not null check (time_of_day in ('morning', 'afternoon', 'evening', 'anytime')),
  frequency text default 'daily',
  custom_days int[],
  reminder_time time,
  reminder_enabled boolean default true,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  completed_date date not null,
  completed_at timestamptz default now(),
  note text,
  unique(habit_id, completed_date)
);

create table streaks (
  habit_id uuid references habits(id) on delete cascade primary key,
  current_streak int default 0,
  longest_streak int default 0,
  last_completed_date date,
  updated_at timestamptz default now()
);

create table streak_freezes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  used_date date,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table habits enable row level security;
alter table completions enable row level security;
alter table streaks enable row level security;
alter table streak_freezes enable row level security;

create policy "users own profile" on profiles
  for all using (id = auth.uid());

create policy "users own habits" on habits
  for all using (user_id = auth.uid());

create policy "users own completions" on completions
  for all using (user_id = auth.uid());

create policy "users own streaks" on streaks
  for all using (
    habit_id in (select id from habits where user_id = auth.uid())
  );

create policy "users own freezes" on streak_freezes
  for all using (user_id = auth.uid());

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
