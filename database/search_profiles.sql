-- 1. Add Bio and Links columns if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'bio') then
    alter table profiles add column bio text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'links') then
    alter table profiles add column links jsonb;
  end if;
end $$;

-- 2. Create Search Profiles RPC
create or replace function search_profiles(query_text text, limit_val int default 20)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  tagline text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.tagline
  from profiles p
  where
    p.full_name ilike '%' || query_text || '%'
    or p.tagline ilike '%' || query_text || '%'
  order by
    -- Simple ranking: exact match first, then starts with, then contains
    case
      when p.full_name ilike query_text then 1
      when p.full_name ilike query_text || '%' then 2
      else 3
    end,
    p.full_name
  limit limit_val;
end;
$$;
