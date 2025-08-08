## MVP XP System – Technical Plan

This plan outlines a minimal-yet-robust XP system with a clear path to scale. No code will be implemented yet; this is a blueprint for review.

### Goals (MVP)

- Track user XP in `profiles.xp`.
- Award 5 XP to the INSIGHT AUTHOR when any user likes, saves, or comments on their insight (same weight for each, first-time action only per user/insight/action type).
- Award 10 XP to the USER when they answer a quiz question correctly (based on one of the last 5 watched/read items).
- Add a leaderboard section (top-3 by XP).

### Key Design Choices (robustness over shortcuts)

- Use an append-only `xp_ledger` to record every XP grant atomically (with invariants) instead of directly incrementing `profiles.xp`. This prevents double-granting, supports auditing, and enables future revocations.
- Grant XP via secure Postgres RPCs (or database triggers) that enforce idempotency using unique constraints (e.g., one like → at most one grant per user/insight/action).
- Maintain `profiles.xp` as a cached/aggregated value (materialized by trigger) for fast reads/leaderboards.

---

## Phase 1: Database Changes

1. Add XP column to `profiles` (cache of current XP)

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp bigint NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles (xp DESC);
```

2. XP Ledger (append-only)

```sql
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id), -- recipient of XP
  amount int NOT NULL CHECK (amount <> 0),
  reason text NOT NULL, -- e.g., 'insight_like', 'insight_save', 'insight_comment', 'quiz_correct'
  subject_type text,    -- e.g., 'insight', 'quiz_question'
  subject_id text,      -- id of insight/question (text to allow bigint/uuid)
  actor_id uuid,        -- who performed the action (liker/commenter), nullable for quiz engine
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotency constraints (one grant per action/user/subject)
CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_once_per_like ON public.xp_ledger (reason, subject_type, subject_id, actor_id)
  WHERE reason IN ('insight_like','insight_save','insight_comment');
```

2.1) Question fields on content tables (populated by backend alongside summaries)

Minimal MVP: a single free-text question per content row which the client will use to assemble a multiple-choice quiz. This keeps ingestion simple and leverages existing content metadata for answers/distractors.

```sql
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS question text;
ALTER TABLE public.papers   ADD COLUMN IF NOT EXISTS question text;
ALTER TABLE public.books    ADD COLUMN IF NOT EXISTS question text;
```

Notes:

- The backend populates `question` during summarization. Example: "Which site hosted this article?" for articles (answer = `site_name`).
- Distractors can be generated client-side from the last 5 viewed items (e.g., other `site_name`s) or from a small curated pool.
- If you later want fully server-defined MCQs, you can additionally maintain `quiz_questions` (Phase 3 optional) with options and correct key for higher quality questions.

3. RLS for `xp_ledger`

```sql
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
-- Read: only the subject (recipient) sees their own ledger; admins can have separate role/policy if needed later
DROP POLICY IF EXISTS xp_ledger_select_own ON public.xp_ledger;
CREATE POLICY xp_ledger_select_own ON public.xp_ledger
  FOR SELECT USING (user_id = auth.uid());

-- Insert: only via RPC (see Phase 2). Direct inserts from clients are not allowed by default.
DROP POLICY IF EXISTS xp_ledger_insert_none ON public.xp_ledger;
CREATE POLICY xp_ledger_insert_none ON public.xp_ledger
  FOR INSERT WITH CHECK (false);
```

4. Keep insights interactions (already planned in prior work): `insight_likes`, `insight_saves`, `insight_comments` with RLS as defined.

5. Trigger to keep `profiles.xp` in sync with `xp_ledger`

```sql
CREATE OR REPLACE FUNCTION public.apply_xp_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
    SET xp = COALESCE(xp, 0) + NEW.amount
    WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_xp_ledger_apply ON public.xp_ledger;
CREATE TRIGGER trg_xp_ledger_apply
AFTER INSERT ON public.xp_ledger
FOR EACH ROW EXECUTE FUNCTION public.apply_xp_to_profile();
```

Notes:

- Using a trigger to update `profiles.xp` ensures low-latency reads for leaderboards.
- For scale, `profiles.xp` is indexed; consider periodic reconciliation jobs that compare sums vs cached value.

---

## Phase 2: Secure XP Granting (RPCs)

Implement SQL RPCs that perform the following atomically:

1. Insight Interaction → author +5 XP

```sql
CREATE OR REPLACE FUNCTION public.grant_xp_for_insight_interaction(
  p_insight_id uuid,
  p_author_id uuid,
  p_actor_id uuid,
  p_reason text -- 'insight_like' | 'insight_save' | 'insight_comment'
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  -- Enforce only one grant per actor/insight/reason via unique index; if exists, do nothing
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, actor_id)
  VALUES (p_author_id, 5, p_reason, 'insight', p_insight_id::text, p_actor_id)
  ON CONFLICT DO NOTHING;
END;$$;

