
# Onboarding Supabase Submission Plan

This document outlines a plan to refactor the onboarding process to submit all data to Supabase at the end of the flow, rather than on each step. This will improve user experience and data consistency.

## Current State

- The onboarding process is split into five steps: `EducationBackgroundStep`, `IndustryStep`, `WorkExperienceStep`, `CurrentProjectsStep`, and `CareerGoalsStep`.
- Each step is a separate React component.
- The `NewOnboarding` component manages the flow between these steps.
- Currently, `IndustryStep` and `WorkExperienceStep` submit their data to Supabase independently when the user clicks the "Next Step" button.
- The other steps do not currently collect or submit data.

## Proposed Changes

I propose the following changes to centralize the data submission process:

### 1. State Management

- I will lift the state from each onboarding step up to the parent `NewOnboarding` component. This will create a single source of truth for all onboarding data.
- The `NewOnboarding` component will manage a single state object that holds all the data from the five steps.
- Each step component will be modified to receive its data and a handler function to update the central state object as props.

### 2. Data Submission

- I will remove the individual Supabase submission logic from `IndustryStep` and `WorkExperienceStep`.
- I will create a single submission function in the `NewOnboarding` component.
- This function will be called only when the user clicks the "Complete Profile" button in the final `CareerGoalsStep`.
- The function will take the complete onboarding data from the central state object and submit it to Supabase in a single transaction.

### 3. Supabase Logic

- I will create a new Supabase Edge Function to handle the onboarding data submission.
- This function will receive the onboarding data and perform the necessary `upsert` operations to the `user_profiles`, `user_industries`, `user_experiences`, `user_projects`, and `user_career_goals` tables.
- Using a single Edge Function will ensure that the data submission is atomic and that data consistency is maintained.

## Implementation Steps

1.  **Modify `NewOnboarding.tsx`**:
    -   Create a state object to hold all onboarding data.
    -   Pass down the relevant parts of the state and a handler function to each step component.
    -   Create a function to handle the final submission to Supabase.

2.  **Modify Step Components**:
    -   Remove local state management from each step component.
    -   Receive data and the update handler from props.
    -   Update the central state when the user interacts with the form elements.
    -   Remove Supabase submission logic from `IndustryStep` and `WorkExperienceStep`.

3.  **Create Supabase Edge Function**:
    -   Create a new Edge Function called `onboarding`.
    -   This function will accept a JSON object containing all the onboarding data.
    -   The function will perform the necessary `upsert` operations to the relevant tables.

4.  **Update `CareerGoalsStep.tsx`**:
    -   The `onComplete` prop will now call the new submission function in `NewOnboarding.tsx`.

This plan will result in a more robust and user-friendly onboarding experience. By centralizing the state and submission logic, we can ensure data consistency and provide a smoother user flow.
