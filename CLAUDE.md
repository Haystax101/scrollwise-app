# Claude Code Project Context

## Important Considerations

- **Confidence Threshold**: Ensure you are at least 95% sure of your implementation decision
- **Documentation Consultation**: When considering implementing any new feature, you should attempt to read documentation and audit any potential issues prior to implementation.

## Database Setup

- **Database**: Supabase PostgreSQL
- **Schema Reference**: Always refer to `databaseOverview.sql` for current schema structure
- **Important**: PostgreSQL queries should be compatible with Supabase's PostgreSQL implementation

## PostgreSQL Query Guidelines

- Array slicing syntax like `[1:50]` is NOT supported in PostgreSQL
- Use `LIMIT` and `OFFSET` for pagination instead
- When working with arrays, use proper PostgreSQL array functions
- Always test queries for PostgreSQL compatibility before suggesting

## Current Critical Issues (Priority Order)

3. **Quiz logic broken**: Insights inclusion breaks quiz question selection logic

## Key Schema Notes

- `insights.id` uses UUID type
- `user_content_flags.content_id` uses BIGINT type (causing mismatch)
- `content_views.content_id` uses BIGINT type (potential mismatch)
- All content types (articles, papers, books, insights) have different ID types

## Testing Commands

- Run lint: Check README or search codebase for correct command
- Run typecheck: Check README or search codebase for correct command
