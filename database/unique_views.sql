-- 1. Ensure all tables have a views_count column
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

ALTER TABLE public.insights 
ADD COLUMN IF NOT EXISTS views_count bigint DEFAULT 0; -- Ensure it exists (already does in some schemas, but safe to ask)

ALTER TABLE public.timelapse_sessions 
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- 2. Create table to track individual user views on content
create table if not exists content_views (
  user_id uuid references auth.users(id) on delete cascade not null,
  content_type text not null check (content_type in ('insight', 'timelapse', 'post')),
  content_id text not null, -- UUID or ID
  view_count int default 1,
  last_viewed_at timestamptz default now(),
  primary key (user_id, content_type, content_id)
);

-- 3. Create RPC function to handle "Unique View" logic
create or replace function record_unique_view(
  p_user_id uuid,
  p_content_type text,
  p_content_id text
)
returns void
language plpgsql
security definer
as $$
declare
  is_new_view boolean;
begin
  -- Try to insert a new view record
  insert into content_views (user_id, content_type, content_id)
  values (p_user_id, p_content_type, p_content_id)
  on conflict (user_id, content_type, content_id)
  do update set 
    view_count = content_views.view_count + 1,
    last_viewed_at = now()
  returning (xmax = 0) into is_new_view; -- xmax=0 implies a new insertion

  -- IF it was a new unique view, increment the public counter
  if is_new_view then
    if p_content_type = 'timelapse' then
      update timelapse_sessions 
      set views_count = coalesce(views_count, 0) + 1 
      where id::text = p_content_id;
      
    elsif p_content_type = 'insight' then
      -- Corrected from 'views' to 'views_count'
      update insights 
      set views_count = coalesce(views_count, 0) + 1 
      where id::text = p_content_id;
      
    elsif p_content_type = 'post' then
      update community_posts 
      set views_count = coalesce(views_count, 0) + 1 
      where id::text = p_content_id;
    end if;
  end if;
end;
$$;
