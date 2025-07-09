import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
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

function HealthcareFallback() {
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
        colors={['#0a0a1a', '#1a1a3a', '#2a2a5a', '#3a3a6a']}
        style={styles.gradientBg}
      />
      
      {/* Aurora background layers */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: '20%',
            left: '-20%',
            right: '-20%',
            height: '60%',
            borderRadius: 100,
          },
          {
            transform: [
              {
                translateY: auroraAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              },
              {
                scaleX: auroraAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
            opacity: auroraAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.6, 0.3],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(64, 224, 208, 0.2)', 'rgba(138, 43, 226, 0.2)', 'rgba(75, 0, 130, 0.1)']}
          style={{ flex: 1, borderRadius: 100 }}
        />
      </Animated.View>

      {/* Twinkling stars */}
      {[...Array(15)].map((_, index) => (
        <Animated.View
          key={`star-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${10 + (index * 7) % 80}%`,
              left: `${5 + (index * 11) % 90}%`,
              width: 2 + (index % 3),
              height: 2 + (index % 3),
              borderRadius: 50,
              backgroundColor: '#ffffff',
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
            },
            {
              opacity: starTwinkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  0.3 + Math.sin(index * 0.5) * 0.3,
                  1 - Math.sin(index * 0.5) * 0.3,
                ],
              }),
              transform: [
                {
                  scale: starTwinkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      0.8 + Math.cos(index * 0.3) * 0.2,
                      1.2 - Math.cos(index * 0.3) * 0.2,
                    ],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Floating cosmic dust particles */}
      {[...Array(8)].map((_, index) => (
        <Animated.View
          key={`dust-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${20 + (index * 9) % 60}%`,
              left: `${10 + (index * 13) % 80}%`,
              width: 1 + (index % 2),
              height: 1 + (index % 2),
              borderRadius: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
            },
            {
              transform: [
                {
                  translateX: floatingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(index * 0.8) * 30],
                  }),
                },
                {
                  translateY: floatingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(index * 0.6) * 20],
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

      {/* Large bright stars */}
      {[...Array(4)].map((_, index) => (
        <Animated.View
          key={`bright-star-${index}`}
          style={[
            {
              position: 'absolute',
              top: `${25 + index * 20}%`,
              left: `${20 + index * 18}%`,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#ffffff',
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 8,
            },
            {
              opacity: starTwinkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
              transform: [
                {
                  rotate: starTwinkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
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

// All available high-quality animations
const ALL_ANIMATIONS = [
  QuantumParticles, SpaceCosmos, CircuitBoard, NeuralNetwork, 
  DNAHelix, FireEnergy, MatrixDataStream, OceanWaves, 
  GeometricMorphing, CrystalFormation, HealthcareFallback
];

// Map industries to preferred animation variations, with comprehensive fallbacks
const INDUSTRY_ANIMATIONS: Record<string, (() => React.ReactNode | null)[]> = {
  // Computer Science & Technology
  CS: [NeuralNetwork, QuantumParticles, CircuitBoard],
  'Computer Science': [NeuralNetwork, QuantumParticles, CircuitBoard],
  Technology: [CircuitBoard, QuantumParticles, MatrixDataStream],
  'Tech': [CircuitBoard, QuantumParticles, MatrixDataStream],
  AI: [NeuralNetwork, QuantumParticles, MatrixDataStream],
  'Artificial Intelligence': [NeuralNetwork, QuantumParticles, MatrixDataStream],
  
  // Finance & Business
  'Finance & Economics': [CircuitBoard, MatrixDataStream, QuantumParticles],
  Finance: [CircuitBoard, MatrixDataStream, QuantumParticles],
  Economics: [CircuitBoard, MatrixDataStream, QuantumParticles],
  Business: [MatrixDataStream, CircuitBoard, SpaceCosmos],
  
  // Sciences
  Maths: [DNAHelix, OceanWaves, QuantumParticles],
  Mathematics: [DNAHelix, OceanWaves, QuantumParticles],
  Physics: [QuantumParticles, SpaceCosmos, GeometricMorphing],
  Chemistry: [DNAHelix, CrystalFormation, QuantumParticles],
  Biology: [DNAHelix, OceanWaves, HealthcareFallback],
  'Life Sciences': [DNAHelix, OceanWaves, HealthcareFallback],
  
  // Health & Medicine
  Medicine: [DNAHelix, HealthcareFallback, CrystalFormation],
  Health: [DNAHelix, HealthcareFallback, OceanWaves],
  Healthcare: [HealthcareFallback, DNAHelix, OceanWaves],
  
  // Education & Learning
  EdTech: [SpaceCosmos, FireEnergy, NeuralNetwork],
  Education: [SpaceCosmos, FireEnergy, NeuralNetwork],
  Learning: [NeuralNetwork, SpaceCosmos, FireEnergy],
  
  // Engineering & Physical Sciences
  Engineering: [CircuitBoard, GeometricMorphing, QuantumParticles],
  'Mechanical Engineering': [GeometricMorphing, CircuitBoard, FireEnergy],
  'Electrical Engineering': [CircuitBoard, QuantumParticles, MatrixDataStream],
  
  // Arts & Design
  Art: [GeometricMorphing, CrystalFormation, SpaceCosmos],
  Design: [GeometricMorphing, CrystalFormation, FireEnergy],
  
  // Environmental & Natural Sciences
  Environment: [OceanWaves, DNAHelix, SpaceCosmos],
  'Environmental Science': [OceanWaves, DNAHelix, SpaceCosmos],
  Geology: [CrystalFormation, OceanWaves, GeometricMorphing],
  
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

INDUSTRY_ANIMATIONS.Maths.push(HealthcareFallback);
