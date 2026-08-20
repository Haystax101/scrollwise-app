/**
 * FeedNavigationService
 * Manages proactive cache refresh when users navigate away from feed
 * Ensures fresh content is ready when they return
 */

import { FeedAlgorithm } from '../lib/feedAlgorithm';

export class FeedNavigationService {
  private static instance: FeedNavigationService;
  private feedAlgorithm: FeedAlgorithm | null = null;
  private isOnFeedTab = false;

  private constructor() {}

  public static getInstance(): FeedNavigationService {
    if (!FeedNavigationService.instance) {
      FeedNavigationService.instance = new FeedNavigationService();
    }
    return FeedNavigationService.instance;
  }

  /**
   * Register the current feed algorithm instance
   * Called when MainFeed component mounts
   */
  public registerFeedAlgorithm(algorithm: FeedAlgorithm): void {
    this.feedAlgorithm = algorithm;
    console.log('FeedNavService: Feed algorithm registered');
  }

  /**
   * Clear the feed algorithm reference
   * Called when MainFeed component unmounts
   */
  public unregisterFeedAlgorithm(): void {
    this.feedAlgorithm = null;
    console.log('FeedNavService: Feed algorithm unregistered');
  }

  /**
   * User is now on the feed tab
   * Called when feed tab becomes active
   */
  public onFeedTabActive(): void {
    if (!this.isOnFeedTab) {
      this.isOnFeedTab = true;
      console.log('FeedNavService: User entered feed tab');
    }
  }

  /**
   * User navigated away from feed tab
   * Triggers proactive cache refresh in background
   */
  public onFeedTabInactive(): void {
    if (this.isOnFeedTab) {
      this.isOnFeedTab = false;
      console.log('FeedNavService: User left feed tab - starting proactive cache refresh');
      
      // Trigger proactive cache refresh in background
      if (this.feedAlgorithm) {
        this.feedAlgorithm.proactiveCacheRefresh().catch(error => {
          console.error('FeedNavService: Proactive cache refresh failed:', error);
        });
      } else {
        console.warn('FeedNavService: No feed algorithm registered for proactive refresh');
      }
    }
  }

  /**
   * Manual trigger for cache refresh (for testing or special cases)
   */
  public triggerProactiveRefresh(): void {
    console.log('FeedNavService: Manual proactive refresh triggered');
    if (this.feedAlgorithm) {
      this.feedAlgorithm.proactiveCacheRefresh().catch(error => {
        console.error('FeedNavService: Manual proactive refresh failed:', error);
      });
    }
  }

  /**
   * Get current state for debugging
   */
  public getState(): { isOnFeedTab: boolean; hasAlgorithm: boolean } {
    return {
      isOnFeedTab: this.isOnFeedTab,
      hasAlgorithm: this.feedAlgorithm !== null
    };
  }
}

// Export singleton instance
export const feedNavigationService = FeedNavigationService.getInstance();