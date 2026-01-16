# V2 Plan

## Restructure Layout

We’re going from a 5-tab confusing design to a **new simple 3-tab design.**

Aim:

- Easier to use
- Nicer on the eye
- Clearer purpose of each app function + all tied in

### Requirements

- [ ]  There are 3 tabs at the bottom
- [ ]  Each tab navigates to a tab which is labelled appropriately
- [ ]  We are able to revert if we want
- [ ]  We have reused components where possible

## Tweak feed

Whilst the feed is looking nice with the new designs, we must introduce **filtering + improve algorithm** to ensure a better scrolling experience.

### Requirements

- [ ]  Ability to filter feed e.g. to see one specific industry, to see stuff that’s popular, to see most recent etc. This should be at the top; there should be a carousel like Tiktok has which allows you to slide through your chosen industries and see the feed filtered for each one. Note that the initial feed they open should just be a default feed of everything, then they swipe to the right to filter for a specific industry. There should also be a dedicated filter button which enables them to filter by popular or most recent. 
- [ ] There should be a search icon in the top right. Tapping this should slide a search bar open (where the filters are, removing them temporarily). Typing in this search bar can borrow logic from the "vault" - we fetch relevant terms from the database using our embeddings, then we can display these in a sort of little search "dropdown" as results with just their titles and sources (see searchLayout.jpeg)
- [ ]  Algorithm should show people what they ACTUALLY want to see rather than random nonsense.
    - [ ]  Algorithmic interaction tracking e.g. keep track of what they’ve liked, viewed for longer, read fully etc. This should inform what they're shown in future loosely (can be a basic algorithm as it is currently - we only have a week)
    - [ ]  Posthog tracking can tie in (though that’s mainly for us to see what users are doing). We should track all their movements with posthog and log it, including in onboarding.
        - [ ]  Should be EXTENSIVE and track every minute detail so we can work out what people are doing on the app
- [ ]  Discuss about introducing groups + what MVP would be for that
- [ ]  Need to tweak how content interaction works - there should be an emphasis on users consolidating information to their knowledge profile, and in order to do this they should have to interact **meaningfully** with the content e.g. there should be a clear prompt at the bottom of each piece of content to "consolidate" it by commenting meaningfully on it via creating a post or a standard comment. We should give clear visual feedback to users to show they have interacted meaningfully with the content and that it's been consolidated to their knowledge profile.
    

## Bring in "create" tab

Need a dedicated space for users to create content which **actively encourages** them to do so.

### Requirements

- [ ]  Navigating to the create tab gives users a simple option to create insights (as before)
- [ ]  Introduce ability to create insights **with images**.
- [ ]  Timelapse feature - feasibility, integration considerations
    - [ ]  Users can start a time lapse
    - [ ]  Users see a pomodoro-style timer
        - [ ]  Choose length prior if they wish
        - [ ]  Count up OR down, not sure
        - [ ]  UP would probably fine to show them how long they’ve actually worked
    - [ ]  Users can create a post FROM that timelapse
    - [ ]  Users can download timelapse
    - [ ]  Timelapse is stored in database and is shown in their knowledge profile
- [ ]  Ability to make posts public or private

## Knowledge Profile

The knowledge profile is the main place where users see their own content + analytics + friends.

### Requirements

- [ ]  Instagram-inspired design
    - [ ]  Shows who’s following you and who you’re following
    - [ ]  Keep profile pic
    - [ ]  Knowledge profile contained **within**
        - [ ]  Productivity stats
            - [ ]  Deep work (full content read)
            - [ ]  Productivity time logged (UGC)
            - [ ]  Productivity streak
            - [ ]  Minutes learned
        - [ ]  Saved / consolidated content somehow condensed within
        - [ ]  UGC contained within + analysed if possible
        - [ ]  DESIGN similar to spotify wrapped
- [ ]  Settings unchanged in top corner as before


## Onboarding

supercharged-onboarding shows something i was playing around with. I like it a lot, and it got good feedback, but the trouble is that the animated character isn't really what we're going for vibe-wise. Also, we've changed a bit what we're going to ask for in onboarding. Therefore, I'm going to leave onboarding for a bit whilst I think about where I'm going to take it more. For now, let's focus on the other sections and getting the actual app feeling good.
