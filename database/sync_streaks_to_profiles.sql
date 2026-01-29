-- 1. Backfill existing streaks
update profiles p
set current_streak = us.current_streak
from user_streaks us
where p.id = us.user_id
and us.streak_type = 'daily_learning'
and us.is_active = true;

-- 2. Create trigger function to keep streaks in sync
create or replace function sync_streak_to_profile()
returns trigger as $$
begin
  if new.streak_type = 'daily_learning' and new.is_active = true then
    update profiles
    set current_streak = new.current_streak
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create generic trigger
drop trigger if exists on_streak_update on user_streaks;
create trigger on_streak_update
after insert or update of current_streak on user_streaks
for each row
execute function sync_streak_to_profile();
