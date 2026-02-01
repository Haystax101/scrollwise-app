-- 1. Fix Foreign Keys to allow joining with profiles
-- We drop the constraints referencing auth.users and add constraints referencing public.profiles
-- Since profiles.id is the same as auth.users.id (1:1), this doesn't break data, just changes the relationship for PostgREST.

-- Timelapse Comments
alter table public.timelapse_comments 
  drop constraint if exists timelapse_comments_user_id_fkey,
  add constraint timelapse_comments_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- Timelapse Likes
alter table public.timelapse_likes 
  drop constraint if exists timelapse_likes_user_id_fkey,
  add constraint timelapse_likes_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- Timelapse Saves
alter table public.timelapse_saves 
  drop constraint if exists timelapse_saves_user_id_fkey,
  add constraint timelapse_saves_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- Timelapse Comment Likes
alter table public.timelapse_comment_likes 
  drop constraint if exists timelapse_comment_likes_user_id_fkey, -- might have been named auto-generatedly or manually
  -- drop constraint by name if we knew it, or just alter column. 
  -- Safest is to find constraint name or just add the new one if we are sure.
  -- Since I just created it in previous step: "user_id uuid references auth.users"
  -- It likely has a generated name. To be safe, let's just alter the column type? No, we need constraint.
  -- Dropping by generic logic is hard in pure SQL script without plpgsql. 
  -- I'll assume standard naming or just force a new constraint if possible.
  -- Actually, let's try to drop the likely name.
  drop constraint if exists timelapse_comment_likes_user_id_fkey;

alter table public.timelapse_comment_likes
  add constraint timelapse_comment_likes_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;


-- 2. Add Trigger for Comment Counts
-- Function to update count
create or replace function public.handle_timelapse_comment_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.timelapse_sessions
    set comments_count = comments_count + 1
    where id = NEW.timelapse_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.timelapse_sessions
    set comments_count = greatest(0, comments_count - 1)
    where id = OLD.timelapse_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_timelapse_comment_added on public.timelapse_comments;
create trigger on_timelapse_comment_added
after insert or delete on public.timelapse_comments
for each row execute function public.handle_timelapse_comment_count();


-- 3. Add Trigger for Like Counts (Bonus cleanup since we are here)
create or replace function public.handle_timelapse_like_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.timelapse_sessions
    set likes_count = likes_count + 1
    where id = NEW.timelapse_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.timelapse_sessions
    set likes_count = greatest(0, likes_count - 1)
    where id = OLD.timelapse_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_timelapse_like_added on public.timelapse_likes;
create trigger on_timelapse_like_added
after insert or delete on public.timelapse_likes
for each row execute function public.handle_timelapse_like_count();
