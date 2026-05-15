-- ============================================================
-- ScholarSync: Classrooms setup
-- Run this ENTIRE file once in Supabase → SQL Editor → Run
-- ============================================================

-- 1) Classrooms table (professor creates a "course")
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  join_code text not null unique,
  term text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classrooms_professor_id_idx
  on public.classrooms (professor_id);

create index if not exists classrooms_join_code_idx
  on public.classrooms (join_code);

-- 2) Link each project to one classroom
alter table public.classrooms enable row level security;

alter table public.projects
  add column if not exists classroom_id uuid
  references public.classrooms(id) on delete restrict;

create index if not exists projects_classroom_id_idx
  on public.projects (classroom_id);

-- 3) Row Level Security for classrooms
drop policy if exists "professors_manage_own_classrooms" on public.classrooms;
create policy "professors_manage_own_classrooms"
  on public.classrooms
  for all
  to authenticated
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

drop policy if exists "students_read_active_classrooms" on public.classrooms;
create policy "students_read_active_classrooms"
  on public.classrooms
  for select
  to authenticated
  using (is_active = true);

-- 4) Professors can read projects in their classrooms
drop policy if exists "professors_read_classroom_projects" on public.projects;
create policy "professors_read_classroom_projects"
  on public.projects
  for select
  to authenticated
  using (
    classroom_id is not null
    and classroom_id in (
      select id from public.classrooms where professor_id = auth.uid()
    )
  );

-- Note: Keep your existing policies for students on projects, project_members, tasks, etc.
-- If something breaks after this, check Supabase → Authentication → Policies.
