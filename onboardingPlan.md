# Onboarding & Profile Data Collection Plan

## Overview
This document outlines the onboarding flow, field mappings, UI types, and Supabase logic for collecting robust user profile data in a normalized, scalable way. It is based on your requirements, database schema, and the screenshots/context provided in this chat.

---

## Step-by-Step Onboarding Mapping

### Step 1: Education Background
- **University/Institution:**
  - Type: Autocomplete/search (from `universities` table, select only)
  - Table: `user_universities`
- **Degree/Subject/Discipline:**
  - Type: Autocomplete/search (from `degrees` table, select only)
  - Table: `user_degrees`
- **Current Stage:**
  - Type: Dropdown (e.g. 'Undergraduate', 'Masters', 'PhD', 'Year 2', etc.)
  - Table: `user_degrees.stage`
- **All fields optional**

### Step 2: Industry & Work Experience
- **Industry:**
  - Type: Autocomplete/search (from `industries` table, select only)
  - Table: `user_industries`
- **Current/Most Recent Company:**
  - Type: Autocomplete/search (from `companies` table, select only)
  - Table: `user_experiences.company_id`
- **Experience Level:**
  - Type: Dropdown (Student, Intern, Entry-Level, Mid-Level, Senior, Executive)
  - Table: `user_industries.stage` and `user_experiences.experience_level`
- **Work Experience:**
  - Type: Multi-entry form (add multiple experiences, each with company, title, description, start/end date, experience level)
  - Table: `user_experiences`
- **All fields optional**

### Step 3: Current Projects
- **Project Name:**
  - Type: Text
  - Table: `user_projects.title`
- **Project Description:**
  - Type: Textarea
  - Table: `user_projects.description`
- **Allow multiple projects**
- **All fields optional**

### Step 4: Career Path & Goals
- **Desired Role:**
  - Type: Text
  - Table: `user_roles` (type = 'desired')
- **Timeframe to Achieve:**
  - Type: Dropdown (e.g. '1 year', '2 years', '5 years', etc.)
  - Table: `user_roles.timeframe`
- **Long-term Career Goal:**
  - Type: Text
  - Table: `user_goals.goal`
- **Target Companies:**
  - Type: Autocomplete/search (from `companies` table, select only, allow multiple)
  - Table: `user_goal_companies`
- **All fields optional**

---

## Supabase Insert/Update Logic for Onboarding
- On each step, after user clicks “Next Step” (or “Complete Profile”):
  - For each field, if a value is provided, insert or upsert into the relevant join table.
  - Use the authenticated user’s `id` for all inserts.
  - For multi-entry fields (projects, experiences, target companies), insert a row for each entry.
  - For autocomplete fields, only allow selection from canonical tables (universities, companies, industries, degrees).
  - If a user skips a step, do not insert anything for that step (they can fill it in later).

**Example Supabase logic for each table:**
- `user_universities`: upsert `{ user_id, university_id }`
- `user_degrees`: upsert `{ user_id, degree_id, stage }`
- `user_industries`: upsert `{ user_id, industry_id, stage }`
- `user_projects`: insert `{ user_id, title, description }`
- `user_experiences`: insert `{ user_id, company_id, title, description, start_date, end_date, experience_level }`
- `user_roles`: upsert `{ user_id, role, type, timeframe }`
- `user_goals`: upsert `{ user_id, goal }`
- `user_goal_companies`: upsert `{ user_id, company_id }`

---

## Experience Level Options
- Student
- Intern
- Entry-Level
- Mid-Level
- Senior
- Executive

---

## Additional Context & Decisions
- All onboarding fields are optional except name/email (users can fill in later via profile).
- All company/university/industry/degree fields are autocomplete/search from canonical tables (no free text).
- Work experience is multi-entry, each linked to a company from canonical table.
- Skills are not collected in onboarding.
- Target companies are selected from canonical table (autocomplete/search only).
- UI should not block user from continuing if a field is empty (except name/email).
- All logic and schema changes are aligned with the latest plan.md and chat context.

---

## Reference: Database Schema & RLS Policies

See `plan.md` for the full SQL schema and RLS policy definitions for all canonical and join tables.

---

## Screenshots/UX Reference
- See attached screenshots in this chat for the intended onboarding step layout and field groupings.

---

## Next Steps
- Update onboarding UI to use these field types and logic.
- Implement Supabase insert/update logic as described above.
- Ensure all canonical tables are seeded with data for autocomplete fields.
- Allow users to update/add any field later via their profile.
