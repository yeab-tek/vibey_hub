-- =========================================================
-- VIBEY HUB — Database Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- Matches Section 6 of the Vibey Hub spec
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role text not null check (role in ('founder','team_member','intern','client')),
  skills text[] default '{}',
  total_points integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------
create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client_name text not null,
  project_type text, -- Website / App / ERP / Branding / etc.
  budget numeric,     -- in ETB
  status text not null default 'lead'
    check (status in ('lead','requirement','design','development','testing','deployment','completed')),
  start_date date,
  deadline date,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- MILESTONES
-- ---------------------------------------------------------
create table milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','completed')),
  deadline date
);

-- ---------------------------------------------------------
-- TASKS
-- ---------------------------------------------------------
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete set null, -- nullable: Phase 1 tasks may not be linked to a project yet
  assigned_user uuid references users(id),
  title text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  points integer, -- optional, links to contribution points if assignee wants credit
  deadline date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CONTRIBUTION CATEGORIES (admin-editable, seeded per Section 4.3)
-- ---------------------------------------------------------
create table contribution_categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

insert into contribution_categories (name) values
  ('development'), ('content'), ('marketing'), ('business');

-- ---------------------------------------------------------
-- DIFFICULTY SETTINGS (admin-editable point values, Section 4.4)
-- Never hardcode these in app logic — always read from this table.
-- ---------------------------------------------------------
create table difficulty_settings (
  id uuid primary key default uuid_generate_v4(),
  difficulty text unique not null check (difficulty in ('easy','medium','hard','exceptional')),
  points integer not null
);

insert into difficulty_settings (difficulty, points) values
  ('easy', 5), ('medium', 10), ('hard', 20), ('exceptional', 50);

-- ---------------------------------------------------------
-- CONTRIBUTIONS
-- ---------------------------------------------------------
create table contributions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('development','content','marketing','business')),
  description text,
  points integer not null, -- requested, based on difficulty
  evidence_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- INCENTIVES
-- ---------------------------------------------------------
create table incentives (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  month text not null, -- e.g. '2026-08'
  points integer not null,
  recommended_reward text,
  founder_decision text check (founder_decision in ('approved','not_this_month','custom')),
  founder_note text,
  unique (user_id, month) -- one incentive record per person per month
);

-- ---------------------------------------------------------
-- INDEXES (dashboard + query speed)
-- ---------------------------------------------------------
create index idx_contributions_user on contributions(user_id);
create index idx_tasks_assigned on tasks(assigned_user);
create index idx_tasks_project on tasks(project_id);
create index idx_milestones_project on milestones(project_id);

-- ---------------------------------------------------------
-- TRIGGER: auto-update users.total_points when a contribution
-- is approved or un-approved. Keeps the cached total in sync
-- without the backend having to do it manually every time.
-- ---------------------------------------------------------
create or replace function update_user_points()
returns trigger as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    update users set total_points = total_points + new.points where id = new.user_id;
  elsif old.status = 'approved' and new.status != 'approved' then
    update users set total_points = total_points - old.points where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_update_user_points
after update on contributions
for each row execute function update_user_points();
