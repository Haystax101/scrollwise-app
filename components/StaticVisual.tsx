import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Animation variation components
function QuantumParticles() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          top: '50%',
          left: '50%',
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
}

function SpaceCosmos() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#000", "#1a1a1a"]}
        style={styles.gradientBg}
      />
      {[...Array(20)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: "#fff",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: [{ translateY }],
          }}
        />
      ))}
    </View>
  );
}

function CircuitBoard() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#0f0", "#003300"]}
        style={styles.gradientBg}
      />
      {[...Array(10)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            width: 2,
            height: 50,
            backgroundColor: "#0f0",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: [{ translateX }],
          }}
        />
      ))}
    </View>
  );
}

function MatrixDataStream() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#000", "#003"]}
        style={styles.gradientBg}
      />
      {[...Array(15)].map((_, index) => (
        <Animated.Text
          key={index}
          style={{
            position: "absolute",
            fontSize: 12,
            color: "#0f0",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: [{ translateY }],
          }}
        >
          {Math.random() > 0.5 ? "0" : "1"}
        </Animated.Text>
      ))}
    </View>
  );
}

function NeuralNetwork() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#222", "#444"]}
        style={styles.gradientBg}
      />
      {[...Array(10)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#0ff",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: [{ scale }],
          }}
        />
      ))}
    </View>
  );
}

function DNAHelix() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#fff', '#aaf']}
        style={styles.gradientBg}
      />
      {[...Array(10)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: 5,
            height: 20,
            backgroundColor: '#00f',
            top: `${index * 10}%`,
            left: `${index % 2 === 0 ? 40 : 60}%`,
            transform: [{ rotate }],
          }}
        />
      ))}
    </View>
  );
}

function OceanWaves() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#00f', '#00a']}
        style={styles.gradientBg}
      />
      {[...Array(5)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: '100%',
            height: 20,
            backgroundColor: '#0af',
            bottom: `${index * 20}%`,
            transform: [{ translateY }],
          }}
        />
      ))}
    </View>
  );
}

function FireEnergy() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#f00', '#ff0']}
        style={styles.gradientBg}
      />
      {[...Array(10)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#f80',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: [{ scale }],
          }}
        />
      ))}
    </View>
  );
}

function CrystalFormation() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#fff', '#ccf']}
        style={styles.gradientBg}
      />
      {[...Array(10)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#aaf',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity,
          }}
        />
      ))}
    </View>
  );
}

function GeometricMorphing() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#f0f", "#ff0"]}
        style={styles.gradientBg}
      />
      {[...Array(5)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            width: 20,
            height: 20,
            backgroundColor: "#f0f",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: [{ scale }],
          }}
        />
      ))}
    </View>
  );
}

function HealthcareFallback() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#e0f7fa", "#80deea"]}
        style={styles.gradientBg}
      />
      {[...Array(10)].map((_, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#00bcd4",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: [{ translateX }],
          }}
        />
      ))}
    </View>
  );
}

// Map industries to two animation variations each
const INDUSTRY_ANIMATIONS: Record<string, (() => React.ReactNode | null)[]> = {
  STEM: [NeuralNetwork, QuantumParticles],
  Finance: [CircuitBoard, MatrixDataStream],
  Healthcare: [DNAHelix, OceanWaves],
  Education: [GeometricMorphing, CrystalFormation],
  Law: [SpaceCosmos, FireEnergy],
  Default: [QuantumParticles, GeometricMorphing],
};

export const StaticVisual = ({ industry = 'Default', postId }: { industry?: string, postId?: string | number }) => {
  // Pick one of the two assigned variations deterministically based on postId
  const variations = INDUSTRY_ANIMATIONS[industry] || INDUSTRY_ANIMATIONS.Default;
  const variationIndex = useMemo(() => {
    if (typeof postId === 'number' || typeof postId === 'string') {
      // Simple deterministic hash
      let hash = 0;
      const str = String(postId);
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) % variations.length;
    }
    // fallback to random if no postId
    return Math.floor(Math.random() * variations.length);
  }, [postId, variations.length]);
  const VariationComponent = variations[variationIndex];
  return <VariationComponent />;
};

const styles = StyleSheet.create({
  visualContainer: {
    width: '100%',
    aspectRatio: 1.2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginBottom: -40,
    zIndex: 2,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});

INDUSTRY_ANIMATIONS.Healthcare.push(HealthcareFallback);
