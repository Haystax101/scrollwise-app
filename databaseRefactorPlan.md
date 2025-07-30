# Database Refactoring Plan

This document outlines a plan to refactor the database schema. The goals are to better align the schema with the data collected during user onboarding, improve data integrity and consistency, and remove redundant or unnecessary tables.

## 1. Consolidate Industry Tables

*   **Problem:** The current schema has two tables for industries: `industries` (with a `bigint` primary key) and `industries_canonical` (with a `uuid` primary key). This is inconsistent and causes issues with foreign key references across the application.
*   **Proposed Solution:** Merge both into a single, canonical `industries` table that uses a `uuid` for its primary key and includes all necessary columns.
*   **Actions:**
    1.  Drop the existing `industries` and `industries_canonical` tables.
    2.  Create a new `industries` table with a `uuid` primary key.
    3.  Update the `user_industries`, `articles`, and `reels` tables to reference the new `industries` table.

## 2. Restructure Education Data

*   **Problem:** The `user_degrees` and `user_universities` tables are separate, meaning a user's degree is not directly associated with the university where they obtained it.
*   **Proposed Solution:** Create a single `user_education` table to properly link a user, their university, their degree, and their stage of study.
*   **Actions:**
    1.  Drop the `user_degrees` and `user_universities` tables.
    2.  Create a new `user_education` table with foreign keys to `profiles`, `universities`, and `degrees`.

## 3. Refine Career Goal Storage

*   **Problem:** The `user_roles` table is redundant and its purpose overlaps with the `user_goals` table. The `timeframe` field from onboarding is not currently being stored.
*   **Proposed Solution:** Consolidate all goal-related information into the `user_goals` table.
*   **Actions:**
    1.  Add a `timeframe` column to the `user_goals` table.
    2.  Drop the `user_roles` table.

## 4. Simplify Experience Data

*   **Problem:** The `user_experiences` table contains fields that are not used in the onboarding flow (`title`, `start_date`, `end_date`).
*   **Proposed Solution:** Remove the unnecessary fields to simplify the table to its core purpose: storing a description, company, and experience level.
*   **Actions:**
    1.  Drop the `title`, `start_date`, and `end_date` columns from the `user_experiences` table.

## 5. Remove Unused Skills Tables

*   **Problem:** The `skills` and `user_skills` tables are no longer needed as this information is not collected during onboarding.
*   **Proposed Solution:** Remove both tables to clean up the schema.
*   **Actions:**
    1.  Drop the `user_skills` and `skills` tables.

## 6. Clean Up the `profiles` Table

*   **Problem:** The `profiles` table contains columns (`experience`, `interests`, `interests_names_backup`) that are now redundant because the data is better stored in dedicated, normalized tables.
*   **Proposed Solution:** Remove these legacy columns to simplify the `profiles` table.
*   **Actions:**
    1.  Drop the redundant columns from the `profiles` table.

## Summary of Changes

*   **Tables to be DROPPED:**
    *   `industries`
    *   `industries_canonical`
    *   `user_degrees`
    *   `user_universities`
    *   `user_roles`
    *   `user_skills`
    *   `skills`
*   **Tables to be CREATED:**
    *   `industries` (new, unified table)
    *   `user_education`
*   **Tables to be ALTERED:**
    *   `user_goals` (add `timeframe` column)
    *   `user_experiences` (remove redundant columns)
    *   `profiles` (remove redundant columns)
    *   `user_industries` (update foreign key)
    *   `articles` (update foreign key)
    *   `reels` (update foreign key)

## Next Steps

I will now provide the complete SQL script to safely execute these changes on your database.