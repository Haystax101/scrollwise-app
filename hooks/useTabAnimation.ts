import { useEffect } from 'react';
import { useNavigation as useReactNavigation } from '@react-navigation/native';
import { useDirectionalNavigation } from '../context/NavigationContext';

export const useTabAnimation = () => {
  const navigation = useReactNavigation();
  const { getNavigationDirection } = useDirectionalNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const direction = getNavigationDirection();
      
      // Set the animation based on direction
      if (direction === 'left') {
        navigation.setOptions({
          animation: 'slide_from_left',
        });
      } else if (direction === 'right') {
        navigation.setOptions({
          animation: 'slide_from_right',
        });
      }
    });

    return unsubscribe;
  }, [navigation, getNavigationDirection]);
};