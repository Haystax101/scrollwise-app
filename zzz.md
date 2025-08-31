[-] CongratulationsScreen.tsx the bit before the exclamation mark should be the title, not just the default one we have currently.
[-] Profile light theme needs to look better e.g. all components need a light version
-> Set dark theme as the default. Could maybe remove the "system" option for now in settings.
[] Achievements
-> Table called "achievements" with all available achivements. Seed using achievementsList.md, but reduce the amount of voltz awarded as that'll get ridiculous very quickly. Each level will be 1000 voltz, so attribute voltz to achievements accordingly (an easy achievement can be about 1/4 of a level, so 250, whereas a trickier one could be up to 750/1000. Give more weight to achievements which help grow the platform).
-> Trigger or edge function tracking when the user meets the requirements.
-> May need to track additional stuff later in the database like content shares etc. but this isn't MVP.
-> Generate standard UI then have icons which get increasingly cooler as the difficulty increases maybe.
-> Colour coding for different types e.g. those to do with sharing / learning etc.
-> Reward app sharing heavily.
[] Voltz awarding for insight posts
-> When someone likes your post +5 voltz
-> When someone comments on your post +10 voltz
-> When someone saves your post +10 voltz
[] Voltz awarding for achievements SEE EMAIL
-> Track in same supabase function as above
-> Number of voltz awarded dependent on how prolific award is
[] Voltz awarding for learning activities
-> Check quiz voltz awarding is working ok - give 20 voltz instead of 5 for correct answer, then 5 for wrong answer.
[] Voltz awarding for platform loyalty
-> Give +5 voltz for daily login
-> If login streak is reached, gain a bonus equal to their streak selection x 5 voltz.
-> Profile section completion tasks see other email
[] Voltz awarding for social growth
-> Invite friend +100 voltz
-> Viral content (100+ likes) could give bonus voltz (though you'd think we're already awarding per like and comment so maybe not to be honest)
-> Leaderboard position +5, or +10 if in top 10, or +20 if in top 5. +50 if #3, +100 if #2 and +200 if #1.
[] Supercharged insights
-> Rather than boolean, need integer field with how many voltz they spent.
-> For UI, this is fine as 0 just means it isn't supercharged
-> Adjust algorithm to account for supercharged insights - attempt to gain the advertised boost (see email for new rates).
[] Post onboarding steps
-> Create component with completion circle showing how far through the steps they are along with the next step to complete
-> Only render component in profile if they haven't yet completed all the steps.
-> COULD use the profile completion field of profiles table (i.e. 100 means completed, then just divide by number of steps there are to track their progress through it)
-> Alternatively could use a separate table with a boolean field for each step.
-> For each step, have a trigger function that runs when the user completes it.
-> Award voltz / achievements (if appropriate) for each step
-> Steps should include:
-> "Explore and Engage": Browse the feed and read at least 3 posts. - Reward: 100 voltz + "Platform Explorer" achievement
-> "Complete your Profile": Add profile picture, fill out education, skills and experience. - Reward: 200 voltz + "Profile Perfectionist" achievement
-> "Join the Conversation": Leave 2 comments and complete 1 quiz. - Reward: 150 voltz + "Community Member" achievement.
-> "Share your Knowledge": Publish your first insight. - Reward: 200 voltz + "First Words" achievement.
-> TO BE ADDED LATER - Spread the word: Share any post to your social media AND invite 1 friend - Reward: 400 voltz + "Growth Champion" achievement.
-> Completion Bonus (all 4 initially, then all 5 later): "Tutorial Graduate" achievement. - Reward: 1000 voltz + 3 day voltz multiplier boost (TO BE ADDED LATER).
[] feedAlgorithm: need to adjust feedAlgorithm.ts to push a user's insights more if they supercharged it. this can be fairly rudimentary early on (given we don't have many users) - if they supercharge it, we can just ensure all other users see it regardless of which industries they're interested in. then later, we can work on this algorithm more thoroughly.
-> May want to keep a table of supercharged insights which we can query when running the feed algorithm to prioritise which insights we show users first.
