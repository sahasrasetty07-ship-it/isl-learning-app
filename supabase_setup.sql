-- ==============================================================================
-- Saket (સાકેત) - Supabase Schema Setup: Profiles & Role-Based Access Control
-- Run this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create public.profiles table referencing auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('student','teacher','parent')),
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. RLS Policies
-- Allow users to read their own profile
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

-- Allow users to update their own profile (including role for presentation demo)
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 4. Automatic profile creation trigger function
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

-- 5. Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

