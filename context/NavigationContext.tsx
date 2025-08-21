import React, { createContext, useContext, useRef } from 'react';
import { router, usePathname } from 'expo-router';

interface NavigationContextType {
  navigateWithDirection: (targetRoute: string) => void;
  getCurrentTabIndex: () => number;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Define tab order for directional animations
const TAB_ORDER: Record<string, number> = {
  '/feed': 0,        // Home
  '/discover': 1,    // Discover  
  '/chats': 2,       // Insights/Chats
  '/profile': 3,     // Profile
  '/saved-feed': 1,  // Saved feed (treat as discover for animation)
};

const ROUTE_STACK: string[] = [];

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigateWithDirection = (targetRoute: string) => {
    const currentRoute = ROUTE_STACK[ROUTE_STACK.length - 1] || '/feed';
    const currentIndex = TAB_ORDER[currentRoute] ?? 0;
    const targetIndex = TAB_ORDER[targetRoute] ?? 0;
    
    // Add route to stack if it's not the same as current
    if (targetRoute !== currentRoute) {
      ROUTE_STACK.push(targetRoute);
      
      // Keep stack size manageable
      if (ROUTE_STACK.length > 10) {
        ROUTE_STACK.shift();
      }
    }
    
    // Use different navigation methods based on direction
    if (targetIndex < currentIndex) {
      // Moving left - use replace with custom left animation
      router.replace({
        pathname: targetRoute,
        params: { animationDirection: 'left' }
      });
    } else {
      // Moving right or same - use standard push/replace
      router.replace(targetRoute);
    }
  };

  const getCurrentTabIndex = () => {
    const currentRoute = ROUTE_STACK[ROUTE_STACK.length - 1] || '/feed';
    return TAB_ORDER[currentRoute] ?? 0;
  };

  return (
    <NavigationContext.Provider value={{ navigateWithDirection, getCurrentTabIndex }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useDirectionalNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useDirectionalNavigation must be used within a NavigationProvider');
  }
  return context;
};