GRANT EXECUTE ON FUNCTION public.grant_xp_for_insight_interaction(uuid, uuid, uuid, text) TO authenticated;
```

Client flow (MVP):

- After a successful like/save/comment insert, call `grant_xp_for_insight_interaction(insight_id, author_id, auth.uid(), reason)`.
- We already have the author id in insights. If not, fetch it briefly.

2. Quiz Correct Answer → user +10 XP

```sql
CREATE OR REPLACE FUNCTION public.grant_xp_for_quiz_correct(
  p_user_id uuid,
  p_question_id uuid
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, actor_id)
  VALUES (p_user_id, 10, 'quiz_correct', 'quiz_question', p_question_id::text, p_user_id)
  ON CONFLICT DO NOTHING; -- Optionally make unique if you want to prevent multiple XS for same Q
END;$$;

GRANT EXECUTE ON FUNCTION public.grant_xp_for_quiz_correct(uuid, uuid) TO authenticated;
```

Security:

- For client safety, consider moving these functions under a SUPABASE Edge Function and perform additional validations (e.g., verify interaction or quiz correctness server-side) before calling RPC.

---

## Phase 3: Quizzes (MVP)

Data model (MVP):

```sql
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type text NOT NULL CHECK (content_type IN ('article','paper','book')),
  content_id bigint NOT NULL,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option char(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id),
  selected_option char(1) NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies (simple):
CREATE POLICY quiz_q_select_all ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY quiz_attempts_select_own ON public.quiz_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY quiz_attempts_insert_own ON public.quiz_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
```

Question sourcing (MVP):

- Primary source: the new `question` column on the selected content row (article/paper/book) populated by your backend.
- Answers/distractors: derive client-side from content metadata and recent history, e.g.:
  - Articles: correct = `site_name` of target; distractors = `site_name` of other recent items.
  - Papers/Books: correct = author/year/site or prompt-driven answer; distractors from recent items or curated set.
- Optional: also support `quiz_questions` table for richer, pre-baked MCQs later.

Tracking last 5 pieces of content:

- Use existing views tables (from `databaseOverview.sql`): `article_views`, `paper_views`, `book_views` (all carry `user_id`, `created_at`).
- Query union of last N (e.g., 5) by `created_at` desc for the current user:
  - Either via client union query or a SQL RPC (recommended for simplicity and performance) returning a normalized list `{type, id, created_at}` plus any needed metadata (`site_name`, `author`, etc.).

Selecting which one to quiz on:

- Randomly select one from the last 5, with simple anti-repeat logic (e.g., don’t pick an item quizzed in the last M minutes; store last asked `content_type+id` in memory or in a tiny `quiz_recent` table keyed by user/time).
- If the selected item has `question` null, skip to next candidate. If none have questions, skip quiz injection.

Locking the feed when a quiz appears:

- Inject a `QuizCard` as the next item, then set `scrollEnabled={false}` on the `FlatList` (MainFeed uses `pagingEnabled`) until the user answers. Alternatively, present a full-screen modal quiz; both patterns block scrolling.
- On correct/incorrect submit:
  - Record attempt in `quiz_attempts` (enforcing `UNIQUE (user_id, question_id)`).
  - If correct, call `public.grant_xp_for_quiz_correct(auth.uid(), question_id)` to grant +10 XP.
  - Re-enable scrolling (`scrollEnabled={true}`) and advance.
- Handle Android back button: while quiz active, intercept back to prevent bypass.

Client flow (MVP):

- FeedAlgorithm injects a quiz at a low frequency (e.g., 1 in every 8-12 items viewed) when user has ≥1 eligible item in last 5.
- Build options from recent history (shuffle), ensure deterministic correct answer labeling.

Anti-abuse (MVP):

- Enforce one attempt per question via `UNIQUE (user_id, question_id)`.
- Optionally time-limit question validity (question age < 7 days).

---

## Phase 4: Leaderboard

MVP (fast):

```sql
-- Simple top-3
SELECT id, full_name, avatar_url, xp
FROM public.profiles
ORDER BY xp DESC
LIMIT 3;
```

More robust (scale):

- Materialized view `leaderboard_daily` refreshed periodically:

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_daily AS
  SELECT id, full_name, avatar_url, xp
  FROM public.profiles
  ORDER BY xp DESC
  LIMIT 100;

-- refresh via cron or Edge Function
```

- Add seasonality (weekly/monthly XP) using a `xp_periodic` table or adding `period` fields in `xp_ledger` and aggregating by window.

---

## Phase 4.1: Levels, Rank Storage, and Profile Progress Display

SQL changes:

1. Persist user level (optional cache) on `profiles`

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS level int NOT NULL DEFAULT 1;
```

2. Compute level from XP (deterministic function)

Leveling curve (tunable): per-level requirement grows linearly.

- Base per-level XP = 100
- Increment per level = +25 (Level 1 → 100, L2 → 125, L3 → 150, ...)

```sql
CREATE OR REPLACE FUNCTION public.compute_level(p_xp bigint)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  lvl int := 1;
  remaining bigint := COALESCE(p_xp, 0);
  need int;
