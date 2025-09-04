read profilePlan.md. create a comprehensive several-phase plan which aims to address everything related to the profile. you can use the plan file where instructed, but otherwise should follow my guidance in this prompt more closely.
the industry interest update bug still exists so we should proceed with part 1 of the plan as mentioned.
the level progress bar should, whenever the │
│ user gains voltz, do an animation of it filling up to the point they're currently at. the levels should now be 100, 300, 600, 1000, 1500, 2100 etc. │
│ rather than the previous amounts (maybe this has already been done). for the fill-up animations, if the voltz they gain causes them to level up we │
│ should render the progress bar starting on their previous level (before gaining the voltz), then fill the progress bar and give some appealing visual │
│ effect. then the bar should reset to the start of the next level and fill up to where the earned voltz got them. this will make it far more visually │
│ appealing and gamified. a similar thing should occur for voltz. if gaining voltz causes them to increase on the leaderboard i.e. become higher │
│ ranked, we should animate the number going down e.g. change colour whilst decrementing to their new position. if someone supercedes them in real │
│ time, it should go a different colour again and increment similarly. if they move into / out of the top 2 we should animate them sliding nicely into │
│ the slot. we will obviously need to ensure we are subscribed to real-time updates to enable this on the leaderboard. ensure the leaderboard uses #1, │
│ #2 etc. instead of medals. tapping on someone else in the leaderboard should have a pop up of their basic profile details, the same as when tapping │
│ on the three dots on insightCard. for achievements, we should use a range of different colours, not just gold. when an achievement is earned we │
│ should have a modal that appears (non-abruptly - use a nice animation) with a centred rounded rectangle and the achievement's icon in the centre + │
│ the name and requirement for the achievement + how many voltz they earned due to it (you'll need to make a new component for this). in terms of │
│ achievement arrangement, for now just have them in the same scrollview but they should be square shaped with around 2 fitting on the screen at any │
│ one time. In the square should just be its icon + its name. then tapping on the achievement should bring up the same modal that came up when they │
│ first earned it, but when they first earn it should have title "new achievement unlocked" whereas when they tap on an already earned achievement it │
│ shouldn't say that. moreover, the achievements scrollview should also contain all un-earned achievements, but greyed out with a dotted border instead │
│ of a solid border. when tapped, the same modal again should pop up, but it should be implicit that they haven't earned it yet by again greying out the icon and this time on the modal it should tell them what they need to do to complete the achievement (needn't tell them their progress towards it, just the generic text explaining what's needed for that achievement).
achievements should not be shareable yet so don't worry about that part of the plan.
there should not be a timeline of achievement unlocks and no suggested achievements - let's keep it simple!
In terms of arrangement of the achievements scrollview, we should display all the ones they've already achieved first, followed by the greyed out dotted border ones that they're yet to achieve.
Currently profile photo upload and display logic isn't included/ working. We need to reintroduce this using supabase buckets. there should be some existing logic (which once worked but doesn't anymore and is disconnected from the functioning app so we may need a reimplementation to get it working again). They should have option to upload their own photo or choose from their photo gallery. you should use the appropriate expo library to help you with this stuff.
I have removed obsolete stuff from the plan so i apologise for the fragmentation. You shouldn't implement something if it doesn't align with what i've mentioned in this prompt. You should rewrite profilePlan.md to reflect the profile requirements i've outlined. take your time and do not hesitate to ask clarifying questions as this is an extreme amount of work which needs careful review and forethought.
