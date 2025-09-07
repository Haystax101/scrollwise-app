import { EducationCard } from './EducationCard';
25 import { SkillsCard } from './SkillsCard';
26 import { IndustrySelectionPage } from './IndustrySelectionPage';
27 + import { PhotoUploadModal } from './PhotoUploadModal';
28 import { CareerGoalEditModal } from './CareerGoalEditModal';
29 import { SavedContentScrollView } from './SavedContentScrollView';
30 import { OnboardingProgressCard } from '../onboarding/OnboardingProgressCard';
...
34 signOut?: () => Promise<void>;
35 }
36  
 37 - // Remove local Achievement interface, use the one from AchievementService
38 -  
 37 interface CareerGoal {
38 goal: string;
39 timeframe: string;
...
89 <Text style={{ color: '#fff', fontSize: 14, marginTop: 10 }}>User:
{userProp?.email || 'Not found'}</Text>
90 </View>
91 );
92 - };
93 - console.log('🔍 NewProfile: Component initializing', {
94 - hasUser: !!userProp,
95 - userId: userProp?.id,
96 - userEmail: userProp?.email
97 - });
98 -  
 99 - try {
100 - const { colors, isDark } = useTheme();
101 - console.log('🔍 NewProfile: Theme loaded', { isDark });
102 -  
 103 - const router = useRouter();
104 - console.log('🔍 NewProfile: Router loaded');
105 -  
 106 - const { refreshIndustries } = useIndustries();
107 - console.log('🔍 NewProfile: Industries context loaded');
108 -  
 109 - // Core profile data
110 - const [currentUser, setCurrentUser] = useState<any>(null);
111 - const [fullName, setFullName] = useState<string>('');
112 - const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
113 - const [totalVoltzEarned, setTotalVoltzEarned] = useState<number>(0);
114 - const [userLevel, setUserLevel] = useState<number>(1);
115 - const [spendableVoltz, setSpendableVoltz] = useState<number>(0);
116 - const [levelProgress, setLevelProgress] = useState<number>(0);
117 - const [voltzForCurrentLevel, setVoltzForCurrentLevel] = - useState<number>(0);
118 - const [voltzForNextLevel, setVoltzForNextLevel] = useState<number>(100);
119 - const [isLevelled, setIsLevelled] = useState<boolean>(false);
120 -  
 121 - // Track previous values for level-up animations (simplified - mainly for - debugging)
122 - const [previousLevel, setPreviousLevel] = useState<number | - undefined>(undefined);
123 - const [previousVoltz, setPreviousVoltz] = useState<number | - undefined>(undefined);
124 -  
 125 - // Refs to track subscription state and component lifecycle
126 - const achievementsSubscriptionRef = useRef<any>(null);
127 - const profileChannelRef = useRef<any>(null);
128 - const isMountedRef = useRef(true);
129 -  
 130 - // Ref to safely access userLevel in subscription callbacks without - dependency loops
131 - const userLevelRef = useRef(userLevel);
132 - useEffect(() => {
133 - userLevelRef.current = userLevel;
134 - }, [userLevel]);
135 -  
 136 -  
 137 - // Component data states
138 - const [achievements, setAchievements] = useState<UserAchievement[]>([]);
139 - const [careerGoal, setCareerGoal] = useState<CareerGoal | null>(null);
140 - const [industries, setIndustries] = useState<Industry[]>([]);
141 - const [showOnboardingProgress, setShowOnboardingProgress] = - useState<boolean>(false);
142 - const [learningStats, setLearningStats] = useState<LearningStats>({
143 - currentStreak: 0,
144 - totalInteractions: 0,
145 - achievementsCount: 0
146 - });
147 - const [profileData, setProfileData] = useState<ProfileData>({});
148 -  
 149 - // UI states
150 - const [loading, setLoading] = useState(true);
151 - const [isSettingsModalVisible, setIsSettingsModalVisible] = - useState(false);
152 - const [showIndustrySelection, setShowIndustrySelection] = useState(false);
153 - const [showCareerGoalModal, setShowCareerGoalModal] = useState(false);
154 -  
 155 - // Component lifecycle management
156 - useEffect(() => {
157 - isMountedRef.current = true;
158 - return () => {
159 - isMountedRef.current = false;
160 - };
161 - }, []);
162 -  
 163 - // Get current user
164 - useEffect(() => {
165 - // TODO: Temporarily commented out to isolate crash - re-enable after - testing
166 - // const getUser = async () => {
167 - // const { data } = await supabase.auth.getUser();
168 - // if (isMountedRef.current) {
169 - // setCurrentUser(data?.user || null);
170 - // }
171 - // };
172 - // getUser();
173 -  
 174 - // Use the prop user directly for now
175 - if (isMountedRef.current) {
176 - setCurrentUser(userProp || null);
177 - }
178 - }, [userProp]);
179 -  
 180 - // Fetch all profile data
181 - const fetchProfileData = useCallback(async () => {
182 - if (!currentUser || !isMountedRef.current) return;
183 -  
 184 - if (isMountedRef.current) {
185 - setLoading(true);
186 - }
187 - try {
188 - // Fetch basic profile info
189 - const { data: profileData, error: profileError } = await supabase
190 - .from('profiles')
191 - .select('full*name, email, created_at, avatar_url')
192 - .eq('id', currentUser.id)
193 - .single();
194 -  
 195 - if (profileError) {
196 - console.error('Error fetching profile:', profileError);
197 - } else if (profileData && isMountedRef.current) {
198 - setFullName(profileData.full_name || '');
199 - // Use profile image service to get proper URL with default fallback
200 -  
 - setAvatarUrl(profileImageService.getProfileImageUrl(profileData.avatar_url));
201 - }
202 -  
 203 - // Fetch comprehensive voltz stats using voltzService
204 - const voltzStats = await voltzService.getVoltzStats(currentUser.id);
205 - if (isMountedRef.current) {
206 - // Store previous values for debugging
207 - setPreviousLevel(userLevel);
208 - setPreviousVoltz(totalVoltzEarned);
209 -  
 210 - // Update all voltz and level data
211 - setTotalVoltzEarned(voltzStats.totalVoltzEarned);
212 - setUserLevel(voltzStats.level);
213 - setSpendableVoltz(voltzStats.spendableVoltz);
214 - setLevelProgress(voltzStats.levelProgress);
215 - setVoltzForCurrentLevel(voltzStats.voltzForCurrentLevel);
216 - setVoltzForNextLevel(voltzStats.voltzForNextLevel);
217 - setIsLevelled(voltzStats.isLevelled);
218 -  
 219 - console.log('📊 Profile loaded - isLevelled:', voltzStats.isLevelled, - 'Level:', voltzStats.level);
220 - }
221 -  
 222 - // CRITICAL: Proper update sequence for real-time changes
223 - try {
224 - // Step 1: Check and award any new achievements the user has earned
225 - console.log('Checking for new achievements...');
226 - // TODO: Re-enable when check_all_user_achievements RPC function is - created in database
227 - // const { data: newAchievements, error: checkError } = await - supabase
228 - // .rpc('check_all_user_achievements', { target_user_id: - currentUser.id });
229 -  
 230 - // if (checkError) {
231 - // console.error('Error checking new achievements:', checkError);
232 - // } else if (newAchievements && - newAchievements[0]?.newly_awarded_count > 0) {
233 - // console.log(`Awarded ${newAchievements[0].newly_awarded_count} 
           - new achievements!`);
234 - //  
 235 - // // Step 2: If achievements were awarded, refresh voltz stats
236 - // // The database trigger will automatically set is_levelled=true - if user leveled up
237 - // console.log('Refreshing voltz stats after achievement - awards...');
238 - // const updatedVoltzStats = await - voltzService.getVoltzStats(currentUser.id);
239 - // if (isMountedRef.current) {
240 - // // Update all voltz and level data
241 - // setTotalVoltzEarned(updatedVoltzStats.totalVoltzEarned);
242 - // setUserLevel(updatedVoltzStats.level);
243 - // setSpendableVoltz(updatedVoltzStats.spendableVoltz);
244 - // setLevelProgress(updatedVoltzStats.levelProgress);
245 - //  
 - setVoltzForCurrentLevel(updatedVoltzStats.voltzForCurrentLevel);
246 - // setVoltzForNextLevel(updatedVoltzStats.voltzForNextLevel);
247 - // setIsLevelled(updatedVoltzStats.isLevelled);
248 - //  
 249 - // console.log('🏆 After achievements - isLevelled:', - updatedVoltzStats.isLevelled);
250 - // }
251 - // }
252 -  
 253 - // Step 3: Fetch all user achievements (including any newly awarded - ones)
254 - const achievementsData = await - AchievementService.getUserAchievements(currentUser.id);
255 - if (isMountedRef.current) {
256 - setAchievements(achievementsData);
257 - }
258 - } catch (achievementsError) {
259 - console.error('Error fetching achievements:', achievementsError);
260 - if (isMountedRef.current) {
261 - setAchievements([]);
262 - }
263 - }
264 -  
 265 - // Step 4: Check onboarding progress based on achievements
266 - try {
267 - // Get current progress based on existing achievements
268 - const onboardingProgress = await - onboardingService.getProgress(currentUser.id);
269 -  
 270 - // Check if onboarding completion achievement should be awarded
271 - await onboardingService.checkAndAwardCompletion(currentUser.id);
272 -  
 273 - // Show onboarding card for users who haven't completed all steps
274 - if (isMountedRef.current) {
275 - if (!onboardingProgress || !onboardingProgress.is_completed) {
276 - setShowOnboardingProgress(true);
277 - } else {
278 - setShowOnboardingProgress(false);
279 - }
280 - }
281 - } catch (onboardingError) {
282 - console.error('Error handling onboarding progress:', - onboardingError);
283 - // Default to showing onboarding for new users
284 - if (isMountedRef.current) {
285 - setShowOnboardingProgress(true);
286 - }
287 - }
288 -  
 289 - // Fetch career goals using the enhanced schema
290 - const { data: careerGoalsData, error: careerGoalsError } = await - supabase
291 - .rpc('get_user_career_goals', { user_id_param: currentUser.id });
292 -  
 293 - if (careerGoalsError) {
294 - console.error('Error fetching career goals:', careerGoalsError);
295 - } else if (careerGoalsData && careerGoalsData.length > 0 && - isMountedRef.current) {
296 - const goalData = careerGoalsData[0]; // Get primary career goal
297 - setCareerGoal({
298 - goal: goalData.goal,
299 - timeframe: goalData.timeframe,
300 - companies: goalData.companies?.length > 0 ? goalData.companies : - undefined
301 - });
302 - }
303 -  
 304 - // Fetch industries with IDs
305 - const { data: industriesData, error: industriesError } = await supabase
306 - .from('user_industries')
307 - .select('industries (id, name), stage')
308 - .eq('user_id', currentUser.id);
309 -  
 310 - if (industriesError) {
311 - console.error('Error fetching industries:', industriesError);
312 - } else if (isMountedRef.current) {
313 - const formattedIndustries = (industriesData || []).map((ui: any) => - ({
314 - id: ui.industries.id,
315 - name: ui.industries.name,
316 - stage: ui.stage
317 - }));
318 - setIndustries(formattedIndustries);
319 - }
320 -  
 321 - // Fetch streak data from user_streaks table
322 - const { data: streakData, error: streakError } = await supabase
323 - .from('user_streaks')
324 - .select('current_streak')
325 - .eq('user_id', currentUser.id)
326 - .eq('streak_type', 'daily_learning')
327 - .single();
328 -  
 329 - // Fetch content engagement data by counting unique interactions
330 - const [articleLikesRes, articleSavesRes, articleCommentsRes,
- paperLikesRes, paperSavesRes, paperCommentsRes, bookLikesRes, bookSavesRes,
- bookCommentsRes, insightLikesRes, insightSavesRes, insightCommentsRes] = await - Promise.all([
331 - supabase.from('article_likes').select('article_id').eq('user_id',
- currentUser.id),
332 - supabase.from('article_saves').select('article_id').eq('user_id',
- currentUser.id),
333 - supabase.from('comments').select('article_id').eq('user_id',
- currentUser.id),
334 - supabase.from('paper_likes').select('paper_id').eq('user_id',
- currentUser.id),
335 - supabase.from('paper_saves').select('paper_id').eq('user_id',
- currentUser.id),
336 - supabase.from('paper_comments').select('paper_id').eq('user_id',
- currentUser.id),
337 - supabase.from('book_likes').select('book_id').eq('user_id',
- currentUser.id),
338 - supabase.from('book_saves').select('book_id').eq('user_id',
- currentUser.id),
339 - supabase.from('book_comments').select('book_id').eq('user_id',
- currentUser.id),
340 - supabase.from('insight_likes').select('insight_id').eq('user_id',
- currentUser.id),
341 - supabase.from('insight_saves').select('insight_id').eq('user_id',
- currentUser.id),
342 - supabase.from('insight_comments').select('insight_id').eq('user_id',
- currentUser.id)
343 - ]);
344 -  
 345 - // Calculate unique content pieces engaged with
346 - const uniqueArticles = new Set([
347 - ...(articleLikesRes.data?.map(r => `article*${r.article_id}`) || []),
       348 -          ...(articleSavesRes.data?.map(r => `article_${r.article*id}`) || []),
       349 -          ...(articleCommentsRes.data?.map(r => `article*${r.article_id}`) || 
           - [])
       350 -        ]);
       351 -        const uniquePapers = new Set([
       352 -          ...(paperLikesRes.data?.map(r => `paper_${r.paper*id}`) || []),
       353 -          ...(paperSavesRes.data?.map(r => `paper*${r.paper_id}`) || []),
       354 -          ...(paperCommentsRes.data?.map(r => `paper_${r.paper*id}`) || [])
       355 -        ]);
       356 -        const uniqueBooks = new Set([
       357 -          ...(bookLikesRes.data?.map(r => `book*${r.book_id}`) || []),
       358 -          ...(bookSavesRes.data?.map(r => `book_${r.book*id}`) || []),
       359 -          ...(bookCommentsRes.data?.map(r => `book*${r.book_id}`) || [])
       360 -        ]);
       361 -        const uniqueInsights = new Set([
       362 -          ...(insightLikesRes.data?.map(r => `insight_${r.insight*id}`) || []),
       363 -          ...(insightSavesRes.data?.map(r => `insight*${r.insight_id}`) || []),
       364 -          ...(insightCommentsRes.data?.map(r => `insight_${r.insight*id}`) || 
           - [])
       365 -        ]);
       366 -  
       367 -        const totalInteractions = (articleLikesRes.data?.length || 0) + 
           - (articleSavesRes.data?.length || 0) + (articleCommentsRes.data?.length || 0) +
       368 -                                 (paperLikesRes.data?.length || 0) + 
           - (paperSavesRes.data?.length || 0) + (paperCommentsRes.data?.length || 0) +
       369 -                                 (bookLikesRes.data?.length || 0) + 
           - (bookSavesRes.data?.length || 0) + (bookCommentsRes.data?.length || 0) +
       370 -                                 (insightLikesRes.data?.length || 0) + 
           - (insightSavesRes.data?.length || 0) + (insightCommentsRes.data?.length || 0);
       371 -  
       372 -        const contentEngaged = uniqueArticles.size + uniquePapers.size + 
           - uniqueBooks.size + uniqueInsights.size;
       373 -  
       374 -        // Fetch achievements count
       375 -        const { data: achievementsCountData, error: achievementsCountError } = 
           - await supabase
       376 -          .from('user_achievements')
       377 -          .select('id')
       378 -          .eq('user_id', currentUser.id);
       379 -  
       380 -        if (achievementsCountError) {
       381 -          console.error('Error fetching achievements count:', 
           - achievementsCountError);
       382 -        }
       383 -  
       384 -        if (streakError) {
       385 -          console.error('Error fetching streak data:', streakError);
       386 -        }
       387 -  
       388 -        if (isMountedRef.current) {
       389 -          setLearningStats({
       390 -            currentStreak: streakData?.current_streak || 1, // Default to 1 if 
           - no streak data
       391 -            totalInteractions,
       392 -            achievementsCount: achievementsCountData?.length || 0
       393 -          });
       394 -        }
       395 -  
       396 -        // Fetch enhanced profile data from new schema
       397 -        const [sectionsRes, skillsRes, experiencesRes, educationRes, 
           - projectsRes] = await Promise.all([
       398 -          // Keep fetching summary from profile_sections
       399 -          supabase
       400 -            .from('profile_sections')
       401 -            .select('section_type, content')
       402 -            .eq('user_id', currentUser.id),
       403 -          
       404 -          // Fetch skills from user_skills table
       405 -          supabase
       406 -            .from('user_skills')
       407 -            .select('skill_name, proficiency_level')
       408 -            .eq('user_id', currentUser.id)
       409 -            .eq('is_featured', true)
       410 -            .order('endorsement_count', { ascending: false }),
       411 -          
       412 -          // Fetch experiences from user_experiences table
       413 -          supabase
       414 -            .from('user_experiences')
       415 -            .select(`
416 - id,
417 - position_title,
418 - description,
419 - start_date,
420 - end_date,
421 - is_current,
422 - employment_type,
423 - companies (name)
424 - `)
       425 -            .eq('user_id', currentUser.id)
       426 -            .order('start_date', { ascending: false }),
       427 -          
       428 -          // Fetch education from user_education table
       429 -          supabase
       430 -            .from('user_education')
       431 -            .select(`
432 - id,
433 - degree_name,
434 - university_name,
435 - field_of_study,
436 - start_date,
437 - end_date,
438 - is_current
439 - `)
       440 -            .eq('user_id', currentUser.id)
       441 -            .order('start_date', { ascending: false }),
       442 -          
       443 -          // Fetch projects from user_projects table
       444 -          supabase
       445 -            .from('user_projects')
       446 -            .select('title, description, start_date, end_date, status')
       447 -            .eq('user_id', currentUser.id)
       448 -            .order('start_date', { ascending: false })
       449 -        ]);
       450 -  
       451 -        // Process all the data
       452 -        const sectionMap: any = {};
       453 -        
       454 -        // Process profile sections (summary)
       455 -        if (sectionsRes.error) {
       456 -          console.error('Error fetching profile sections:', sectionsRes.error);
       457 -        } else {
       458 -          const sections = sectionsRes.data || [];
       459 -          sections.forEach((section: any) => {
       460 -            sectionMap[section.section_type] = section.content;
       461 -          });
       462 -        }
       463 -        
       464 -        // Process skills
       465 -        if (skillsRes.error) {
       466 -          console.error('Error fetching skills:', skillsRes.error);
       467 -        } else {
       468 -          sectionMap.skills = (skillsRes.data || []).map((skill: any) => 
           - skill.skill_name);
       469 -        }
       470 -        
       471 -        // Process experiences
       472 -        if (experiencesRes.error) {
       473 -          console.error('Error fetching experiences:', experiencesRes.error);
       474 -        } else {
       475 -          sectionMap.experience = (experiencesRes.data || []).map((exp: any) =>
           -  ({
       476 -            id: exp.id, // Add the ID for deletion
       477 -            role: exp.position_title,
       478 -            company: exp.companies?.name || 'Unknown Company',
       479 -            description: exp.description,
       480 -            period: formatDatePeriod(exp.start_date, exp.end_date, 
           - exp.is_current),
       481 -            startDate: exp.start_date,
       482 -            endDate: exp.end_date,
       483 -            isCurrent: exp.is_current,
       484 -            employmentType: exp.employment_type
       485 -          }));
       486 -        }
       487 -        
       488 -        // Process education
       489 -        if (educationRes.error) {
       490 -          console.error('Error fetching education:', educationRes.error);
       491 -        } else {
       492 -          sectionMap.education = (educationRes.data || []).map((edu: any) => ({
       493 -            id: edu.id, // Add the ID for deletion
       494 -            degree: `${edu.degree_name}${edu.field_of_study ? ` 
           - ${edu.field_of_study}` : ''}`,
       495 -            university: edu.university_name || 'Unknown Institution',
       496 -            stage: edu.field_of_study,
       497 -            period: formatDatePeriod(edu.start_date, edu.end_date, 
           - edu.is_current),
       498 -            startDate: edu.start_date,
       499 -            endDate: edu.end_date,
       500 -            isCurrent: edu.is_current
       501 -          }));
       502 -        }
       503 -        
       504 -        // Process projects
       505 -        if (projectsRes.error) {
       506 -          console.error('Error fetching projects:', projectsRes.error);
       507 -        } else {
       508 -          sectionMap.projects = (projectsRes.data || []).map((project: any) => 
           - ({
       509 -            title: project.title,
       510 -            description: project.description
       511 -          }));
       512 -        }
       513 -        
       514 -        if (isMountedRef.current) {
       515 -          setProfileData(sectionMap);
       516 -        }
       517 -  
       518 -      } catch (error) {
       519 -        console.error('Error fetching profile data:', error);
       520 -      } finally {
       521 -        if (isMountedRef.current) {
       522 -          setLoading(false);
       523 -        }
       524 -      }
       525 -    }, [currentUser]);
       526 -  
       527 -    useEffect(() => {
       528 -      // TODO: Temporarily commented out to isolate crash - re-enable after 
           - testing
       529 -      // fetchProfileData();
       530 -      
       531 -      // Track profile view
       532 -      if (currentUser?.id) {
       533 -        analytics.screen('Profile', {
       534 -          user_id: currentUser.id,
       535 -          timestamp: new Date().toISOString()
       536 -        });
       537 -        
       538 -        analytics.track(ANALYTICS_EVENTS.PROFILE_VIEWED, {
       539 -          user_id: currentUser.id,
       540 -          timestamp: new Date().toISOString()
       541 -        });
       542 -      }
       543 -    }, [currentUser?.id]);
       544 -  
       545 -    // Set up real-time subscription for achievements using useFocusEffect
       546 -    // TODO: Temporarily commented out to isolate crash - re-enable after 
           - testing
       547 -    // useFocusEffect(
       548 -    //   useCallback(() => {
       549 -    //     if (!currentUser?.id || !isMountedRef.current) return;
       550 -  
       551 -    //     // Clean up existing subscription first
       552 -    //     if (achievementsSubscriptionRef.current) {
       553 -    //       try {
       554 -    //         achievementsSubscriptionRef.current.unsubscribe();
       555 -    //       } catch (error) {
       556 -    //         console.warn('Error unsubscribing from achievements:', error);
       557 -    //       }
       558 -    //       achievementsSubscriptionRef.current = null;
       559 -    //     }
       560 -  
       561 -    //     const subscription = AchievementService.subscribeToUserAchievements(
       562 -    //       currentUser.id,
       563 -    //       (newAchievement) => {
       564 -    //         // Only update state if component is still mounted
       565 -    //         if (!isMountedRef.current) return;
       566 -            
       567 -    //         console.log('🏆 New achievement earned:', newAchievement.title);
       568 -            
       569 -    //         // Track achievement earned event
       570 -    //         analytics.track(ANALYTICS_EVENTS.ACHIEVEMENT_EARNED, {
       571 -    //           user_id: currentUser.id,
       572 -    //           achievement_id: newAchievement.achievement_id,
       573 -    //           achievement_title: newAchievement.title,
       574 -    //           achievement_type: newAchievement.achievement_type,
       575 -    //           timestamp: new Date().toISOString()
       576 -    //         });
       577 -            
       578 -    //         // Add new achievement to the list
       579 -    //         setAchievements(prev => [newAchievement, ...prev]);
       580 -    //       }
       581 -    //     );
       582 -  
       583 -    //     achievementsSubscriptionRef.current = subscription;
       584 -  
       585 -    //     return () => {
       586 -    //       if (achievementsSubscriptionRef.current) {
       587 -    //         try {
       588 -    //           achievementsSubscriptionRef.current.unsubscribe();
       589 -    //         } catch (error) {
       590 -    //           console.warn('Error unsubscribing from achievements:', error);
       591 -    //         }
       592 -    //         achievementsSubscriptionRef.current = null;
       593 -    //       }
       594 -    //     };
       595 -    //   }, [currentUser?.id])
       596 -    // );
       597 -  
       598 -    // Set up real-time subscription for profile changes (voltz and level 
           - updates) using useFocusEffect
       599 -    // TODO: Temporarily commented out to isolate crash - re-enable after 
           - testing
       600 -    // useFocusEffect(
       601 -    //   useCallback(() => {
       602 -    //     if (!currentUser?.id || !isMountedRef.current) return;
       603 -        
       604 -        // Clean up existing channel first
       605 -        if (profileChannelRef.current) {
       606 -          try {
       607 -            supabase.removeChannel(profileChannelRef.current);
       608 -          } catch (error) {
       609 -            console.warn('Error removing profile channel:', error);
       610 -          }
       611 -          profileChannelRef.current = null;
       612 -        }
       613 -        
       614 -        const profileChannel = supabase
       615 -          .channel(`profile-updates-${currentUser.id}-${Date.now()}`) // Unique
           -  channel name with timestamp
       616 -          .on('postgres_changes', 
       617 -            { 
       618 -              event: 'UPDATE', 
       619 -              schema: 'public', 
       620 -              table: 'profiles', 
       621 -              filter: `id=eq.${currentUser.id}`
       622 -            },
       623 -            async (payload) => {
       624 -              // Only update state if component is still mounted
       625 -              if (!isMountedRef.current) return;
       626 -              
       627 -              console.log('⚡ Profile updated:', payload.new);
       628 -              
       629 -              // Track level up for analytics if level increased
       630 -              if (payload.new.level !== undefined && payload.new.level > 
           - userLevelRef.current) {
       631 -                analytics.track(ANALYTICS_EVENTS.LEVEL_UP, {
       632 -                  user_id: currentUser.id,
       633 -                  previous_level: userLevelRef.current,
       634 -                  new_level: payload.new.level,
       635 -                  total_voltz_earned: payload.new.total_voltz_earned,
       636 -                  timestamp: new Date().toISOString()
       637 -                });
       638 -              }
       639 -              
       640 -              // Update immediate state values from payload
       641 -              if (payload.new.total_voltz_earned !== undefined) {
       642 -                setTotalVoltzEarned(payload.new.total_voltz_earned);
       643 -              }
       644 -              if (payload.new.level !== undefined) {
       645 -                setUserLevel(payload.new.level);
       646 -              }
       647 -              if (payload.new.spendable_voltz !== undefined) {
       648 -                setSpendableVoltz(payload.new.spendable_voltz);
       649 -              }
       650 -              if (payload.new.is_levelled !== undefined) {
       651 -                setIsLevelled(payload.new.is_levelled);
       652 -                console.log('📡 Real-time update - isLevelled:', 
           - payload.new.is_levelled);
       653 -              }
       654 -              
       655 -              // Refresh comprehensive voltz stats to get updated progress 
           - calculations
       656 -              try {
       657 -                const voltzStats = await 
           - voltzService.getVoltzStats(currentUser.id);
       658 -                if (isMountedRef.current) {
       659 -                  setLevelProgress(voltzStats.levelProgress);
       660 -                  setVoltzForCurrentLevel(voltzStats.voltzForCurrentLevel);
       661 -                  setVoltzForNextLevel(voltzStats.voltzForNextLevel);
       662 -                  setIsLevelled(voltzStats.isLevelled);
       663 -                }
       664 -              } catch (error) {
       665 -                console.error('Error refreshing voltz stats after profile 
           - update:', error);
       666 -              }
       667 -            }
       668 -          )
       669 -          .subscribe();
       670 -  
       671 -        profileChannelRef.current = profileChannel;
       672 -  
       673 -        return () => {
       674 -          if (profileChannelRef.current) {
       675 -            try {
       676 -              supabase.removeChannel(profileChannelRef.current);
       677 -            } catch (error) {
       678 -              console.warn('Error removing profile channel:', error);
       679 -            }
       680 -            profileChannelRef.current = null;
       681 -          }
       682 -        };
       683 -      }, [currentUser?.id])
       684 -    );
       685 -  
       686 -    // Event handlers
       687 -    const handleEditCareerGoal = () => {
       688 -      if (isMountedRef.current) {
       689 -        setShowCareerGoalModal(true);
       690 -      }
       691 -    };
       692 -  
       693 -    const handleCareerGoalSave = (goalData: CareerGoal) => {
       694 -      if (isMountedRef.current) {
       695 -        setCareerGoal(goalData);
       696 -        // Refresh profile data to ensure consistency
       697 -        fetchProfileData();
       698 -      }
       699 -    };
       700 -  
       701 -    const handleEditIndustries = () => {
       702 -      if (isMountedRef.current) {
       703 -        setShowIndustrySelection(true);
       704 -      }
       705 -    };
       706 -  
       707 -    const handleIndustrySave = async (selectedIndustries: any[]) => {
       708 -      if (!isMountedRef.current) return;
       709 -      
       710 -      try {
       711 -        // Update local state
       712 -        const formattedIndustries = selectedIndustries.map(industry => ({
       713 -          name: industry.name,
       714 -          stage: 'interested'
       715 -        }));
       716 -        setIndustries(formattedIndustries);
       717 -        setShowIndustrySelection(false);
       718 -        
       719 -        // CRITICAL: Refresh industries context to update feed algorithm
       720 -        console.log('🔄 Profile: Refreshing industries context after industry 
           - update...');
       721 -        await refreshIndustries();
       722 -        console.log('✅ Profile: Industries context refreshed successfully');
       723 -        
       724 -        // Optional: Clear viewed content in AsyncStorage so user sees fresh 
           - content
       725 -        // This ensures they get content from their newly selected industries 
           - immediately
       726 -        try {
       727 -          const AsyncStorage = await 
           - import('@react-native-async-storage/async-storage');
       728 -          const viewedKey =`viewed_content*${currentUser?.id}`;
729 - await AsyncStorage.default.removeItem(viewedKey);
730 - console.log('🧹 Profile: Cleared viewed content cache to show fresh - industry content');
731 - } catch (cacheError) {
732 - console.warn('⚠️ Profile: Failed to clear viewed content cache:', - cacheError);
733 - }
734 -  
 735 - } catch (error) {
736 - console.error('❌ Profile: Error in handleIndustrySave:', error);
737 - }
738 - };
739 -  
 740 -  
 741 - const styles = StyleSheet.create({
742 - container: {
743 - flex: 1,
744 - backgroundColor: colors.background,
745 - },
746 - gradientHeader: {
747 - paddingTop: 60,
748 - paddingHorizontal: 20,
749 - paddingBottom: 20,
750 - },
751 - settingsButton: {
752 - position: 'absolute',
753 - top: 60,
754 - right: 20,
755 - zIndex: 1,
756 - padding: 8,
757 - },
758 - scrollContainer: {
759 - flex: 1,
760 - },
761 - contentContainer: {
762 - paddingBottom: 120,
763 - },
764 - });
765 -  
 766 - // Show industry selection page if active
767 - if (showIndustrySelection) {
768 - return (
769 - <IndustrySelectionPage
770 - onBack={() => setShowIndustrySelection(false)}
771 - onSave={handleIndustrySave}
772 - initialIndustries={industries.map(industry => ({
773 - id: industry.id || industry.name,
774 - name: industry.name
775 - }))}
776 - />
777 - );
778 - }
779 -  
 780 - return (
781 - <View style={styles.container}>
782 - <ScrollView
783 - style={styles.scrollContainer}
784 - contentContainerStyle={styles.contentContainer}
785 - showsVerticalScrollIndicator={false}
786 - >
787 - <View
788 - style={[styles.gradientHeader, { backgroundColor: colors.background
- }]}
789 - >
790 - <TouchableOpacity
791 - style={styles.settingsButton}
792 - onPress={() => setIsSettingsModalVisible(true)}
793 - >
794 - <Feather name="settings" size={24} color={colors.text} />
795 - </TouchableOpacity>
796 -  
 797 - <NewProfileHeader
798 - fullName={fullName}
799 - avatarUrl={avatarUrl}
800 - userLevel={userLevel}
801 - onAvatarPress={() => {}}
802 - />
803 - </View>
804 - {showOnboardingProgress && currentUser && (
805 - <OnboardingProgressCard
806 - userId={currentUser.id}
807 - onStepPress={(step) => {
808 - console.log('User wants to complete onboarding step:', step);
809 - // Could navigate to relevant screen or show guidance
810 - }}
811 - />
812 - )}
813 -  
 814 - <AnimatedLevelProgressBar
815 - level={userLevel}
816 - currentVoltz={totalVoltzEarned}
817 - spendableVoltz={spendableVoltz}
818 - levelProgress={levelProgress}
819 - voltzForCurrentLevel={voltzForCurrentLevel}
820 - voltzForNextLevel={voltzForNextLevel}
821 - previousLevel={previousLevel}
822 - previousVoltz={previousVoltz}
823 - triggerLevelUpAnimation={isLevelled}
824 - onLevelUpAnimationComplete={async () => {
825 - // Reset the is_levelled flag in database after animation - completes
826 - if (currentUser?.id) {
827 - console.log('🎬 Level-up animation complete, resetting - flag...');
828 - await voltzService.resetLevelUpFlag(currentUser.id);
829 - setIsLevelled(false);
830 - }
831 - }}
832 - />
833 -  
 834 - <LearningStatsGrid
835 - stats={learningStats}
836 - loading={loading}
837 - />
838 -  
 839 - <LeaderboardCard
840 - loading={loading}
841 - />
842 -  
 843 - <SavedContentScrollView
844 - loading={loading}
845 - />
846 -  
 847 - <AchievementsBelt
848 - userId={currentUser?.id || ''}
849 - loading={loading}
850 - />
851 -  
 852 - <CareerGoalCard
853 - goalData={careerGoal}
854 - onEditPress={handleEditCareerGoal}
855 - loading={loading}
856 - />
857 -  
 858 - <IndustryInterestsCard
859 - industries={industries}
860 - onEditPress={handleEditIndustries}
861 - loading={loading}
862 - />
863 -  
 864 - <ExperienceCard
865 - experiences={profileData.experience || []}
866 - userId={currentUser?.id || ''}
867 - loading={loading}
868 - onRefresh={fetchProfileData}
869 - />
870 -  
 871 - <EducationCard
872 - education={profileData.education || []}
873 - userId={currentUser?.id || ''}
874 - loading={loading}
875 - onRefresh={fetchProfileData}
876 - />
877 -  
 878 - <SkillsCard
879 - skills={profileData.skills || []}
880 - userId={currentUser?.id || ''}
881 - loading={loading}
882 - onRefresh={fetchProfileData}
883 - />
884 - </ScrollView>
885 -  
 886 - <SettingsModal
887 - visible={isSettingsModalVisible}
888 - onClose={() => setIsSettingsModalVisible(false)}
889 - navigateTo={router.push}
890 - signOut={signOut || (async () => {})}
891 - />
892 -  
 893 - <CareerGoalEditModal
894 - visible={showCareerGoalModal}
895 - onClose={() => setShowCareerGoalModal(false)}
896 - onSave={handleCareerGoalSave}
897 - currentGoal={careerGoal}
898 - userId={currentUser?.id || ''}
899 - />
900 - </View>
901 - );
902 -  
 903 - } catch (error) {
904 - console.error('🚨 NewProfile: CRITICAL ERROR:', error);
905 - console.error('🚨 NewProfile: Error stack:', error instanceof Error ? - error.stack : 'No stack trace');
906 - return null;
907 - }
92 };
93 \ No newline at end of file
