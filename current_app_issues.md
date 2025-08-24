# Current App Issues & Outstanding Tasks

## 📋 **OUTSTANDING TASKS CHECKLIST**

### 🔧 High Priority Technical Issues
- [ ] **Edge function error**: Search function returns non-2xx status code
- [ ] **Limited scope**: Discover page search should include papers and books, not just articles
- [ ] **Industry filtering**: No articles appear for selected industry when navigating from discover page after search
- [ ] **Content repetition**: Previously seen articles keep appearing in feed
- [ ] **Missing user_id**: "record new has no field 'user_id'" error when publishing insights
- [ ] **Check constraint violation**: User work experience form violates check constraint on new row insertion
- [ ] **Content display**: No insights appearing in main feed
- [ ] **Industry sync**: Selected industries don't update main feed content
- [ ] **Experience autocomplete**: Tap functionality not working in work experience form
- [ ] **Profile alerts**: Remove alert notifications when profile sections are updated

### 🎨 UI/UX Improvements
- [ ] **Logo placement**: Lightning/logo should be visible in top corner on discover page
- [ ] **Create insight button**: Make sticky at bottom of screen
- [ ] **Projects positioning**: Move projects section above skills in profile
- [ ] **Tab titles**: Insights tab needs title at the top
- [ ] **Insight text centering**: Centre insight texts for better readability
- [ ] **Profile page design**: Overall profile page appearance and design needs improvement
- [ ] **Insight buttons**: Supercharge insight buttons are black, should be lighter
- [ ] **Profile section colors**: Profile section buttons currently all yellow, need variety
- [ ] **Feed button colors**: Change feed button colors for better visual hierarchy

### 📊 Content & Features
- [ ] **Career goals**: "Add career goal" feature not working (needs assessment if required)
- [ ] **Achievement system**: Achievements need to be added programmatically
- [ ] **Book titles**: Backend and frontend issues with book title display
- [ ] **Leaderboard**: Implement user leaderboard functionality
- [ ] **Content card line count issues**: Article/paper cards use fixed 8 lines regardless of author presence; should be 7 lines when authors exist, 8 when no author
- [ ] **Author scrollview squishing**: PaperCard author ScrollView gets compressed, obscuring author names
- [ ] **Dynamic text preview**: Need variable line count that fills available space without exceeding container bounds
- [ ] **Quiz auto-dismiss behavior**: Quizzes disappear after answering instead of staying visible until manual close
- [ ] **Book insight labeling**: "Insight 1", "Insight 2" labels should be replaced with lightbulb icons in industry-colored boxes
- [ ] **Industry name truncation**: "Creative Industries and the Arts" should display as "Creative and the Arts" to save space
- [ ] **Missing saved content in profile**: Profile section needs saved content scrollview between learning activity and achievements
- [ ] **Top news insights**: Introduce "top news insights of the day" feature
- [ ] **User prompts**: Add prompts and activities for users when they log on
- [ ] **Supercharged Simon**: Explore more ways to involve Supercharged Simon character
- [ ] **Achievement ideas**: Think of new achievement types and implementation

### 🎯 New Feature Requests
- [ ] **Saved content not being added to feed when tapped**
- [ ] **Passwords don't match in onboarding**
- [ ] **Dream job dream company the margins are off** - compare to other sections
- [ ] **Change streaks so there's only 4 options (no scroll)** and have options 5, 10, 20, 40 for days
- [ ] **Make default colour dark**
- [ ] **Prompts and activities for people to do when they log on**
- [ ] **Profile completion maybe combine with the above**
- [ ] **Take them to profile after onboarding with steps to complete at the top**
- [ ] **Steps to complete take you to where you need to be to do it**
- [ ] **Steps to complete award voltz points** and there should be a quiz-style pop up modal which congratulates you when you complete it
- [ ] **Steps to complete should be tied directly to achievements**
- [ ] **Leaderboard somewhere in profile**
- [ ] **Basic share feature**
- [ ] **On discover page add numbers next to comments and saves plus switch order of comments and saves**

### 🐛 Data Issues
- [ ] **Negative counts**: "Four Steps to Epiphany" book shows -1 on likes, comments, and saves
- [ ] **Spanish titles**: "Yale Climate Connections" displaying Spanish title instead of English
- [ ] **Duplicate keys**: React warning about "two children with the same key" in main feed

### 💰 Voltz Economy System
- [ ] **Voltz spending options**: Need more ways for users to spend voltz points
- [ ] **Voltz ecosystem expansion**: Current voltz points ecosystem needs more functionality

