-- Update random profiles with streak data for testing
update profiles 
set current_streak = floor(random() * 30 + 1)::int 
where total_voltz_earned > 0;

-- Ensure at least the top 5 users have streaks
update profiles
set current_streak = 5
where id in (
  select id from profiles order by total_voltz_earned desc limit 5
);
