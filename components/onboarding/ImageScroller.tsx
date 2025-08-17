import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

// Preload images at module level for immediate availability
const images = [
  require('../../assets/IMG_2106.jpg'),
  require('../../assets/IMG_2107.jpg'),
  require('../../assets/IMG_2108.jpg'),
];

export const ImageScroller: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sequence = () => {
      // Zoom out
      Animated.timing(scale, {
        toValue: 0.93,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Scroll to next
        const nextIndex = (currentIndex + 1) % images.length;
        
        // If we're going back to the first image, reset position
        if (nextIndex === 0) {
          translateY.setValue(0);
        } else {
          Animated.timing(translateY, {
            toValue: -nextIndex * 300, // Use actual image height (300px)
            duration: 700,
            useNativeDriver: true,
          }).start();
        }
        
        setCurrentIndex(nextIndex);
        
        // Always zoom back in after changing image
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    };

    const timer = setTimeout(sequence, 3000);
    return () => clearTimeout(timer);
  }, [currentIndex, translateY, scale]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.scrollContainer,
          {
            transform: [
              { translateY: translateY },
              { scale: scale }
            ]
          }
        ]}
      >
        {images.map((source, index) => (
          <Image
            key={index}
            source={source}
            style={styles.image}
            resizeMode="cover"
            fadeDuration={0}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 300,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexDirection: 'column',
  },
  image: {
    width: 200,
    height: 300,
  },
});