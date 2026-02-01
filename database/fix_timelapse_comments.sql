-- 1. Create timelapse_comment_likes table (Missing)
create table if not exists public.timelapse_comment_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  comment_id uuid references public.timelapse_comments(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, comment_id)
);

-- 2. Enable RLS on all related tables
alter table public.timelapse_comments enable row level security;
alter table public.timelapse_comment_likes enable row level security;
alter table public.timelapse_likes enable row level security;
alter table public.timelapse_saves enable row level security;

-- 3. Drop existing policies to avoid conflicts (clean slate for these tables)
drop policy if exists "Public view timelapse comments" on public.timelapse_comments;
drop policy if exists "Authenticated insert timelapse comments" on public.timelapse_comments;
drop policy if exists "User delete own timelapse comments" on public.timelapse_comments;

drop policy if exists "Public view timelapse comment likes" on public.timelapse_comment_likes;
drop policy if exists "Authenticated insert timelapse comment likes" on public.timelapse_comment_likes;
drop policy if exists "User delete own timelapse comment likes" on public.timelapse_comment_likes;

drop policy if exists "Public view timelapse likes" on public.timelapse_likes;
drop policy if exists "Authenticated insert timelapse likes" on public.timelapse_likes;
drop policy if exists "User delete own timelapse likes" on public.timelapse_likes;

drop policy if exists "Authenticated view timelapse saves" on public.timelapse_saves;
drop policy if exists "Authenticated insert timelapse saves" on public.timelapse_saves;
drop policy if exists "User delete own timelapse saves" on public.timelapse_saves;

-- 4. Create Policies

-- Timelapse Comments
create policy "Public view timelapse comments"
on public.timelapse_comments for select
using (true);

create policy "Authenticated insert timelapse comments"
on public.timelapse_comments for insert
with check (auth.uid() = user_id);

create policy "User delete own timelapse comments"
on public.timelapse_comments for delete
using (auth.uid() = user_id);

-- Timelapse Comment Likes
create policy "Public view timelapse comment likes"
on public.timelapse_comment_likes for select
using (true);

create policy "Authenticated insert timelapse comment likes"
on public.timelapse_comment_likes for insert
with check (auth.uid() = user_id);

create policy "User delete own timelapse comment likes"
on public.timelapse_comment_likes for delete
using (auth.uid() = user_id);

-- Timelapse Likes (Likes on the timelapse itself)
create policy "Public view timelapse likes"
on public.timelapse_likes for select
using (true);

create policy "Authenticated insert timelapse likes"
on public.timelapse_likes for insert
with check (auth.uid() = user_id);

create policy "User delete own timelapse likes"
on public.timelapse_likes for delete
using (auth.uid() = user_id);

-- Timelapse Saves (Values privacy more, usually only user sees their saves, but often simple to select own)
create policy "Authenticated view timelapse saves"
on public.timelapse_saves for select
using (auth.uid() = user_id);

create policy "Authenticated insert timelapse saves"
on public.timelapse_saves for insert
with check (auth.uid() = user_id);

create policy "User delete own timelapse saves"
on public.timelapse_saves for delete
using (auth.uid() = user_id);