### 🔄 Feed & Content Updates
- [ ] **Feed updates**: Industry selection should trigger main feed refresh

---

## ✅ **COMPLETED ITEMS** (Recent Updates)

### 🎨 Visual Design & Styling (COMPLETED)
- ✅ **Read more button**: Changed "read more" button text to black in both light and dark modes
- ✅ **Book insights coloured and bold**: Made all book insight text consistently bold and colored with industry colors
- ✅ **Book cover colour as whole background**: Updated book covers to use full industry color as background with white text
- ✅ **Quiz celebration emoji**: Changed from 🎉 to ⚡ when getting quiz answers correct
- ✅ **Random book colours**: Updated books to use randomized colors based on industry ID hash
- ✅ **All buttons black text**: Fixed globally via theme colors for consistent button text
- ✅ **Different colours for discover pills**: Each industry pill now has its own color with proper active/inactive states
- ✅ **Saved content industry titles colour coded**: Industry names now display in their respective colors
- ✅ **Overall color monotony**: App now has more color variety throughout
- ✅ **Book industry colors**: Books have different colors based on their industry classification
- ✅ **Industry selection styling**: Updated streaks UI and industry selection interfaces
- ✅ **Comment/save buttons**: Moved comment button to middle and save button to end in main feed

### 🔧 Technical Fixes (COMPLETED)
- ✅ **Saved content cards layout**: Fixed big gap between content type and industry name in header row
- ✅ **Time spent learning replaced with streaks**: Updated Learning Activity to show streak data with flame icon
- ✅ **Content engaged counter**: Fixed to show actual count of unique content pieces user has interacted with
- ✅ **Streak tracking system**: Created database function for proper streak tracking with user_streaks table
- ✅ **Streak display**: Fixed singular/plural display (1 day vs X days) and ensured minimum streak of 1
- ✅ **Politics industry name**: Updated from "Politics, Law and International Relations" to "Politics and International Relations"

### 📱 Onboarding Flow (COMPLETED)
- ✅ **Get started text**: Changed text color to black for better readability
- ✅ **Email input positioning**: Moved email address field up on "what's your email" page
- ✅ **Continue button styling**: Reviewed shade of yellow for continue button
- ✅ **Verification flow**: Moved code verification step behind email input step
- ✅ **Email verification page**: Created dedicated email verification code page
- ✅ **Industry selection**: Reformed search industries button design
- ✅ **Post-industry text**: Added instructional text after choosing industries
- ✅ **Dream role positioning**: Moved dream role box up on page
- ✅ **Dream role autofill**: Investigated lists for dream role autocomplete functionality
- ✅ **Dream company positioning**: Moved dream company box up on page
- ✅ **Weekly goal design**: Redesigned set weekly goal page layout
- ✅ **Current work layout**: Moved input boxes up on current work page
- ✅ **Search placeholder spacing**: Fixed letter spacing in industry selection search bar

### 🔧 Input Fields & Forms (COMPLETED)
- ✅ **Autofill positioning**: Fixed autofill dropdown appearing below other input fields (z-index issue)
- ✅ **Autofill submission**: Added option to submit custom text if desired option not available

### 🎯 Quiz System (COMPLETED)
- ✅ **Premature quiz display**: Fixed quiz questions appearing on main feed load before user has time to read related article
- ✅ **Incorrect rewards**: Fixed to show "+5 XP" instead of "+5 voltz" when quiz answered correctly
- ✅ **Missing close button**: Added way to dismiss/close quiz questions
- ✅ **Quiz question title**: Updated quiz question title text/styling
- ✅ **Timing issue**: Fixed quiz relating to article that just appeared, now gives users time to read first

---

## 📈 Development Status & Feedback

### Current State Assessment
- ✅ **Progress**: Significant progress made on UI/UX improvements and core functionality
- ⚠️ **Focus Areas**: Technical backend issues, search functionality, and content management
- 🎯 **Next Priority**: Search function fixes, insight publishing errors, and industry filtering

### Main Problem Areas Remaining
1. **Search & Discovery**: Multiple technical issues with search functionality
2. **Content Management**: Publishing insights, industry filtering, and content display issues
3. **Data Integrity**: Negative counts, language issues, and duplicate keys

### Development Focus
- Fix critical search and discovery functionality
- Resolve insight publishing and content display issues
- Improve data integrity and consistency
- Continue enhancing user experience with remaining UI improvements

---

_This list represents current outstanding tasks and completed work. Items should be prioritized based on user impact and technical dependencies._