BEGIN
  LOOP
    need := 100 + (lvl - 1) * 25; -- tunable curve
    EXIT WHEN remaining < need;
    remaining := remaining - need;
    lvl := lvl + 1;
  END LOOP;
  RETURN GREATEST(lvl, 1);
END;
$$;
```

3. Update the XP trigger to also persist `level`

```sql
CREATE OR REPLACE FUNCTION public.apply_xp_to_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_xp bigint;
BEGIN
  UPDATE public.profiles
    SET xp = COALESCE(xp, 0) + NEW.amount
    WHERE id = NEW.user_id
    RETURNING xp INTO new_xp;

  UPDATE public.profiles
    SET level = public.compute_level(new_xp)
    WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

4. Rank storage options

- Option A (no storage, dynamic): compute rank on demand with a window function:

```sql
SELECT id, full_name, avatar_url, xp,
       RANK() OVER (ORDER BY xp DESC) AS rank
FROM public.profiles;
```

- Option B (cached): materialized view to store rank for fast reads (refresh periodically):

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_ranks AS
SELECT id, full_name, avatar_url, xp,
       RANK() OVER (ORDER BY xp DESC) AS rank
FROM public.profiles;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_ranks_id ON public.leaderboard_ranks(id);

-- Refresh via cron/Edge Function as needed
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_ranks;
```

UI implementation details (Profile):

- Show a yellow progress bar representing progress within the current level.
  - Compute on client (or via SQL function) using the same curve:
    - `level = computeLevelFromXp(xp)`
    - `xpNeededForLevel(level) = 100 + (level - 1) * 25`
    - `xpIntoCurrent = xp - totalRequiredXpUpTo(level - 1)`
  - Progress = `xpIntoCurrent / xpNeededForLevel(level)`.
- Display: “Level N • X / Y XP” above the bar.
- Display user rank: either from the dynamic query (Option A) or from `leaderboard_ranks` (Option B) if enabled.
- Color: use brand yellow for the progress fill; ensure accessible contrast on dark/light themes.

Notes:

- Storing `rank` directly on profiles is discouraged (it changes whenever anyone’s XP changes). Prefer dynamic window function or a materialized view refreshed periodically.
- `level` can be cached safely on profiles since it derives directly and deterministically from `xp`.

## Phase 5: UI/UX Adjustments

Profile screen:

- Show XP and rank badge.
- Add “Leaderboard” section (top-3 list with avatar/name/xp).
- Add a link to “View full leaderboard” (future).

Feed:

- Inject `QuizCard` occasionally (from algorithm). Show question and options; on correct answer, flash +10 XP and record attempt.

Insights:

- On like/save/comment success, call the `grant_xp_for_insight_interaction` RPC with: `(insight_id, author_id, auth.uid(), reason)`.
- Keep interaction flows idempotent (we already use authoritative count sync).

Toasts/Feedback:

- Reusable `showXpToast(+5)`/`showXpToast(+10)` helper to surface rewards immediately.

---

## Phase 6: Anti-Abuse & Data Integrity

- Idempotency: enforced via unique indexes on `xp_ledger` for insight interactions; at most one grant for like/save/comment per user/insight.
- Optional revocation: if you decide that unliking should remove XP, switch from “ON CONFLICT DO NOTHING” to a reversible model (insert on like, delete on unlike + trigger to decrement), but beware churn-gaming.
- Auditability: full history in `xp_ledger`.
- Performance: index `profiles.xp` and `xp_ledger(user_id, created_at)`.

---

## Phase 7: Rollout Checklist

1. Apply SQL migrations (Phase 1 + Phase 3 + RPCs in Phase 2).
2. Wire client calls:
   - Insights: After like/save/comment insert succeeds, call RPC to grant +5 XP to the insight author.
   - Quizzes: On correct submit, call RPC to grant +10 XP to the current user.
3. Add UI elements:
   - Profile XP field + Leaderboard (top-3) list.
   - `QuizCard` component and feed injection logic.
   - XP toasts.
4. QA:
   - Verify idempotency (repeat likes don’t double grant).
   - Verify counts and XP alignment for multiple users.
   - Load test leaderboard query.

---

## Notes on Libraries

- No additional libraries are strictly required. Existing Supabase client + Edge Functions + SQL is sufficient.
- If scheduling is needed for materialized view refreshes or daily challenges, consider Supabase cron or an external scheduler hitting an Edge Function.

---

## Open Questions

1. Should XP be revoked when an interaction is undone (unlike/unsave/delete comment), or should XP only ever accrue?
2. Should quizzes be pre-generated server-side for quality, or is client-derived (from viewed content) acceptable in MVP?
3. Should leaderboard be global only, or also scoped by industry/streaks in future?

Once you confirm the plan and the answers above, I’ll implement the SQL, RPC, and UI changes incrementally.
