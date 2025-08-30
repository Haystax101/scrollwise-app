[-] CongratulationsScreen.tsx the bit before the exclamation mark should be the title, not just the default one we have currently.
[-] Profile light theme needs to look better e.g. all components need a light version
-> Set dark theme as the default. Could maybe remove the "system" option for now in settings.
[] Achievements
-> Table called "achievements" with all available achivements.
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
