# Current App Issues & Observations

## 🔍 User Interface & Experience

### Onboarding Flow

- ✅ **Get started text**: Change text color to black for better readability
- ✅ **Email input positioning**: Move email address field up on "what's your email" page
- ✅ **Continue button styling**: Review shade of yellow for continue button
- ✅ **Verification flow**: Move code verification step behind email input step
- ✅ **Email verification page**: Create dedicated email verification code page
- ✅ **Industry selection**: Reform search industries button design
- ✅ **Post-industry text**: Add instructional text after choosing industries
- ✅ **Dream role positioning**: Move dream role box up on page
- ✅ **Dream role autofill**: Investigate lists for dream role autocomplete functionality
- ✅ **Dream company positioning**: Move dream company box up on page
- ✅ **Weekly goal design**: Redesign set weekly goal page layout
- ✅ **Current work layout**: Move input boxes up on current work page
- ✅ **Search placeholder spacing**: Fixed letter spacing in industry selection search bar

### Input Fields & Forms

- ✅ **Autofill positioning**: Autofill dropdown appears below other input fields (z-index issue)
- ✅ **Autofill submission**: Input fields with autofill need option to submit custom text if desired option not available
- **Experience autocomplete**: Tap functionality not working in work experience form
- **Profile alerts**: Remove alert notifications when profile sections are updated

### Quiz System

- ✅ **Premature quiz display**: Quiz questions appear on main feed load before user has time to read related article
- ✅ **Incorrect rewards**: Shows "+5 voltz" instead of "+5 XP" when quiz answered correctly
- ✅ **Missing close button**: No way to dismiss/close quiz questions
- ✅ **Quiz question title**: Update quiz question title text/styling
- ✅ **Timing issue**: Quiz relates to article that just appeared, not giving users time to read first

### Search & Discovery

- **Edge function error**: Search function returns non-2xx status code
- **Limited scope**: Discover page search should include papers and books, not just articles
- **Industry filtering**: No articles appear for selected industry when navigating from discover page after search
- **Content repetition**: Previously seen articles keep appearing in feed

## 🎨 Visual Design & Styling

### Color Schemes & Theming

- ✅ **Overall color monotony**: App currently too monotone, needs more color variety to spice up design
- ✅ **Book industry colors**: Books need different colors based on their industry classification
- **Discover page colors**: Different color scheme needed for discover page, especially industry buttons
- **Insight buttons**: Supercharge insight buttons are black, should be lighter
- **Profile section colors**: Profile section buttons currently all yellow, need variety
- **Feed button colors**: Change feed button colors for better visual hierarchy
- ✅ **Read more button**: Change "read more" button text to black
- ✅ **Industry selection styling**: Streaks UI could be updated to look similar to industry selection interface

### Layout & Positioning

- **Logo placement**: Lightning/logo should be visible in top corner on discover page
- **Create insight button**: Make sticky at bottom of screen
- **Projects positioning**: Move projects section above skills in profile
- **Tab titles**: Insights tab needs title at the top
- **Insight text centering**: Centre insight texts for better readability
- ✅ **Comment/save buttons**: Move comment button to middle and save button to end in main feed
- **Profile page design**: Overall profile page appearance and design needs improvement

## 🔧 Technical Issues

### Database & Backend

- **Missing user_id**: "record new has no field 'user_id'" error when publishing insights
- **Check constraint violation**: User work experience form violates check constraint on new row insertion
- **Content display**: No insights appearing in main feed
- **Industry sync**: Selected industries don't update main feed content

### Data Issues

- **Negative counts**: "Four Steps to Epiphany" book shows -1 on likes, comments, and saves
- **Spanish titles**: "Yale Climate Connections" displaying Spanish title instead of English
- **Duplicate keys**: React warning about "two children with the same key" in main feed

## 📊 Content & Features

### Missing Functionality

- **Career goals**: "Add career goal" feature not working (needs assessment if required)
- **Achievement system**: Achievements need to be added programmatically
- **Book titles**: Backend and frontend issues with book title display
- **Leaderboard**: Implement user leaderboard functionality
- **Streaks display**: Create proper streaks display system

