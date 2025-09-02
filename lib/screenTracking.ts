import { analytics, ANALYTICS_EVENTS } from './posthog';

interface ScreenSession {
  screenName: string;
  startTime: number;
  lastActivityTime: number;
  scrollDepth: number;
  interactions: number;
}

class ScreenTracker {
  private currentSession: ScreenSession | null = null;
  private sessionId: string = '';
  private userId: string = '';
  
  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize tracking for a user
  initializeTracking(userId: string) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    
    analytics.track('app_session_started', {
      user_id: userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  // Track when user enters a screen
  enterScreen(screenName: string, additionalData: Record<string, any> = {}) {
    // End previous screen session if exists
    if (this.currentSession) {
      this.exitScreen();
    }

    const now = Date.now();
    this.currentSession = {
      screenName,
      startTime: now,
      lastActivityTime: now,
      scrollDepth: 0,
      interactions: 0
    };

    // Track screen view
    analytics.screen(screenName, {
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      ...additionalData
    });

    analytics.track('screen_entered', {
      user_id: this.userId,
      session_id: this.sessionId,
      screen_name: screenName,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  // Track when user exits a screen
  exitScreen() {
    if (!this.currentSession) return;

    const now = Date.now();
    const timeSpent = now - this.currentSession.startTime;
    const activeTime = this.currentSession.lastActivityTime - this.currentSession.startTime;

    // Send detailed time tracking
    analytics.track('screen_exited', {
      user_id: this.userId,
      session_id: this.sessionId,
      screen_name: this.currentSession.screenName,
      time_spent_ms: timeSpent,
      time_spent_seconds: Math.round(timeSpent / 1000),
      time_spent_minutes: Math.round(timeSpent / 60000 * 100) / 100, // 2 decimal places
      active_time_ms: activeTime,
      scroll_depth: this.currentSession.scrollDepth,
      interactions: this.currentSession.interactions,
      timestamp: new Date().toISOString()
    });

    // Special tracking for main feed (most important metric)
    if (this.currentSession.screenName === 'MainFeed') {
      analytics.track('main_feed_session_completed', {
        user_id: this.userId,
        session_id: this.sessionId,
        duration_seconds: Math.round(timeSpent / 1000),
        duration_minutes: Math.round(timeSpent / 60000 * 100) / 100,
        scroll_depth_percent: this.currentSession.scrollDepth,
        interactions_count: this.currentSession.interactions,
        engagement_rate: this.currentSession.interactions / (timeSpent / 1000), // interactions per second
        timestamp: new Date().toISOString()
      });
    }

    this.currentSession = null;
  }

  // Track user activity (scrolling, tapping, etc.)
  trackActivity(activityType: 'scroll' | 'interaction', data: Record<string, any> = {}) {
    if (!this.currentSession) return;

    this.currentSession.lastActivityTime = Date.now();

    if (activityType === 'scroll') {
      this.currentSession.scrollDepth = Math.max(this.currentSession.scrollDepth, data.scrollPercent || 0);
    } else if (activityType === 'interaction') {
      this.currentSession.interactions++;
    }

    // Send periodic activity updates for long sessions (every 30 seconds)
    const sessionDuration = Date.now() - this.currentSession.startTime;
    if (sessionDuration % 30000 < 1000) { // Roughly every 30 seconds
      analytics.track('screen_activity_update', {
        user_id: this.userId,
        session_id: this.sessionId,
        screen_name: this.currentSession.screenName,
        duration_so_far_seconds: Math.round(sessionDuration / 1000),
        current_scroll_depth: this.currentSession.scrollDepth,
        interactions_so_far: this.currentSession.interactions,
        activity_type: activityType,
        timestamp: new Date().toISOString(),
        ...data
      });
    }
  }

  // Track content engagement specifically
  trackContentEngagement(contentType: string, contentId: string, engagementType: string, additionalData: Record<string, any> = {}) {
    this.trackActivity('interaction');
    
    analytics.track('content_engagement', {
      user_id: this.userId,
      session_id: this.sessionId,
      screen_name: this.currentSession?.screenName || 'unknown',
      content_type: contentType,
      content_id: contentId,
      engagement_type: engagementType, // 'like', 'save', 'comment', 'share', 'view'
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  // End the entire app session
  endSession() {
    if (this.currentSession) {
      this.exitScreen();
    }

    analytics.track('app_session_ended', {
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }
}

// Singleton instance
export const screenTracker = new ScreenTracker();

// Helper hooks and utilities for React components
export const useScreenTracking = () => {
  return {
    enterScreen: screenTracker.enterScreen.bind(screenTracker),
    exitScreen: screenTracker.exitScreen.bind(screenTracker),
    trackActivity: screenTracker.trackActivity.bind(screenTracker),
    trackContentEngagement: screenTracker.trackContentEngagement.bind(screenTracker)
  };
};

// Extended analytics events for screen tracking
export const SCREEN_EVENTS = {
  SCREEN_ENTERED: 'screen_entered',
  SCREEN_EXITED: 'screen_exited',
  MAIN_FEED_SESSION: 'main_feed_session_completed',
  CONTENT_ENGAGEMENT: 'content_engagement',
  SCROLL_ACTIVITY: 'scroll_activity',
  APP_SESSION_STARTED: 'app_session_started',
  APP_SESSION_ENDED: 'app_session_ended'
} as const;