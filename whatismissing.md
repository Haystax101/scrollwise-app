# This is a document detailing what is missing from the current prototype that we need to add prior to launch. Note some ideas will be fleshed out more post-launch.

1. Groups

Currently, we have a basic system in place. However, it isn't launch ready. See groups.md, in particular the v1.0 core features section,for more details. That file is a bit too comprehensive so we'll need to pick and choose what we actually choose to implement over the next few days. 

2. Feed

The feed design in SpecialArticleCard is set up how we want it, however i'm not happy with the layout of the bottom buttons, and we are yet to implement in-feed consolidation prompting e.g. a large CTA full-width button encouraging the user to consolidate their knowledge from the post by dropping a comment (comments which, as discussed, now need to appear in the community feed for your friends to see). We have also not given thought to display of podcasts, videos, books, and papers. I think we will likely use the same design as articles at the moment for simplicity. 

We need to adjust the algorithm to, rather than just fetching the first bit of content from the articles table we find, instead use our algorithm we discussed which is based on embeddings of users + content to recommend the most relevant content to each user. This should draw from all content types once we've implemented them. We will also need a basic algorithm for the community feed - we can just use a basic separarate one which fetches stuff that people / groups you follow have posted (or most popular stuff if you're not following anyone / if there's nothing to show).

3. Leaderboard and Voltz

Currently, we are still on the "old" legacy voltz and level system. We're looking to move towards voltz just being a tracker for how much posting you've done - so 1 voltz for a standard insight or comment, 2 voltz for a photo insight, or 3 voltz for every 10 minutes of timelapses. Hence we'll need to reset everyone's voltz + consider removing the level system. 

4. Profile

The profile is quite a way off what we need currently. Firstly, we need to switch from a "friends" system to a "followers" system wherein users can follow other users, groups, and communities. We should display the number of followers and they number of people+groups a user is following in their profile, probably alongside their profile picture horizontally like instagram do. Tapping on each of these should bring up a modal which tells them explicitly who constitutes that number (people who follow you / people + groups you're following). For the following modal, there should be a filter to just see groups you're following and a filter to just see people you're following. Search bar isn't required at the moment since volume of followers and following will be low. 

Furthermore, the timelapse view modal has some warnings which should be addressed:  WARN  The `allowsFullscreen` prop is deprecated and will be removed in a future release. Use `fullscreenOptions` prop instead.
 WARN  On iOS `VideoPlayer.replace` loads the asset data synchronously on the main thread, which can lead to UI freezes and will be deprecated in a future release. Switch to `replaceAsync` for better user experience. 
 Previews of these timelapses should be the first image in the timelapse rather than just a camera icon. Tapping on insights (be they photo or just text insights) in the grid should enable us to edit or delete them. We can bring up a modal, reusing existing components if easiest. 

 Tapping on our profile photo should allow us to edit or delete our profile picture - currently tapping it just enables us to change our tagline. Tapping on our tagline itself should do this instead.

 Finally, there should be some way to change which industries we are interested in from our profile. This should fit in cohesively with the rest of the profile. It can take us to a modal or page where we can select or deselect our industries. Again, we have a component for this already so just redesign (remembering to now use hero icons rather than what we were using before). 

5. Other people's posts / profiles

We have in our codebase a modal for viewing people's profiles (when we tap on their profile picture / name on a post). We need to adjust this modal so that it meets the new profile design standard + arrangement. We should ensure that blocking and muting functionality is present in this modal. Tapping on a user when looking through followers / following in the profile should bring up this same modal, and offer the same functionality. Since we now have direct messaging, we should also add a button to send a message to the user in this modal. This modal should also display their followers and following counts, and tapping that should bring up the same modal as tapping on followers / following in the profile. We'll need to ensure RLS allows this because we'll be accessing the followers and following of other users. Ensure back buttons are included where needed so people don't get lost. 

6. DMs

In the chat page there's a "plus" icon by the text field. We can remove this for now - we will bring it back later down the line when we have things to use it for.



# It is important to stress that most of the functionality above is already implemented in our codebase so just needs to be redesigned / restructured to fit our new requirements. 