### Content & Engagement Features

- **Content card line count issues**: Article/paper cards use fixed 8 lines regardless of author presence; should be 7 lines when authors exist, 8 when no author
- **Author scrollview squishing**: PaperCard author ScrollView gets compressed, obscuring author names
- **Dynamic text preview**: Need variable line count that fills available space without exceeding container bounds
- **Quiz auto-dismiss behavior**: Quizzes disappear after answering instead of staying visible until manual close
- **Book insight labeling**: "Insight 1", "Insight 2" labels should be replaced with lightbulb icons in industry-colored boxes
- **Industry name truncation**: "Creative Industries and the Arts" should display as "Creative and the Arts" to save space
- **Missing saved content in profile**: Profile section needs saved content scrollview between learning activity and achievements
- **Top news insights**: Introduce "top news insights of the day" feature
- **User prompts**: Add prompts and activities for users when they log on
- **Supercharged Simon**: Explore more ways to involve Supercharged Simon character
- **Achievement ideas**: Think of new achievement types and implementation
- [ ] Read more button should be black text in dark mode too
- [ ] For book insights try having it all coloured. Make it all bold like the coloured bit is currently.
- [ ] Try book cover colour being whole background
- [ ] Change celebration emoji to lightning bolt when you get quiz correct
- [ ] Book colour should be random
- [ ] All buttons black text even on dark mode
- [ ] On discover page add numbers next to comments and saves plus switch order of comments and saves
- [ ] Have different colours for each pill at top of discover.
- [ ] Saved content scrollview: colour code the industry title
- [ ] Change time spent learning to streaks
- [ ] Saved content not being added to feed when tapped
- [ ] Passwords don't match in onboarding
- [ ] Dream job dream company the margins are off - compare to other sections
- [ ] Change streaks so there's only 4 options (no scroll) and have options 5, 10, 20, 40 for days
- [ ] Make default colour dark
- [ ] Prompts and activities for people to do when they log on
- [ ] Profile completion maybe combine with the above
- [ ] Take them to profile after onboarding with steps to complete at the top
- [ ] Steps to complete take you to where you need to be to do it
- [ ] Steps to complete award voltz points and there should be a quiz-style pop up modal which congratulates you when you complete it. 
- [ ] Steps to complete should be tied directly to achievements.
- [ ] Leaderboard somewhere in profile
- [ ] Basic share feature
- [ ] Remove law from the politics industry title (since we aren't covering law yet)

### Voltz Economy System

- **Voltz spending options**: Need more ways for users to spend voltz points
- **Voltz ecosystem expansion**: Current voltz points ecosystem needs more functionality

### Content Suggestions

- **Streaks replacement**: Consider replacing "time spent learning" metric with streaks
- **Feed updates**: Industry selection should trigger main feed refresh

## 🎯 Priority Classification

### High Priority (User Experience Blockers)

1. Quiz timing and display issues
2. Search function errors
3. Insight publishing errors
4. Industry filtering not working
5. Onboarding flow improvements
6. Voltz ecosystem expansion

### Medium Priority (UI/UX Improvements)

1. Overall color monotony fixes
2. Profile page design overhaul
3. Feed button and layout improvements
4. Autofill positioning and functionality
5. Button styling consistency

### Low Priority (Nice to Have)

1. Achievement system automation
2. Leaderboard implementation
3. Supercharged Simon integration
4. Content metric replacements
5. User engagement prompts

## 📈 Development Status & Feedback

### Alpha Run 1 Assessment

- ✅ **Progress**: Very good progress made, most of the core structure is in place
- ⚠️ **Current State**: Needs work to clean up bugs and integrations
- 🎯 **Timeline**: On track for late August beta release

### Main Problem Areas

1. **Color & Design**: Currently too monotone; needs visual variety and enhancement
2. **Voltz Economy**: Needs more ways for users to spend voltz points effectively

### Development Focus

- Clean up existing bugs and technical issues
- Enhance visual design and color schemes
- Expand voltz points ecosystem functionality
- Improve onboarding user experience

---

_This list represents current observations and should be prioritized based on user impact and development resources._
