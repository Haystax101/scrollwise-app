-- Test progress bar calculation for different voltz amounts

-- Test Level 1 user with 10 voltz (should be 50% progress)
SELECT 
  'Level 1, 10 voltz' as scenario,
  calculate_level_from_voltz(10) as level,
  get_voltz_for_level(calculate_level_from_voltz(10)) as current_level_voltz,
  get_voltz_for_level(calculate_level_from_voltz(10) + 1) as next_level_voltz,
  10 - get_voltz_for_level(calculate_level_from_voltz(10)) as level_progress,
  get_voltz_for_level(calculate_level_from_voltz(10) + 1) - get_voltz_for_level(calculate_level_from_voltz(10)) as progress_range,
  ROUND((10 - get_voltz_for_level(calculate_level_from_voltz(10)))::float / 
        (get_voltz_for_level(calculate_level_from_voltz(10) + 1) - get_voltz_for_level(calculate_level_from_voltz(10))) * 100, 2) as progress_percentage;

-- Test Level 2 user with 30 voltz (should be 25% progress)
SELECT 
  'Level 2, 30 voltz' as scenario,
  calculate_level_from_voltz(30) as level,
  get_voltz_for_level(calculate_level_from_voltz(30)) as current_level_voltz,
  get_voltz_for_level(calculate_level_from_voltz(30) + 1) as next_level_voltz,
  30 - get_voltz_for_level(calculate_level_from_voltz(30)) as level_progress,
  get_voltz_for_level(calculate_level_from_voltz(30) + 1) - get_voltz_for_level(calculate_level_from_voltz(30)) as progress_range,
  ROUND((30 - get_voltz_for_level(calculate_level_from_voltz(30)))::float / 
        (get_voltz_for_level(calculate_level_from_voltz(30) + 1) - get_voltz_for_level(calculate_level_from_voltz(30))) * 100, 2) as progress_percentage;

-- Test Level 2 user with 50 voltz (should be 75% progress)
SELECT 
  'Level 2, 50 voltz' as scenario,
  calculate_level_from_voltz(50) as level,
  get_voltz_for_level(calculate_level_from_voltz(50)) as current_level_voltz,
  get_voltz_for_level(calculate_level_from_voltz(50) + 1) as next_level_voltz,
  50 - get_voltz_for_level(calculate_level_from_voltz(50)) as level_progress,
  get_voltz_for_level(calculate_level_from_voltz(50) + 1) - get_voltz_for_level(calculate_level_from_voltz(50)) as progress_range,
  ROUND((50 - get_voltz_for_level(calculate_level_from_voltz(50)))::float / 
        (get_voltz_for_level(calculate_level_from_voltz(50) + 1) - get_voltz_for_level(calculate_level_from_voltz(50))) * 100, 2) as progress_percentage;