import { useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { throttle } from 'lodash';

interface UseContentTrackingProps {
    contentId: number;
    contentType: 'article' | 'paper' | 'book' | 'video' | 'podcast';
    totalSlides?: number; // Optional context
}

export const useContentTracking = ({ contentId, contentType, totalSlides = 0 }: UseContentTrackingProps) => {
    const startTimeRef = useRef<number>(Date.now());
    const maxScrollDepthRef = useRef<number>(0);
    const slidesViewedRef = useRef<Set<number>>(new Set([0])); // Always viewed first slide/cover
    const maxCompletionRef = useRef<number>(0);

    // Generate a session ID for this viewing instance to support updates (Upsert)
    // Simple UUID v4 generator
    const sessionIdRef = useRef<string>(
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        })
    );

    // Initial default values - e.g. simply viewing a card is 10% "complete"
    useEffect(() => {
        if (maxCompletionRef.current === 0) {
            maxCompletionRef.current = 10;
        }
    }, []);

    const logSession = useCallback(async () => {
        const scrollDepth = maxScrollDepthRef.current;
        const uniqueSlides = slidesViewedRef.current.size;
        const sessionId = sessionIdRef.current;

        // Debug: explicitly show we are attempting to send data
        console.log(`[Tracking DEBUG] 🚀 Syncing Session... Depth=${scrollDepth}%, Slides=${uniqueSlides}`);

        try {
            const { error } = await supabase.rpc('log_interaction', {
                p_content_id: contentId,
                p_content_type: contentType,
                p_max_scroll_depth: Math.round(scrollDepth),
                p_slides_viewed: uniqueSlides,
                p_total_slides: totalSlides,
                p_session_id: sessionId
            });

            if (error) {
                console.error(`[Tracking] Error logging ${contentType} ${contentId}:`, error);
            }
        } catch (e) {
            console.error('[Tracking] Exception:', e);
        }
    }, [contentId, contentType, totalSlides]);

    // Throttled Logger for Real-time updates (every 2 seconds max)
    // leading: false ensures we don't spam on first scroll
    // trailing: true ensures the last update is always sent
    const throttledLogSession = useRef(throttle(logSession, 2000, { leading: false, trailing: true })).current;

    // Log on unmount (ensure final state is captured immediately)
    useEffect(() => {
        return () => {
            logSession(); // Immediate call on unmount
            throttledLogSession.cancel(); // Cancel any pending throttled calls
        };
    }, [logSession, throttledLogSession]);

    // Update Scroll Depth (0-100)
    const updateScrollDepth = useCallback((depth: number) => {
        if (depth > maxScrollDepthRef.current) {
            console.log(`[Tracking DEBUG] 📜 Depth New Max: ${depth}%`);
            maxScrollDepthRef.current = depth;

            // Map scroll depth to completion? 
            // If it's a regular article, scroll depth IS completion.
            // If explicit completion is needed, we handle that elsewhere.
            if (depth > maxCompletionRef.current) {
                maxCompletionRef.current = depth;
            }
            // Trigger real-time save
            throttledLogSession();
        }
    }, [throttledLogSession]);

    // Track Slide View
    const trackSlideView = useCallback((slideIndex: number) => {
        if (!slidesViewedRef.current.has(slideIndex)) {
            console.log(`[Tracking DEBUG] 📸 Slide Viewed: ${slideIndex + 1}/${totalSlides}`);
            slidesViewedRef.current.add(slideIndex);

            // Update completion based on slides
            if (totalSlides > 0) {
                const completion = ((slideIndex + 1) / totalSlides) * 100;
                if (completion > maxCompletionRef.current) {
                    maxCompletionRef.current = completion;
                }
            }
            // Trigger real-time save
            throttledLogSession();
        }
    }, [totalSlides, throttledLogSession]);

    // Mark Complete (e.g. read full text)
    const markComplete = useCallback(() => {
        maxCompletionRef.current = 100;
        maxScrollDepthRef.current = 100; // Assume full read implies full depth
        logSession(); // Immediate log on completion
    }, [logSession]);

    return {
        updateScrollDepth,
        trackSlideView,
        markComplete
    };
};
