import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Animation variation components
function QuantumParticles() {
  const primaryAnim = useRef(new Animated.Value(0)).current;
  const secondaryAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    
    // Primary floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(primaryAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(primaryAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Secondary orbital animation
    Animated.loop(
      Animated.timing(secondaryAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
    
    // Pulse animation for energy waves
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#1e1b4b", "#4c1d95", "#7c3aed"]}
        style={styles.gradientBg}
      />
      
      {/* Central core particle */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#a855f7',
            top: '50%',
            left: '50%',
            marginTop: -10,
            marginLeft: -10,
            shadowColor: '#a855f7',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
          },
          {
            transform: [
              {
                scale: primaryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.4],
                }),
              },
            ],
            opacity: primaryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
        ]}
      />
      
      {/* Orbiting particles */}
      {[...Array(6)].map((_, index) => {
        const angle = (index * 60) * (Math.PI / 180); // 60 degrees apart
        const radius = 40;
        
        return (
          <Animated.View
            key={index}
            style={[
              {
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#c084fc',
                top: '50%',
                left: '50%',
                marginTop: -4,
                marginLeft: -4,
              },
              {
                transform: [
                  {
                    translateX: secondaryAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        Math.cos(angle) * radius,
                        Math.cos(angle + 2 * Math.PI) * radius,
                      ],
                    }),
                  },
                  {
                    translateY: secondaryAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        Math.sin(angle) * radius,
                        Math.sin(angle + 2 * Math.PI) * radius,
                      ],
                    }),
                  },
                ],
                opacity: secondaryAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 1, 0.6],
                }),
              },
            ]}
          />
        );
      })}
      
      {/* Energy wave pulses */}
      {[0, 1, 2].map((waveIndex) => (
        <Animated.View
          key={`wave-${waveIndex}`}
          style={[
            {
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: '#8b5cf6',
              marginTop: -40,
              marginLeft: -40,
            },
            {
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5 + waveIndex * 0.3, 2 + waveIndex * 0.5],
                  }),
                },
              ],
              opacity: pulseAnim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.8 - waveIndex * 0.2, 0.4 - waveIndex * 0.1, 0],
              }),
            },
          ]}
        />
      ))}
      
      {/* Floating quantum dots */}
      {[...Array(12)].map((_, index) => (
        <Animated.View
          key={`dot-${index}`}
          style={[
            {
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#ddd6fe',
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
            },
            {
              transform: [
                {
                  translateY: primaryAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15 - Math.random() * 10],
                  }),
                },
              ],
              opacity: primaryAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.8, 0.3],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

function SpaceCosmos() {
  const starAnim = useRef(new Animated.Value(0)).current;
  const nebularAnim = useRef(new Animated.Value(0)).current;
  const planetAnim = useRef(new Animated.Value(0)).current;
  const cometAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    
    // Star twinkling animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(starAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(starAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Nebular cloud movement
    Animated.loop(
      Animated.timing(nebularAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
    
    // Planet rotation
    Animated.loop(
      Animated.timing(planetAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();
    
    // Comet trail
    Animated.loop(
      Animated.timing(cometAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e"]}
        style={styles.gradientBg}
      />
      
      {/* Background stars */}
      {[...Array(40)].map((_, index) => (
        <Animated.View
          key={`star-${index}`}
          style={[
            {
              position: "absolute",
              width: Math.random() > 0.7 ? 3 : 2,
              height: Math.random() > 0.7 ? 3 : 2,
              borderRadius: 1.5,
              backgroundColor: "#fff",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            },
            {
              opacity: starAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
              }),
              transform: [
                {
                  scale: starAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 0.8],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Central planet */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: 30,
            top: '35%',
            left: '30%',
            marginTop: -30,
            marginLeft: -30,
            shadowColor: '#4a90e2',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 10,
          },
          {
            transform: [
              {
                rotateY: planetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={["#4a90e2", "#2c5aa0", "#1e3a8a"]}
          style={{ flex: 1, borderRadius: 30 }}
        />
      </Animated.View>
      
      {/* Planet rings */}
      {[0, 1].map((ringIndex) => (
        <Animated.View
          key={`ring-${ringIndex}`}
          style={[
            {
              position: 'absolute',
              width: 80 + ringIndex * 20,
              height: 15,
              borderRadius: 40,
              borderWidth: 1,
              borderColor: '#6366f1',
              top: '35%',
              left: '30%',
              marginTop: -7.5,
              marginLeft: -(40 + ringIndex * 10),
            },
            {
              opacity: planetAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.6, 0.3],
              }),
              transform: [
                {
                  rotateX: planetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Nebular clouds */}
      {[...Array(4)].map((_, index) => (
        <Animated.View
          key={`nebula-${index}`}
          style={[
            {
              position: 'absolute',
              width: 80 + Math.random() * 40,
              height: 40 + Math.random() * 20,
              borderRadius: 20,
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
            },
            {
              opacity: nebularAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.1, 0.3, 0.1],
              }),
              transform: [
                {
                  translateX: nebularAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
                {
                  scale: nebularAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.1, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#8b5cf6", "#6366f1", "#3b82f6"]}
            style={{ flex: 1, borderRadius: 20 }}
          />
        </Animated.View>
      ))}
      
      {/* Comet with trail */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#fbbf24',
            top: '20%',
            left: '10%',
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 8,
          },
          {
            transform: [
              {
                translateX: cometAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 280],
                }),
              },
              {
                translateY: cometAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 180],
                }),
              },
            ],
          },
        ]}
      />
      
      {/* Comet trail */}
      {[...Array(8)].map((_, index) => (
        <Animated.View
          key={`trail-${index}`}
          style={[
            {
              position: 'absolute',
              width: 4 - index * 0.4,
              height: 4 - index * 0.4,
              borderRadius: 2,
              backgroundColor: '#fbbf24',
              top: '20%',
              left: '10%',
            },
            {
              opacity: cometAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8 - index * 0.1, 0],
              }),
              transform: [
                {
                  translateX: cometAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-index * 8, 280 - index * 8],
                  }),
                },
                {
                  translateY: cometAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-index * 5, 180 - index * 5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function CircuitBoard() {
  const dataFlowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const circuitAnim = useRef(new Animated.Value(0)).current;
  const sparkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Data flow animation
    Animated.loop(
      Animated.timing(dataFlowAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    // Node pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Circuit trace animation
    Animated.loop(
      Animated.timing(circuitAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Spark animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#0a0f0a", "#1a2e1a", "#2d4a2d"]}
        style={styles.gradientBg}
      />
      
      {/* Circuit board traces - horizontal */}
      {[...Array(6)].map((_, index) => (
        <View
          key={`h-trace-${index}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: 2,
            backgroundColor: '#004d00',
            top: `${15 + index * 12}%`,
            left: 0,
          }}
        />
      ))}
      
      {/* Circuit board traces - vertical */}
      {[...Array(8)].map((_, index) => (
        <View
          key={`v-trace-${index}`}
          style={{
            position: 'absolute',
            width: 2,
            height: '100%',
            backgroundColor: '#004d00',
            top: 0,
            left: `${10 + index * 10}%`,
          }}
        />
      ))}
      
      {/* Circuit nodes */}
      {[...Array(12)].map((_, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        return (
          <Animated.View
            key={`node-${index}`}
            style={[
              {
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#00ff00',
                top: `${20 + row * 20}%`,
                left: `${15 + col * 20}%`,
                marginTop: -4,
                marginLeft: -4,
                shadowColor: '#00ff00',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
                elevation: 6,
              },
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.8],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ]}
          />
        );
      })}
      
      {/* Data flow particles */}
      {[...Array(15)].map((_, index) => (
        <Animated.View
          key={`data-${index}`}
          style={[
            {
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#66ff66',
              top: `${15 + (index % 6) * 12}%`,
              left: '0%',
              shadowColor: '#66ff66',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 4,
              elevation: 4,
            },
            {
              transform: [
                {
                  translateX: dataFlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width - 20],
                  }),
                },
              ],
              opacity: dataFlowAnim.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
      ))}
      
      {/* Central processing unit */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 4,
            top: '40%',
            left: '50%',
            marginTop: -20,
            marginLeft: -20,
            borderWidth: 2,
            borderColor: '#00ff00',
            shadowColor: '#00ff00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 12,
            elevation: 12,
          },
          {
            transform: [
              {
                rotateZ: circuitAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={["#003300", "#006600", "#00ff00"]}
          style={{ flex: 1, borderRadius: 2 }}
        />
        
        {/* CPU pins */}
        {[...Array(16)].map((_, index) => {
          const side = Math.floor(index / 4);
          const position = index % 4;
          const isVertical = side % 2 === 0;
          
          return (
            <View
              key={`pin-${index}`}
              style={{
                position: 'absolute',
                width: isVertical ? 2 : 8,
                height: isVertical ? 8 : 2,
                backgroundColor: '#00ff00',
                ...(isVertical
                  ? {
                      top: 8 + position * 6,
                      left: side === 0 ? -4 : 42,
                    }
                  : {
                      top: side === 1 ? -4 : 42,
                      left: 8 + position * 6,
                    }),
              }}
            />
          );
        })}
      </Animated.View>
      
      {/* Electric sparks */}
      {[...Array(8)].map((_, index) => (
        <Animated.View
          key={`spark-${index}`}
          style={[
            {
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#ffff00',
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
              shadowColor: '#ffff00',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 8,
            },
            {
              opacity: sparkAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [
                {
                  scale: sparkAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.5, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Connection lines with animation */}
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={`connection-${index}`}
          style={[
            {
              position: 'absolute',
              width: 60,
              height: 2,
              backgroundColor: '#44ff44',
              top: `${25 + index * 10}%`,
              left: `${20 + (index % 2) * 40}%`,
            },
            {
              opacity: circuitAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
              }),
            },
          ]}
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
  const nodeAnim = useRef(new Animated.Value(0)).current;
  const connectionAnim = useRef(new Animated.Value(0)).current;
  const signalAnim = useRef(new Animated.Value(0)).current;
  const brainWaveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Node pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(nodeAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(nodeAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Connection strength animation
    Animated.loop(
      Animated.timing(connectionAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Signal propagation
    Animated.loop(
      Animated.timing(signalAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    // Brain wave pattern
    Animated.loop(
      Animated.timing(brainWaveAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Define neural network layers
  const layers = [
    { nodes: 4, x: 15 },  // Input layer
    { nodes: 6, x: 35 },  // Hidden layer 1
    { nodes: 6, x: 55 },  // Hidden layer 2
    { nodes: 3, x: 75 },  // Output layer
  ];

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#0f0f23", "#1a1a3a", "#2d2d5f"]}
        style={styles.gradientBg}
      />
      
      {/* Neural network connections */}
      {layers.map((layer, layerIndex) => 
        layers[layerIndex + 1] ? (
          [...Array(layer.nodes)].map((_, nodeIndex) =>
            [...Array(layers[layerIndex + 1].nodes)].map((_, nextNodeIndex) => {
              const startY = 20 + (nodeIndex * (60 / layer.nodes));
              const endY = 20 + (nextNodeIndex * (60 / layers[layerIndex + 1].nodes));
              const connectionKey = `${layerIndex}-${nodeIndex}-${nextNodeIndex}`;
              
              return (
                <Animated.View
                  key={connectionKey}
                  style={[
                    {
                      position: 'absolute',
                      height: 1,
                      backgroundColor: '#4a90e2',
                      top: `${startY}%`,
                      left: `${layer.x}%`,
                      width: `${layers[layerIndex + 1].x - layer.x}%`,
                      transformOrigin: 'left center',
                    },
                    {
                      opacity: connectionAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.2, 0.8, 0.2],
                      }),
                      transform: [
                        {
                          rotateZ: `${(endY - startY) * 2}deg`,
                        },
                      ],
                    },
                  ]}
                />
              );
            })
          )
        ) : null
      )}
      
      {/* Neural network nodes */}
      {layers.map((layer, layerIndex) =>
        [...Array(layer.nodes)].map((_, nodeIndex) => {
          const isInputLayer = layerIndex === 0;
          const isOutputLayer = layerIndex === layers.length - 1;
          
          return (
            <Animated.View
              key={`node-${layerIndex}-${nodeIndex}`}
              style={[
                {
                  position: 'absolute',
                  width: isInputLayer || isOutputLayer ? 12 : 10,
                  height: isInputLayer || isOutputLayer ? 12 : 10,
                  borderRadius: 6,
                  backgroundColor: isInputLayer ? '#00ff88' : isOutputLayer ? '#ff6b6b' : '#4a90e2',
                  top: `${20 + (nodeIndex * (60 / layer.nodes))}%`,
                  left: `${layer.x}%`,
                  marginTop: -6,
                  marginLeft: -6,
                  shadowColor: isInputLayer ? '#00ff88' : isOutputLayer ? '#ff6b6b' : '#4a90e2',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                  elevation: 8,
                },
                {
                  transform: [
                    {
                      scale: nodeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.4],
                      }),
                    },
                  ],
                  opacity: nodeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ]}
            />
          );
        })
      )}
      
      {/* Signal propagation particles */}
      {[...Array(8)].map((_, index) => (
        <Animated.View
          key={`signal-${index}`}
          style={[
            {
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#ffff00',
              top: '40%',
              shadowColor: '#ffff00',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 6,
              elevation: 6,
            },
            {
              transform: [
                {
                  translateX: signalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 280],
                  }),
                },
                {
                  translateY: signalAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange: [
                      Math.sin(index) * 20,
                      Math.sin(index + 1) * 25,
                      Math.sin(index + 2) * 15,
                      Math.sin(index + 3) * 10,
                    ],
                  }),
                },
              ],
              opacity: signalAnim.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
      ))}
      
             {/* Brain wave visualization */}
       <View
         style={{
           position: 'absolute',
           bottom: '10%',
           left: '10%',
           right: '10%',
           height: 40,
           borderWidth: 1,
           borderColor: '#4a90e2',
           borderRadius: 4,
           opacity: 0.6,
         }}
       >
         {/* Wave pattern */}
         {[...Array(20)].map((_, index) => (
           <Animated.View
             key={`wave-${index}`}
             style={[
               {
                 position: 'absolute',
                 width: 2,
                 height: 15,
                 backgroundColor: '#00ff88',
                 left: `${index * 5}%`,
                 bottom: 0,
               },
               {
                 transform: [
                   {
                     scaleY: brainWaveAnim.interpolate({
                       inputRange: [0, 1],
                       outputRange: [
                         0.5 + Math.sin(index * 0.5) * 0.3,
                         2 + Math.sin(index * 0.5 + (index * 0.1)) * 0.5,
                       ],
                     }),
                   },
                 ],
                 opacity: brainWaveAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0.4, 1],
                 }),
               },
             ]}
           />
         ))}
       </View>
      
      {/* Neural activation indicators */}
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={`activation-${index}`}
          style={[
            {
              position: 'absolute',
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#ff6b6b',
              top: `${15 + index * 12}%`,
              right: '5%',
            },
            {
              opacity: nodeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.7],
              }),
              transform: [
                {
                  scale: nodeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function DNAHelix() {
  const helixAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const transcriptionAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main helix rotation
    Animated.loop(
      Animated.timing(helixAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // Floating genetic particles
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Transcription movement
    Animated.loop(
      Animated.timing(transcriptionAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#f0f8ff', '#e6f3ff', '#cce7ff']}
        style={styles.gradientBg}
      />
      
      {/* DNA Base pairs */}
      {[...Array(15)].map((_, index) => {
        const yPosition = (index * 6) + 10;
        const rotation = (index * 24) % 360; // 24 degrees per level
        
        return (
          <Animated.View
            key={`base-pair-${index}`}
            style={[
              {
                position: 'absolute',
                top: `${yPosition}%`,
                left: '50%',
                width: 80,
                height: 8,
                marginLeft: -40,
                marginTop: -4,
              },
              {
                transform: [
                  {
                    rotateZ: helixAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${rotation}deg`, `${rotation + 360}deg`],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Left nucleotide */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  left: 0,
                  top: -2,
                  backgroundColor: index % 4 === 0 ? '#ff6b6b' : index % 4 === 1 ? '#4ecdc4' : index % 4 === 2 ? '#45b7d1' : '#96ceb4',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                },
                {
                  transform: [
                    {
                      scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            
            {/* Connection line */}
            <View
              style={{
                position: 'absolute',
                width: 56,
                height: 2,
                backgroundColor: '#8e44ad',
                left: 12,
                top: 3,
                borderRadius: 1,
              }}
            />
            
            {/* Right nucleotide */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  right: 0,
                  top: -2,
                  backgroundColor: index % 4 === 0 ? '#4ecdc4' : index % 4 === 1 ? '#ff6b6b' : index % 4 === 2 ? '#96ceb4' : '#45b7d1',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                },
                {
                  transform: [
                    {
                      scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>
        );
      })}
      
      {/* DNA backbone spirals */}
      {[0, 1].map((spiral) => (
        <View key={`spiral-${spiral}`} style={{ position: 'absolute', width: '100%', height: '100%' }}>
          {[...Array(25)].map((_, index) => {
            const yPos = index * 4;
            const angle = (index * 24 + spiral * 180) % 360;
            const radius = 40;
            const x = 50 + (Math.cos(angle * Math.PI / 180) * radius / 3);
            
            return (
              <Animated.View
                key={`spiral-${spiral}-${index}`}
                style={[
                  {
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: spiral === 0 ? '#3498db' : '#e74c3c',
                    top: `${yPos}%`,
                    left: `${x}%`,
                    marginLeft: -3,
                    marginTop: -3,
                  },
                  {
                    transform: [
                      {
                        rotateZ: helixAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [`${angle}deg`, `${angle + 360}deg`],
                        }),
                      },
                    ],
                    opacity: helixAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.6, 1, 0.6],
                    }),
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
      
             {/* Transcription bubble */}
       <Animated.View
         style={[
           {
             position: 'absolute',
             width: 60,
             height: 30,
             borderRadius: 15,
             borderWidth: 2,
             borderColor: '#f39c12',
             backgroundColor: 'rgba(243, 156, 18, 0.2)',
             left: '50%',
             marginLeft: -30,
             top: '10%',
           },
           {
             transform: [
               {
                 translateY: transcriptionAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0, 200],
                 }),
               },
             ],
             opacity: transcriptionAnim.interpolate({
               inputRange: [0, 0.1, 0.9, 1],
               outputRange: [0, 1, 1, 0],
             }),
           },
         ]}
       />
      
      {/* Floating genetic elements */}
      {[...Array(12)].map((_, index) => (
        <Animated.View
          key={`float-${index}`}
          style={[
            {
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][index % 4],
              top: `${15 + Math.random() * 70}%`,
              left: `${10 + Math.random() * 80}%`,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 2,
            },
            {
              transform: [
                {
                  translateY: particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20 - Math.random() * 15],
                  }),
                },
                {
                  rotateZ: particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
              opacity: particleAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 0.8, 0.4],
              }),
            },
          ]}
        />
      ))}
      
      {/* Gene expression indicators */}
      {[...Array(4)].map((_, index) => (
        <Animated.View
          key={`gene-${index}`}
          style={[
            {
              position: 'absolute',
              width: 25,
              height: 4,
              backgroundColor: '#8e44ad',
              right: '10%',
              borderRadius: 2,
              top: `${20 + index * 15}%`,
            },
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  scaleX: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1.3],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function OceanWaves() {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth rotation animation
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();

    // Scale pulsing animation
    Animated.loop(
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // Floating movement
    Animated.loop(
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460', '#533a7b']}
        style={styles.gradientBg}
      />
      
      {/* Main central geometric shape */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 80,
            height: 80,
            marginTop: -40,
            marginLeft: -40,
            borderRadius: 10,
          },
          {
            transform: [
              {
                rotate: rotationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#ff6b6b', '#4ecdc4', '#45b7d1']}
          style={{ flex: 1, borderRadius: 10 }}
        />
      </Animated.View>

      {/* Orbiting geometric elements */}
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={`orbit-${index}`}
          style={[
            {
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 20,
              height: 20,
              marginTop: -10,
              marginLeft: -10,
              borderRadius: index % 2 === 0 ? 10 : 3,
            },
            {
              transform: [
                {
                  translateX: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      Math.cos((index * 60) * (Math.PI / 180)) * 60,
                      Math.cos((index * 60 + 360) * (Math.PI / 180)) * 60,
                    ],
                  }),
                },
                {
                  translateY: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      Math.sin((index * 60) * (Math.PI / 180)) * 60,
                      Math.sin((index * 60 + 360) * (Math.PI / 180)) * 60,
                    ],
                  }),
                },
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-360deg'],
                  }),
                },
              ],
              opacity: rotationAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.7, 1, 0.7],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={
              index % 3 === 0
                ? ['#ff9a9e', '#fecfef']
                : index % 3 === 1
                ? ['#a8edea', '#fed6e3']
                : ['#ffecd2', '#fcb69f']
            }
            style={{ flex: 1, borderRadius: index % 2 === 0 ? 10 : 3 }}
          />
        </Animated.View>
      ))}

      {/* Floating background shapes */}
      {[...Array(8)].map((_, index) => (
        <Animated.View
          key={`float-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${15 + (index * 12) % 70}%`,
              left: `${10 + (index * 15) % 80}%`,
              width: 12 + (index % 3) * 4,
              height: 12 + (index % 3) * 4,
              borderRadius: index % 2 === 0 ? 50 : 2,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            {
              transform: [
                {
                  translateX: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(index * 0.7) * 25],
                  }),
                },
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(index * 0.5) * 20],
                  }),
                },
                {
                  rotate: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${index * 45}deg`],
                  }),
                },
              ],
              opacity: floatAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.7, 0.3],
              }),
            },
          ]}
        />
      ))}

             {/* Corner accent shapes */}
       <Animated.View
         style={[
           {
             position: 'absolute',
             top: '15%',
             left: '15%',
             width: 30,
             height: 30,
             borderRadius: 15,
           },
           {
             transform: [
               {
                 scale: scaleAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0.6, 1],
                 }),
               },
               {
                 rotate: rotationAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: ['0deg', '90deg'],
                 }),
               },
             ],
             opacity: scaleAnim.interpolate({
               inputRange: [0, 0.5, 1],
               outputRange: [0.4, 0.8, 0.4],
             }),
           },
         ]}
       >
         <LinearGradient
           colors={['rgba(255, 107, 107, 0.6)', 'rgba(78, 205, 196, 0.6)']}
           style={{ flex: 1, borderRadius: 15 }}
         />
       </Animated.View>
       
       <Animated.View
         style={[
           {
             position: 'absolute',
             top: '15%',
             right: '15%',
             width: 30,
             height: 30,
             borderRadius: 15,
           },
           {
             transform: [
               {
                 scale: scaleAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0.6, 1],
                 }),
               },
               {
                 rotate: rotationAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: ['0deg', '180deg'],
                 }),
               },
             ],
             opacity: scaleAnim.interpolate({
               inputRange: [0, 0.5, 1],
               outputRange: [0.4, 0.8, 0.4],
             }),
           },
         ]}
       >
         <LinearGradient
           colors={['rgba(255, 107, 107, 0.6)', 'rgba(78, 205, 196, 0.6)']}
           style={{ flex: 1, borderRadius: 15 }}
         />
       </Animated.View>
       
       <Animated.View
         style={[
           {
             position: 'absolute',
             bottom: '15%',
             left: '15%',
             width: 30,
             height: 30,
             borderRadius: 15,
           },
           {
             transform: [
               {
                 scale: scaleAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0.6, 1],
                 }),
               },
               {
                 rotate: rotationAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: ['0deg', '270deg'],
                 }),
               },
             ],
             opacity: scaleAnim.interpolate({
               inputRange: [0, 0.5, 1],
               outputRange: [0.4, 0.8, 0.4],
             }),
           },
         ]}
       >
         <LinearGradient
           colors={['rgba(255, 107, 107, 0.6)', 'rgba(78, 205, 196, 0.6)']}
           style={{ flex: 1, borderRadius: 15 }}
         />
       </Animated.View>
       
       <Animated.View
         style={[
           {
             position: 'absolute',
             bottom: '15%',
             right: '15%',
             width: 30,
             height: 30,
             borderRadius: 15,
           },
           {
             transform: [
               {
                 scale: scaleAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0.6, 1],
                 }),
               },
               {
                 rotate: rotationAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: ['0deg', '360deg'],
                 }),
               },
             ],
             opacity: scaleAnim.interpolate({
               inputRange: [0, 0.5, 1],
               outputRange: [0.4, 0.8, 0.4],
             }),
           },
         ]}
       >
         <LinearGradient
           colors={['rgba(255, 107, 107, 0.6)', 'rgba(78, 205, 196, 0.6)']}
           style={{ flex: 1, borderRadius: 15 }}
         />
       </Animated.View>
    </View>
  );
}

function FireEnergy() {
  const flameAnim = useRef(new Animated.Value(0)).current;
  const emberAnim = useRef(new Animated.Value(0)).current;
  const heatWaveAnim = useRef(new Animated.Value(0)).current;
  const sparkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main flame animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating embers
    Animated.loop(
      Animated.timing(emberAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Heat wave distortion
    Animated.loop(
      Animated.timing(heatWaveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Spark bursts
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#1a0a00', '#4d1a00', '#802600', '#ff4500']}
        style={styles.gradientBg}
      />
      
      {/* Main flame layers */}
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={`flame-${index}`}
          style={[
            {
              position: 'absolute',
              bottom: '10%',
              left: '50%',
              width: 60 - index * 8,
              height: 80 + index * 15,
              marginLeft: -(30 - index * 4),
              borderRadius: 30,
            },
            {
              transform: [
                {
                  scaleY: flameAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.3 + index * 0.1],
                  }),
                },
                {
                  scaleX: flameAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.8 + Math.sin(index) * 0.3],
                  }),
                },
              ],
              opacity: flameAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6 + index * 0.1, 0.9 - index * 0.1],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={
              index < 2
                ? ['#ffff00', '#ff8c00', '#ff4500']
                : index < 4
                ? ['#ff8c00', '#ff4500', '#dc143c']
                : ['#ff4500', '#dc143c', '#8b0000']
            }
            style={{ flex: 1, borderRadius: 30 }}
          />
        </Animated.View>
      ))}
      
      {/* Fire core */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: '15%',
            left: '50%',
            width: 20,
            height: 30,
            marginLeft: -10,
            borderRadius: 10,
            backgroundColor: '#ffffff',
            shadowColor: '#ffff00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 15,
            elevation: 15,
          },
          {
            transform: [
              {
                scale: flameAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.4],
                }),
              },
            ],
            opacity: flameAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
        ]}
      />
      
      {/* Floating embers */}
      {[...Array(20)].map((_, index) => (
        <Animated.View
          key={`ember-${index}`}
          style={[
            {
              position: 'absolute',
              width: 4 + Math.random() * 4,
              height: 4 + Math.random() * 4,
              borderRadius: 4,
              backgroundColor: ['#ff4500', '#ff8c00', '#ffff00', '#dc143c'][Math.floor(Math.random() * 4)],
              bottom: '20%',
              left: `${40 + Math.random() * 20}%`,
              shadowColor: '#ff4500',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 4,
            },
            {
              transform: [
                {
                  translateY: emberAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -200 - Math.random() * 100],
                  }),
                },
                {
                  translateX: emberAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (Math.random() - 0.5) * 60],
                  }),
                },
              ],
              opacity: emberAnim.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [1, 0.8, 0.5, 0],
              }),
            },
          ]}
        />
      ))}
      
      {/* Heat wave effects */}
      {[...Array(4)].map((_, index) => (
        <Animated.View
          key={`heat-${index}`}
          style={[
            {
              position: 'absolute',
              width: 100,
              height: 60,
              borderRadius: 50,
              borderWidth: 1,
              borderColor: '#ff8c00',
              bottom: `${30 + index * 15}%`,
              left: '50%',
              marginLeft: -50,
            },
            {
              opacity: heatWaveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.6],
              }),
              transform: [
                {
                  scaleX: heatWaveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
                {
                  scaleY: heatWaveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Spark bursts */}
      {[...Array(12)].map((_, index) => {
        const angle = (index * 30) * (Math.PI / 180);
        return (
          <Animated.View
            key={`spark-${index}`}
            style={[
              {
                position: 'absolute',
                width: 3,
                height: 15,
                backgroundColor: '#ffff00',
                bottom: '25%',
                left: '50%',
                marginLeft: -1.5,
                borderRadius: 1.5,
                shadowColor: '#ffff00',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 6,
                elevation: 6,
              },
              {
                transform: [
                  {
                    rotateZ: `${index * 30}deg`,
                  },
                  {
                    translateY: sparkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -40],
                    }),
                  },
                ],
                opacity: sparkAnim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 1, 0],
                }),
              },
            ]}
          />
        );
      })}
      
      {/* Energy aura */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: '5%',
            left: '50%',
            width: 120,
            height: 120,
            borderRadius: 60,
            marginLeft: -60,
            borderWidth: 2,
            borderColor: '#ff4500',
          },
          {
            opacity: flameAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.5],
            }),
            transform: [
              {
                scale: flameAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
          },
        ]}
      />
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

function StockMarket() {
  const chartAnim = useRef(new Animated.Value(0)).current;
  const candlestickAnim = useRef(new Animated.Value(0)).current;
  const trendAnim = useRef(new Animated.Value(0)).current;
  const volumeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Chart line animation
    Animated.loop(
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Candlestick movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(candlestickAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(candlestickAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Trend indicators
    Animated.loop(
      Animated.timing(trendAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Volume bars
    Animated.loop(
      Animated.timing(volumeAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#334155"]}
        style={styles.gradientBg}
      />
      
      {/* Stock chart grid */}
      {[...Array(5)].map((_, index) => (
        <View
          key={`grid-h-${index}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: 1,
            backgroundColor: '#374151',
            top: `${20 + index * 15}%`,
            opacity: 0.3,
          }}
        />
      ))}
      {[...Array(6)].map((_, index) => (
        <View
          key={`grid-v-${index}`}
          style={{
            position: 'absolute',
            height: '100%',
            width: 1,
            backgroundColor: '#374151',
            left: `${10 + index * 15}%`,
            opacity: 0.3,
          }}
        />
      ))}
      
      {/* Animated chart line */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: '40%',
            left: '10%',
            width: '80%',
            height: 3,
            backgroundColor: '#10b981',
            borderRadius: 2,
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 8,
          },
          {
            transform: [
              {
                scaleX: chartAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
            opacity: chartAnim.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 1, 0.8],
            }),
          },
        ]}
      />
      
      {/* Candlestick charts */}
      {[...Array(8)].map((_, index) => (
        <Animated.View
          key={`candle-${index}`}
          style={[
            {
              position: 'absolute',
              width: 8,
              height: 20 + Math.random() * 30,
              backgroundColor: Math.random() > 0.5 ? '#10b981' : '#ef4444',
              left: `${15 + index * 10}%`,
              top: `${35 + Math.random() * 20}%`,
              borderRadius: 2,
            },
            {
              transform: [
                {
                  scaleY: candlestickAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.2],
                  }),
                },
              ],
              opacity: candlestickAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 1, 0.6],
              }),
            },
          ]}
        />
      ))}
      
      {/* Volume bars at bottom */}
      {[...Array(12)].map((_, index) => (
        <Animated.View
          key={`volume-${index}`}
          style={[
            {
              position: 'absolute',
              width: 6,
              height: 10 + Math.random() * 15,
              backgroundColor: '#6366f1',
              left: `${10 + index * 7}%`,
              bottom: '15%',
              borderRadius: 1,
              opacity: 0.7,
            },
            {
              transform: [
                {
                  scaleY: volumeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Floating financial indicators */}
      {['$', '€', '¥', '£'].map((symbol, index) => (
        <Animated.View
          key={`symbol-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${20 + index * 15}%`,
              right: '10%',
              opacity: 0.4,
            },
            {
              transform: [
                {
                  translateY: trendAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={{ color: '#64748b', fontSize: 18, fontWeight: 'bold' }}>
            {symbol}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

function CurrencyFlow() {
  const flowAnim = useRef(new Animated.Value(0)).current;
  const exchangeAnim = useRef(new Animated.Value(0)).current;
  const globalAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Money flow animation
    Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Exchange rate animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(exchangeAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(exchangeAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Global network pulse
    Animated.loop(
      Animated.timing(globalAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // Currency pulse
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#064e3b", "#065f46", "#047857"]}
        style={styles.gradientBg}
      />
      
      {/* Central financial hub */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#10b981',
            top: '50%',
            left: '50%',
            marginTop: -20,
            marginLeft: -20,
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 10,
          },
          {
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.3],
                }),
              },
            ],
          },
        ]}
      />
      
      {/* Currency streams */}
      {[...Array(6)].map((_, index) => {
        const angle = (index * 60) * (Math.PI / 180);
        return (
          <View key={`stream-${index}`}>
            {[...Array(8)].map((_, dotIndex) => (
              <Animated.View
                key={`dot-${index}-${dotIndex}`}
                style={[
                  {
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#34d399',
                    top: '50%',
                    left: '50%',
                    marginTop: -3,
                    marginLeft: -3,
                  },
                  {
                    transform: [
                      {
                        translateX: flowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            Math.cos(angle) * (30 + dotIndex * 8),
                            Math.cos(angle) * (30 + dotIndex * 8 + 100),
                          ],
                        }),
                      },
                      {
                        translateY: flowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            Math.sin(angle) * (30 + dotIndex * 8),
                            Math.sin(angle) * (30 + dotIndex * 8 + 100),
                          ],
                        }),
                      },
                    ],
                    opacity: flowAnim.interpolate({
                      inputRange: [0, 0.3, 0.7, 1],
                      outputRange: [0, 1, 0.8, 0],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        );
      })}
      
      {/* Exchange rate indicators */}
      {[
        { from: 'USD', to: 'EUR', rate: '0.85' },
        { from: 'GBP', to: 'USD', rate: '1.27' },
        { from: 'JPY', to: 'USD', rate: '0.007' }
      ].map((exchange, index) => (
        <Animated.View
          key={`exchange-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${25 + index * 20}%`,
              left: '10%',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#10b981',
            },
            {
              opacity: exchangeAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.5, 1, 0.5],
              }),
              transform: [
                {
                  scale: exchangeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.9, 1, 0.9],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold' }}>
            {exchange.from}/{exchange.to}
          </Text>
          <Text style={{ color: '#34d399', fontSize: 8 }}>
            {exchange.rate}
          </Text>
        </Animated.View>
      ))}
      
      {/* Global network connections */}
      {[...Array(4)].map((_, index) => (
        <Animated.View
          key={`connection-${index}`}
          style={[
            {
              position: 'absolute',
              width: 80 + index * 20,
              height: 80 + index * 20,
              borderRadius: 40 + index * 10,
              borderWidth: 1,
              borderColor: '#059669',
              top: '50%',
              left: '50%',
              marginTop: -(40 + index * 10),
              marginLeft: -(40 + index * 10),
            },
            {
              opacity: globalAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3 - index * 0.05, 0.1, 0],
              }),
              transform: [
                {
                  scale: globalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function EconomicGrowth() {
  const growthAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const dataAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Growth animation
    Animated.loop(
      Animated.timing(growthAnim, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: true,
      })
    ).start();

    // Chart building animation
    Animated.loop(
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Arrow movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Data flow
    Animated.loop(
      Animated.timing(dataAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#1e3a8a", "#3730a3", "#581c87"]}
        style={styles.gradientBg}
      />
      
      {/* Growth bars */}
      {[...Array(7)].map((_, index) => (
        <Animated.View
          key={`bar-${index}`}
          style={[
            {
              position: 'absolute',
              width: 20,
              height: 40 + index * 15,
              backgroundColor: '#3b82f6',
              left: `${15 + index * 11}%`,
              bottom: '20%',
              borderRadius: 4,
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 6,
              elevation: 6,
            },
            {
              transform: [
                {
                  scaleY: growthAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 1],
                  }),
                },
              ],
              opacity: growthAnim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.4, 1, 0.8],
              }),
            },
          ]}
        />
      ))}
      
      {/* Trend line overlay */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: '20%',
            left: '15%',
            width: '70%',
            height: 3,
            backgroundColor: '#fbbf24',
            borderRadius: 2,
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 8,
          },
          {
            transform: [
              {
                scaleX: chartAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
              {
                translateY: chartAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -50],
                }),
              },
            ],
          },
        ]}
      />
      
      {/* Upward trending arrows */}
      {[...Array(3)].map((_, index) => (
        <Animated.View
          key={`arrow-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${30 + index * 15}%`,
              right: '15%',
              width: 0,
              height: 0,
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderBottomWidth: 15,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#10b981',
            },
            {
              transform: [
                {
                  translateY: arrowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, -5],
                  }),
                },
              ],
              opacity: arrowAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 1, 0.4],
              }),
            },
          ]}
        />
      ))}
      
      {/* Economic indicators */}
      {['GDP', 'INF', 'UNE', 'INT'].map((indicator, index) => (
        <Animated.View
          key={`indicator-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${15 + index * 8}%`,
              left: '10%',
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#3b82f6',
            },
                       {
             opacity: dataAnim.interpolate({
               inputRange: [0, 0.2 + index * 0.15, 0.4 + index * 0.15, 1],
               outputRange: [0.3, 1, 1, 0.3],
             }),
           },
          ]}
        >
          <Text style={{ color: '#93c5fd', fontSize: 8, fontWeight: 'bold' }}>
            {indicator}
          </Text>
        </Animated.View>
      ))}
      
      {/* Data points */}
      {[...Array(12)].map((_, index) => (
        <Animated.View
          key={`point-${index}`}
          style={[
            {
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#f59e0b',
              top: `${25 + Math.random() * 50}%`,
              left: `${15 + Math.random() * 70}%`,
            },
            {
              opacity: dataAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.8, 0],
              }),
              transform: [
                {
                  scale: dataAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.5, 0.5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function BookLearning() {
  const networkPulseAnim = useRef(new Animated.Value(0)).current;
  const knowledgeFlowAnim = useRef(new Animated.Value(0)).current;
  const nodeActivationAnim = useRef(new Animated.Value(0)).current;
  const synapseAnim = useRef(new Animated.Value(0)).current;
  const learningWaveAnim = useRef(new Animated.Value(0)).current;

  // Pre-calculate evenly distributed node positions
  const nodePositions = useMemo(() => [
    { x: 50, y: 20 }, // Top center
    { x: 20, y: 35 }, // Left upper
    { x: 80, y: 35 }, // Right upper
    { x: 35, y: 50 }, // Left center
    { x: 65, y: 50 }, // Right center
    { x: 50, y: 65 }, // Bottom center
    { x: 25, y: 80 }, // Left lower
    { x: 75, y: 80 }, // Right lower
  ], []);

  // Connection paths between nodes (creating a balanced network)
  const connections = useMemo(() => [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7], [1, 6], [2, 7]
  ], []);

  useEffect(() => {
    // Network pulse animation
    Animated.loop(
      Animated.timing(networkPulseAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Knowledge flowing through network
    Animated.loop(
      Animated.timing(knowledgeFlowAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Node activation waves
    Animated.loop(
      Animated.timing(nodeActivationAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();

    // Synapse firing
    Animated.loop(
      Animated.timing(synapseAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    // Learning wave propagation
    Animated.loop(
      Animated.timing(learningWaveAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#451a03", "#78350f", "#a16207", "#ca8a04"]}
        style={styles.gradientBg}
      />
      
      {/* Knowledge Network Nodes */}
      {nodePositions.map((node, index) => (
        <Animated.View
          key={`node-${index}`}
          style={[
            {
              position: 'absolute',
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#fbbf24',
              left: `${node.x}%`,
              top: `${node.y}%`,
              marginLeft: -12,
              marginTop: -12,
              shadowColor: '#f59e0b',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
              elevation: 8,
            },
            {
              transform: [
                {
                  scale: nodeActivationAnim.interpolate({
                    inputRange: [0, Math.min(index * 0.125, 0.6), Math.min(index * 0.125 + 0.25, 0.8), 1],
                    outputRange: [1, 1.5, 1.2, 1],
                  }),
                },
              ],
              opacity: nodeActivationAnim.interpolate({
                inputRange: [0, Math.min(index * 0.125, 0.6), Math.min(index * 0.125 + 0.25, 0.8), 1],
                outputRange: [0.7, 1, 0.9, 0.7],
              }),
            },
          ]}
        >
          {/* Node core */}
          <View style={{
            position: 'absolute',
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#fffbeb',
            top: 6,
            left: 6,
          }} />
        </Animated.View>
      ))}
      
      {/* Connection Lines between nodes */}
      {connections.map((connection, index) => {
        const fromNode = nodePositions[connection[0]];
        const toNode = nodePositions[connection[1]];
        const deltaX = toNode.x - fromNode.x;
        const deltaY = toNode.y - fromNode.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        return (
          <Animated.View
            key={`connection-${index}`}
            style={[
              {
                position: 'absolute',
                left: `${fromNode.x}%`,
                top: `${fromNode.y}%`,
                width: distance * 2.8, // Scaling factor for percentage to pixels
                height: 3,
                backgroundColor: '#f59e0b',
                transformOrigin: 'left center',
                borderRadius: 2,
              },
              {
                transform: [
                  { rotate: `${angle}deg` },
                ],
                opacity: synapseAnim.interpolate({
                  inputRange: [0, Math.min(index * 0.1, 0.5), Math.min(index * 0.1 + 0.2, 0.7), 1],
                  outputRange: [0.3, 0.8, 0.6, 0.3],
                }),
              },
            ]}
          />
        );
      })}
      
      {/* Knowledge particles flowing through network */}
      {connections.map((connection, index) => {
        const fromNode = nodePositions[connection[0]];
        const toNode = nodePositions[connection[1]];
        
        // Calculate the translation distance in pixels (approximate conversion from percentage)
        const deltaX = (toNode.x - fromNode.x) * 3; // Rough conversion factor for percentage to pixels
        const deltaY = (toNode.y - fromNode.y) * 3; // Rough conversion factor for percentage to pixels
        
        return (
          <Animated.View
            key={`flow-particle-${index}`}
            style={[
              {
                position: 'absolute',
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#fde047',
                left: `${fromNode.x}%`,
                top: `${fromNode.y}%`,
                marginLeft: -3,
                marginTop: -3,
              },
              {
                opacity: knowledgeFlowAnim.interpolate({
                  inputRange: [0, 0.1, 0.9, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: knowledgeFlowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, deltaX],
                    }),
                  },
                  {
                    translateY: knowledgeFlowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, deltaY],
                    }),
                  },
                  {
                    scale: knowledgeFlowAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.2, 0.5],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
      
      {/* Learning wave pulses */}
      {[...Array(4)].map((_, index) => (
        <Animated.View
          key={`wave-${index}`}
          style={[
            {
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 100 + index * 40,
              height: 100 + index * 40,
              borderRadius: 50 + index * 20,
              borderWidth: 2,
              borderColor: '#fbbf24',
              marginTop: -(50 + index * 20),
              marginLeft: -(50 + index * 20),
            },
            {
              transform: [
                {
                  scale: learningWaveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.8],
                  }),
                },
              ],
              opacity: learningWaveAnim.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 0.6 - index * 0.1, 0.3 - index * 0.05, 0],
              }),
            },
          ]}
        />
      ))}
      
      {/* Floating learning symbols */}
      {['📚', '🧠', '💡', '🎓', '📖', '⚗️', '🔬', '📊'].map((symbol, index) => (
        <Animated.View
          key={`learning-symbol-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${15 + (index % 4) * 25}%`,
              left: `${10 + Math.floor(index / 4) * 80}%`,
            },
            {
              transform: [
                {
                  translateY: networkPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10 - Math.random() * 15],
                  }),
                },
                {
                  rotate: networkPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${(Math.random() - 0.5) * 20}deg`],
                  }),
                },
              ],
              opacity: networkPulseAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 1, 0.6],
              }),
            },
          ]}
        >
          <Text style={{
            fontSize: 20,
            textShadowColor: '#f59e0b',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
          }}>
            {symbol}
          </Text>
        </Animated.View>
      ))}
      
      {/* Central knowledge hub */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f59e0b',
            top: '50%',
            left: '50%',
            marginTop: -20,
            marginLeft: -20,
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 15,
            elevation: 15,
          },
          {
            transform: [
              {
                scale: networkPulseAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.3, 1],
                }),
              },
            ],
            opacity: networkPulseAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.9, 1, 0.9],
            }),
          },
        ]}
      >
        <View style={{
          position: 'absolute',
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#fffbeb',
          top: 10,
          left: 10,
        }} />
      </Animated.View>
    </View>
  );
}

function DigitalClassroom() {
  const screenAnim = useRef(new Animated.Value(0)).current;
  const dataTransferAnim = useRef(new Animated.Value(0)).current;
  const interactionAnim = useRef(new Animated.Value(0)).current;
  const cloudAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Screen/device animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(screenAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(screenAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Data transfer between devices
    Animated.loop(
      Animated.timing(dataTransferAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Interactive elements
    Animated.loop(
      Animated.timing(interactionAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Cloud connectivity
    Animated.loop(
      Animated.timing(cloudAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={["#1e3a8a", "#2563eb", "#3b82f6"]}
        style={styles.gradientBg}
      />
      
      {/* Central tablet/screen */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 70,
            height: 90,
            backgroundColor: '#1f2937',
            borderRadius: 12,
            top: '40%',
            left: '50%',
            marginTop: -45,
            marginLeft: -35,
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 12,
          },
          {
            transform: [
              {
                scale: screenAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Screen content */}
        <View style={{
          position: 'absolute',
          width: '85%',
          height: '80%',
          top: '10%',
          left: '7.5%',
          backgroundColor: '#3b82f6',
          borderRadius: 8,
        }} />
        
        {/* Screen elements */}
        {[...Array(4)].map((_, index) => (
          <Animated.View
            key={`screen-element-${index}`}
            style={[
              {
                position: 'absolute',
                width: '70%',
                height: 3,
                backgroundColor: '#e5e7eb',
                left: '15%',
                top: `${25 + index * 15}%`,
                borderRadius: 2,
              },
              {
                opacity: screenAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1, 0.5],
                }),
              },
            ]}
          />
        ))}
      </Animated.View>
      
      {/* Surrounding devices */}
      {[
        { x: 25, y: 25, size: 40 },
        { x: 75, y: 25, size: 45 },
        { x: 20, y: 70, size: 35 },
        { x: 80, y: 70, size: 38 }
      ].map((device, index) => (
        <Animated.View
          key={`device-${index}`}
          style={[
            {
              position: 'absolute',
              width: device.size,
              height: device.size * 1.2,
              backgroundColor: '#374151',
              borderRadius: 8,
              left: `${device.x}%`,
              top: `${device.y}%`,
              marginLeft: -device.size / 2,
              marginTop: -device.size * 0.6,
            },
            {
              opacity: interactionAnim.interpolate({
                inputRange: [0, index * 0.2, index * 0.2 + 0.2, 1],
                outputRange: [0.6, 1, 0.8, 0.6],
              }),
            },
          ]}
        >
          <View style={{
            position: 'absolute',
            width: '80%',
            height: '70%',
            top: '15%',
            left: '10%',
            backgroundColor: '#60a5fa',
            borderRadius: 4,
          }} />
        </Animated.View>
      ))}
      
      {/* Data transfer streams */}
      {[...Array(8)].map((_, index) => {
        const angle = (index * 45) * (Math.PI / 180);
        return (
          <Animated.View
            key={`data-${index}`}
            style={[
              {
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#fbbf24',
                top: '50%',
                left: '50%',
                marginTop: -2,
                marginLeft: -2,
              },
              {
                transform: [
                  {
                    translateX: dataTransferAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        Math.cos(angle) * 20,
                        Math.cos(angle) * 80,
                      ],
                    }),
                  },
                  {
                    translateY: dataTransferAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        Math.sin(angle) * 20,
                        Math.sin(angle) * 80,
                      ],
                    }),
                  },
                ],
                opacity: dataTransferAnim.interpolate({
                  inputRange: [0, 0.3, 0.7, 1],
                  outputRange: [0, 1, 0.8, 0],
                }),
              },
            ]}
          />
        );
      })}
      
      {/* Cloud connectivity at top */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: '10%',
            left: '50%',
            width: 60,
            height: 35,
            marginLeft: -30,
          },
          {
            opacity: cloudAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.5, 1, 0.5],
            }),
            transform: [
              {
                scale: cloudAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.9, 1.1, 0.9],
                }),
              },
            ],
          },
        ]}
      >
        {/* Cloud shape */}
        <View style={{
          width: 60,
          height: 35,
          backgroundColor: '#e5e7eb',
          borderRadius: 20,
        }} />
        <View style={{
          position: 'absolute',
          width: 25,
          height: 25,
          backgroundColor: '#e5e7eb',
          borderRadius: 15,
          top: -8,
          left: 15,
        }} />
        <View style={{
          position: 'absolute',
          width: 20,
          height: 20,
          backgroundColor: '#e5e7eb',
          borderRadius: 12,
          top: -5,
          right: 10,
        }} />
      </Animated.View>
      
      {/* Learning progress indicators */}
      {[...Array(3)].map((_, index) => (
        <Animated.View
          key={`progress-${index}`}
          style={[
            {
              position: 'absolute',
              bottom: '15%',
              left: `${25 + index * 25}%`,
              width: 40,
              height: 6,
              backgroundColor: 'rgba(251, 191, 36, 0.3)',
              borderRadius: 3,
            },
            {
              opacity: interactionAnim.interpolate({
                inputRange: [0, index * 0.25, index * 0.25 + 0.25, 1],
                outputRange: [0.4, 1, 0.8, 0.4],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              {
                height: '100%',
                backgroundColor: '#fbbf24',
                borderRadius: 3,
                alignSelf: 'flex-start',
              },
              {
                transform: [{
                  scaleX: interactionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 1],
                  }),
                }],
              },
            ]}
          />
        </Animated.View>
      ))}
    </View>
  );
}

function AuroraInspiration() {
  const starTwinkleAnim = useRef(new Animated.Value(0)).current;
  const auroraAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Star twinkling animation - perfectly smooth loop
    Animated.loop(
      Animated.timing(starTwinkleAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Aurora movement - seamless loop
    Animated.loop(
      Animated.timing(auroraAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Gentle floating movement
    Animated.loop(
      Animated.timing(floatingAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradientBg}
      />
      
      {/* Aurora bands */}
      {[...Array(4)].map((_, index) => (
        <Animated.View
          key={`aurora-${index}`}
          style={[
            {
              position: 'absolute',
              width: '120%',
              height: 40,
              top: `${20 + index * 15}%`,
              left: '-10%',
              borderRadius: 20,
            },
            {
              transform: [
                {
                  translateX: auroraAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 30 - index * 10],
                  }),
                },
                {
                  scaleY: auroraAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 1],
                  }),
                },
              ],
              opacity: auroraAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.8, 0.3],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={
              index % 2 === 0
                ? ['transparent', '#00ff88', '#00ccff', 'transparent']
                : ['transparent', '#ff6b6b', '#4ecdc4', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 20 }}
          />
        </Animated.View>
      ))}
      
      {/* Stars */}
      {[...Array(25)].map((_, index) => (
        <Animated.View
          key={`star-${index}`}
          style={[
            {
              position: 'absolute',
              width: Math.random() > 0.7 ? 4 : 2,
              height: Math.random() > 0.7 ? 4 : 2,
              borderRadius: 2,
              backgroundColor: '#f3f4f6',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            },
            {
              opacity: starTwinkleAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
              }),
              transform: [
                {
                  scale: starTwinkleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 0.8],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Floating inspiration particles */}
      {[...Array(15)].map((_, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={[
            {
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#fbbf24',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            },
            {
              transform: [
                {
                  translateY: floatingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20 - Math.random() * 30],
                  }),
                },
              ],
              opacity: floatingAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 0.8, 0.4],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

function FractalGeometry() {
  const fractalAnim = useRef(new Animated.Value(0)).current;
  const spiralAnim = useRef(new Animated.Value(0)).current;
  const recursiveAnim = useRef(new Animated.Value(0)).current;
  const goldenRatioAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main fractal animation
    Animated.loop(
      Animated.timing(fractalAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Fibonacci spiral animation
    Animated.loop(
      Animated.timing(spiralAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();

    // Recursive pattern animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(recursiveAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(recursiveAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Golden ratio animation
    Animated.loop(
      Animated.timing(goldenRatioAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradientBg}
      />
      
      {/* Main fractal structure - Mandelbrot-inspired */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 100,
            height: 100,
            top: '50%',
            left: '50%',
            marginTop: -50,
            marginLeft: -50,
          },
          {
            transform: [
              {
                rotate: fractalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
              {
                scale: fractalAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 1.2, 0.8],
                }),
              },
            ],
          },
        ]}
      >
        {/* Recursive geometric patterns */}
        {[...Array(8)].map((_, index) => {
          const angle = (index * 45) * (Math.PI / 180);
          const radius = 30;
          
          return (
            <Animated.View
              key={`fractal-${index}`}
              style={[
                {
                  position: 'absolute',
                  width: 20 - index * 2,
                  height: 20 - index * 2,
                  borderRadius: 10 - index,
                  backgroundColor: '#ffd700',
                  top: '50%',
                  left: '50%',
                  marginTop: -(10 - index),
                  marginLeft: -(10 - index),
                  borderWidth: 1,
                  borderColor: '#ffeb3b',
                  shadowColor: '#ffd700',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 5,
                  elevation: 5,
                },
                {
                  transform: [
                    {
                      translateX: recursiveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          Math.cos(angle) * (radius - index * 3),
                          Math.cos(angle) * (radius + index * 2),
                        ],
                      }),
                    },
                    {
                      translateY: recursiveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          Math.sin(angle) * (radius - index * 3),
                          Math.sin(angle) * (radius + index * 2),
                        ],
                      }),
                    },
                    {
                      rotate: recursiveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${360 + index * 45}deg`],
                      }),
                    },
                  ],
                  opacity: recursiveAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.9 - index * 0.1, 1, 0.9 - index * 0.1],
                  }),
                },
              ]}
            />
          );
        })}
      </Animated.View>
      
      {/* Fibonacci spiral */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 150,
            height: 150,
            top: '30%',
            left: '20%',
            marginTop: -75,
            marginLeft: -75,
          },
          {
            transform: [
              {
                rotate: spiralAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        {/* Golden ratio spiral points */}
        {[...Array(13)].map((_, index) => { // 13 is a Fibonacci number
          const phi = 1.618; // Golden ratio
          const theta = index * 0.5;
          const r = index * 3;
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          
          return (
            <Animated.View
              key={`spiral-${index}`}
              style={[
                {
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#00ff88',
                  top: '50%',
                  left: '50%',
                  marginTop: -4,
                  marginLeft: -4,
                  shadowColor: '#00ff88',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 3,
                  elevation: 3,
                },
                {
                  transform: [
                    { translateX: x },
                    { translateY: y },
                    {
                      scale: goldenRatioAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5],
                      }),
                    },
                  ],
                  opacity: goldenRatioAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.6, 1, 0.6],
                  }),
                },
              ]}
            />
          );
        })}
      </Animated.View>
      
      {/* Mathematical symbols floating */}
      {['∞', '∑', '∫', '∂', '∆', '∇', 'π', 'φ', '√', '∞'].map((symbol, index) => (
        <Animated.View
          key={`symbol-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${15 + (index % 3) * 30}%`,
              left: `${10 + Math.floor(index / 3) * 25}%`,
            },
            {
              transform: [
                {
                  translateY: fractalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20 - Math.random() * 10],
                  }),
                },
                {
                  rotate: fractalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${(Math.random() - 0.5) * 30}deg`],
                  }),
                },
              ],
              opacity: fractalAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 0.8, 0.4],
              }),
            },
          ]}
        >
          <Text style={{
            fontSize: 24,
            color: '#ffd700',
            fontWeight: 'bold',
            textShadowColor: '#ffeb3b',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
          }}>
            {symbol}
          </Text>
        </Animated.View>
      ))}
      
      {/* Geometric patterns */}
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={`pattern-${index}`}
          style={[
            {
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: '#00ccff',
              top: `${20 + index * 12}%`,
              left: `${70 + Math.sin(index) * 20}%`,
            },
            {
              transform: [
                {
                  rotate: fractalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${360 + index * 60}deg`],
                  }),
                },
                {
                  scale: recursiveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
              opacity: recursiveAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.7, 0.3],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

function CalculusFlow() {
  const derivativeAnim = useRef(new Animated.Value(0)).current;
  const integralAnim = useRef(new Animated.Value(0)).current;
  const functionAnim = useRef(new Animated.Value(0)).current;
  const flowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Derivative animation
    Animated.loop(
      Animated.timing(derivativeAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Integral animation
    Animated.loop(
      Animated.timing(integralAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // Function curve animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(functionAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(functionAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Flow animation
    Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a2e', '#2d1b69', '#11998e']}
        style={styles.gradientBg}
      />
      
      {/* Function curve visualization */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: '90%',
            height: 3,
            backgroundColor: '#00ff88',
            top: '60%',
            left: '5%',
            borderRadius: 2,
            shadowColor: '#00ff88',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 5,
            elevation: 5,
          },
          {
            transform: [
              {
                scaleY: functionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 3],
                }),
              },
            ],
            opacity: functionAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 1, 0.8],
            }),
          },
        ]}
      />
      
      {/* Derivative tangent lines */}
      {[...Array(8)].map((_, index) => {
        const xPos = 10 + index * 10;
        return (
          <Animated.View
            key={`tangent-${index}`}
            style={[
              {
                position: 'absolute',
                width: 40,
                height: 2,
                backgroundColor: '#ff6b6b',
                top: '60%',
                left: `${xPos}%`,
                borderRadius: 1,
                shadowColor: '#ff6b6b',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 3,
                elevation: 3,
              },
              {
                transform: [
                  {
                    rotate: derivativeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${Math.sin(index * 0.5) * 45}deg`],
                    }),
                  },
                  {
                    translateY: derivativeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(index * 0.8) * 20],
                    }),
                  },
                ],
                opacity: derivativeAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1, 0.5],
                }),
              },
            ]}
          />
        );
      })}
      
      {/* Integral area visualization */}
      {[...Array(12)].map((_, index) => (
        <Animated.View
          key={`integral-${index}`}
          style={[
            {
              position: 'absolute',
              width: 25,
              height: 30 + Math.sin(index * 0.5) * 20,
              backgroundColor: '#4ecdc4',
              bottom: '35%',
              left: `${15 + index * 6}%`,
              borderRadius: 2,
              opacity: 0.6,
            },
            {
              transform: [
                {
                  scaleY: integralAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.5],
                  }),
                },
              ],
              opacity: integralAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.7, 0.3],
              }),
            },
          ]}
        />
      ))}
      
             {/* Mathematical expressions */}
       {[
         { text: "f'(x)", top: '20%', left: '20%' },
         { text: "∫f(x)dx", top: '25%', left: '60%' },
         { text: "∂f/∂x", top: '40%', left: '10%' },
         { text: "lim", top: '45%', left: '75%' },
         { text: "dx/dt", top: '70%', left: '85%' },
         { text: "∆y/∆x", top: '80%', left: '25%' },
       ].map((expr, index) => (
         <Animated.View
           key={`expr-${index}`}
           style={[
             {
               position: 'absolute',
               top: expr.top,
               left: expr.left,
             },
            {
              transform: [
                {
                  translateY: flowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15 - Math.random() * 10],
                  }),
                },
                {
                  scale: flowAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 1],
                  }),
                },
              ],
              opacity: flowAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.7, 1, 0.7],
              }),
            },
          ]}
        >
          <Text style={{
            fontSize: 18,
            color: '#ffd700',
            fontWeight: 'bold',
            textShadowColor: '#ffeb3b',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}>
            {expr.text}
          </Text>
        </Animated.View>
      ))}
      
      {/* Flow particles */}
      {[...Array(20)].map((_, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={[
            {
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#ffffff',
              top: `${20 + Math.random() * 60}%`,
              left: '-5%',
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 4,
            },
            {
              transform: [
                {
                  translateX: flowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 400],
                  }),
                },
                {
                  translateY: flowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(index * 0.3) * 40],
                  }),
                },
              ],
              opacity: flowAnim.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
      ))}
      
      {/* Coordinate system */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 2,
            height: '60%',
            backgroundColor: '#ffffff',
            top: '20%',
            left: '15%',
            opacity: 0.4,
          },
          {
            opacity: functionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: '70%',
            height: 2,
            backgroundColor: '#ffffff',
            top: '60%',
            left: '15%',
            opacity: 0.4,
          },
          {
            opacity: functionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6],
            }),
          },
        ]}
      />
    </View>
  );
}

function StatisticalDistribution() {
  const distributionAnim = useRef(new Animated.Value(0)).current;
  const dataPointAnim = useRef(new Animated.Value(0)).current;
  const bellCurveAnim = useRef(new Animated.Value(0)).current;
  const probabilityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Distribution animation
    Animated.loop(
      Animated.timing(distributionAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // Data point animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dataPointAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(dataPointAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bell curve animation
    Animated.loop(
      Animated.timing(bellCurveAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Probability animation
    Animated.loop(
      Animated.timing(probabilityAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.visualContainer}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a2e', '#2d1b69', '#8b5cf6']}
        style={styles.gradientBg}
      />
      
      {/* Bell curve visualization */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: '80%',
            height: 100,
            top: '45%',
            left: '10%',
            borderRadius: 50,
            borderWidth: 3,
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            shadowColor: '#00ff88',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
          },
          {
            transform: [
              {
                scaleY: bellCurveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
              {
                scaleX: bellCurveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.9],
                }),
              },
            ],
            opacity: bellCurveAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.7, 1, 0.7],
            }),
          },
        ]}
      />
      
      {/* Data points following normal distribution */}
      {[...Array(25)].map((_, index) => {
        // Generate positions following normal distribution pattern
        const normalValue = Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3; // Approximates normal distribution
        const xPos = 50 + (normalValue * 15); // Center at 50% with spread
        const yPos = 45 + Math.exp(-(normalValue * normalValue) / 2) * 20; // Bell curve height
        
        return (
          <Animated.View
            key={`data-${index}`}
            style={[
              {
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#ffd700',
                top: `${yPos}%`,
                left: `${Math.max(5, Math.min(95, xPos))}%`,
                shadowColor: '#ffd700',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
                elevation: 4,
              },
              {
                transform: [
                  {
                    scale: dataPointAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.4],
                    }),
                  },
                  {
                    translateY: dataPointAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                  },
                ],
                opacity: dataPointAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 1, 0.6],
                }),
              },
            ]}
          />
        );
      })}
      
      {/* Histogram bars */}
      {[...Array(10)].map((_, index) => {
        const height = Math.exp(-((index - 5) * (index - 5)) / 8) * 60; // Bell curve shape
        return (
          <Animated.View
            key={`bar-${index}`}
            style={[
              {
                position: 'absolute',
                width: 25,
                height: height,
                backgroundColor: '#ff6b6b',
                bottom: '25%',
                left: `${15 + index * 7}%`,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: '#ff8e8e',
                shadowColor: '#ff6b6b',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 3,
                elevation: 3,
              },
              {
                transform: [
                  {
                    scaleY: distributionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
                opacity: distributionAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 1, 0.6],
                }),
              },
            ]}
          />
        );
      })}
      
             {/* Statistical symbols and formulas */}
       {[
         { text: "μ", top: '15%', left: '20%' },
         { text: "σ", top: '20%', left: '70%' },
         { text: "P(X)", top: '30%', left: '10%' },
         { text: "∑", top: '35%', left: '85%' },
         { text: "χ²", top: '70%', left: '15%' },
         { text: "n!", top: '75%', left: '75%' },
         { text: "r", top: '85%', left: '45%' },
         { text: "±", top: '10%', left: '50%' },
       ].map((stat, index) => (
         <Animated.View
           key={`stat-${index}`}
           style={[
             {
               position: 'absolute',
               top: stat.top,
               left: stat.left,
             },
            {
              transform: [
                {
                  translateY: probabilityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15 + Math.sin(index * 0.5) * 5],
                  }),
                },
                {
                  rotate: probabilityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${Math.sin(index) * 10}deg`],
                  }),
                },
              ],
              opacity: probabilityAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 1, 0.6],
              }),
            },
          ]}
        >
          <Text style={{
            fontSize: 22,
            color: '#4ecdc4',
            fontWeight: 'bold',
            textShadowColor: '#4ecdc4',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
          }}>
            {stat.text}
          </Text>
        </Animated.View>
      ))}
      
      {/* Probability flow lines */}
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={`flow-${index}`}
          style={[
            {
              position: 'absolute',
              width: 60,
              height: 2,
              backgroundColor: '#ffffff',
              top: `${25 + index * 10}%`,
              left: '20%',
              borderRadius: 1,
              opacity: 0.6,
            },
            {
              transform: [
                {
                  translateX: probabilityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 50],
                  }),
                },
              ],
              opacity: probabilityAnim.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, 0.8, 0.8, 0],
              }),
            },
          ]}
        />
      ))}
      
      {/* Confidence intervals */}
      {[68, 95, 99].map((confidence, index) => (
        <Animated.View
          key={`confidence-${index}`}
          style={[
            {
              position: 'absolute',
              width: `${confidence * 0.8}%`,
              height: 1,
              backgroundColor: '#00ccff',
              top: `${55 + index * 5}%`,
              left: `${(100 - confidence * 0.8) / 2}%`,
              borderRadius: 1,
            },
            {
              opacity: distributionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

// All available high-quality animations
const ALL_ANIMATIONS = [
  QuantumParticles, SpaceCosmos, CircuitBoard, NeuralNetwork, 
  DNAHelix, FireEnergy, MatrixDataStream, OceanWaves, 
  GeometricMorphing, CrystalFormation, AuroraInspiration,
  StockMarket, CurrencyFlow, EconomicGrowth, BookLearning, DigitalClassroom,
  FractalGeometry, CalculusFlow, StatisticalDistribution
];

// Map industries to preferred animation variations, with comprehensive fallbacks
const INDUSTRY_ANIMATIONS: Record<string, (() => React.ReactNode | null)[]> = {
  // Computer Science & Technology
  CS: [NeuralNetwork, CircuitBoard, MatrixDataStream],
  'Computer Science': [NeuralNetwork, CircuitBoard, MatrixDataStream],
  Technology: [CircuitBoard, MatrixDataStream, NeuralNetwork],
  'Tech': [CircuitBoard, MatrixDataStream, NeuralNetwork],
  AI: [NeuralNetwork, MatrixDataStream, CircuitBoard],
  'Artificial Intelligence': [NeuralNetwork, MatrixDataStream, CircuitBoard],
  
  // Finance & Business
  'Finance & Economics': [StockMarket, CurrencyFlow, EconomicGrowth],
  Finance: [StockMarket, CurrencyFlow, EconomicGrowth],
  Economics: [EconomicGrowth, StockMarket, CurrencyFlow],
  Business: [EconomicGrowth, StockMarket, CurrencyFlow],
  
  // Sciences
  Maths: [FractalGeometry, CalculusFlow, StatisticalDistribution],
  Mathematics: [FractalGeometry, CalculusFlow, StatisticalDistribution],
  Physics: [FireEnergy, SpaceCosmos, QuantumParticles],
  Chemistry: [DNAHelix, CrystalFormation, AuroraInspiration],
  Biology: [DNAHelix, OceanWaves, AuroraInspiration],
  'Life Sciences': [DNAHelix, OceanWaves, AuroraInspiration],
  
  // Health & Medicine
  Medicine: [DNAHelix, AuroraInspiration, CrystalFormation],
  Health: [DNAHelix, AuroraInspiration, OceanWaves],
  Healthcare: [AuroraInspiration, DNAHelix, OceanWaves],
  
  // Education & Learning
  EdTech: [DNAHelix, BookLearning, DigitalClassroom],
  Education: [BookLearning, DigitalClassroom, DNAHelix],
  Learning: [DigitalClassroom, BookLearning, DNAHelix],
  
  // Engineering & Physical Sciences
  Engineering: [CircuitBoard, FractalGeometry, QuantumParticles],
  'Mechanical Engineering': [FractalGeometry, CircuitBoard, FireEnergy],
  'Electrical Engineering': [CircuitBoard, QuantumParticles, MatrixDataStream],
  
  // Arts & Design
  Art: [FractalGeometry, CrystalFormation, SpaceCosmos],
  Design: [FractalGeometry, CrystalFormation, FireEnergy],
  
  // Environmental & Natural Sciences
  Environment: [OceanWaves, DNAHelix, SpaceCosmos],
  'Environmental Science': [OceanWaves, DNAHelix, SpaceCosmos],
  Geology: [CrystalFormation, OceanWaves, FractalGeometry],
  
  // Energy & Space
  Energy: [FireEnergy, QuantumParticles, CircuitBoard],
  Space: [SpaceCosmos, QuantumParticles, FireEnergy],
  Astronomy: [SpaceCosmos, QuantumParticles, CrystalFormation],
  
  // Default fallback with all animations available
  Default: ALL_ANIMATIONS,
};

export const StaticVisual = ({ industry = 'Default', postId }: { industry?: string, postId?: string | number }) => {
  
  // Get variations for the industry, with smart fallbacks
  let variations = INDUSTRY_ANIMATIONS[industry];
  
  // If industry not found, try partial matches or use all animations
  if (!variations) {
    // Try to find partial matches (e.g., "Computer Science" might match "CS")
    const industryKey = Object.keys(INDUSTRY_ANIMATIONS).find(key => 
      key.toLowerCase().includes(industry.toLowerCase()) || 
      industry.toLowerCase().includes(key.toLowerCase())
    );
    
    variations = industryKey ? INDUSTRY_ANIMATIONS[industryKey] : ALL_ANIMATIONS;
  }
  
  const variationIndex = useMemo(() => {
    if (typeof postId === 'number' || typeof postId === 'string') {
      // Simple deterministic hash
      let hash = 0;
      const str = String(postId);
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % variations.length;
      return index;
    }
    // fallback to random if no postId
    const index = Math.floor(Math.random() * variations.length);
    return index;
  }, [postId, variations.length]);
  
  const VariationComponent = variations[variationIndex];
  
  try {
    const result = <VariationComponent />;
    return result;
  } catch (error) {
    // Ultimate fallback - render QuantumParticles if anything goes wrong
    return <QuantumParticles />;
  }
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


