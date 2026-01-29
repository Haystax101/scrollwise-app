-- Add Tagline and Current Streak columns to profiles table
do $$
begin
  -- Add tagline if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'tagline') then
    alter table profiles add column tagline text;
  end if;

  -- Add current_streak if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'current_streak') then
    alter table profiles add column current_streak integer default 0;
  end if;
end $$;
