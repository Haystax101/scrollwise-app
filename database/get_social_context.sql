-- Function to get social context (friend likes) for feed items
create or replace function get_feed_social_context(
  p_user_id uuid,
  p_article_ids bigint[],
  p_paper_ids bigint[],
  p_book_ids bigint[],
  p_insight_ids bigint[],
  p_video_ids bigint[],
  p_podcast_ids bigint[]
)
returns table (
  content_id bigint,
  content_type text,
  friend_name text,
  friend_id uuid,
  friend_avatar text,
  action text
)
language plpgsql
security definer
as $$
declare
  friend_ids uuid[];
begin
  -- 1. Get friend IDs
  select array_agg(friend_id) into friend_ids
  from (
    select addressee_id as friend_id from friendships where requester_id = p_user_id
    union
    select requester_id as friend_id from friendships where addressee_id = p_user_id
  ) f;

  -- Return empty if no friends
  if friend_ids is null then
    return;
  end if;

  return query
  with friend_activity as (
    -- Articles
    select article_id as c_id, 'article' as c_type, user_id as f_id, 'liked' as act
    from user_article_likes
    where user_id = any(friend_ids) and article_id = any(p_article_ids)
    
    union all
    
    -- Papers
    select paper_id as c_id, 'paper' as c_type, user_id as f_id, 'liked' as act
    from user_paper_likes
    where user_id = any(friend_ids) and paper_id = any(p_paper_ids)

    union all

    -- Books
    select book_id as c_id, 'book' as c_type, user_id as f_id, 'liked' as act
    from user_book_likes
    where user_id = any(friend_ids) and book_id = any(p_book_ids)

    union all
    
    -- Insights (using user_insights_likes)
    select insight_id as c_id, 'insight' as c_type, user_id as f_id, 'liked' as act
    from user_insights_likes
    where user_id = any(friend_ids) and insight_id = any(p_insight_ids)
    
    union all
    
    -- Videos
    select video_id as c_id, 'video' as c_type, user_id as f_id, 'liked' as act
    from user_video_likes
    where user_id = any(friend_ids) and video_id = any(p_video_ids)

     union all
    
    -- Podcasts
    select podcast_id as c_id, 'podcast' as c_type, user_id as f_id, 'liked' as act
    from user_podcast_likes
    where user_id = any(friend_ids) and podcast_id = any(p_podcast_ids)
  )
  select distinct on (fa.c_id, fa.c_type)
    fa.c_id,
    fa.c_type,
    p.full_name,
    p.id,
    p.avatar_url,
    fa.act
  from friend_activity fa
  join profiles p on p.id = fa.f_id
  order by fa.c_id, fa.c_type, random(); -- Random friend if multiple liked
end;
$$;
