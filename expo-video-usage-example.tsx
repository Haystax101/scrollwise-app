// Usage example for expo-video (from official docs and type definitions)
import React from 'react';
import { View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

export default function Example() {
  const player = useVideoPlayer({ uri: 'https://www.example.com/video.mp4' }, (player) => {
    player.loop = true;
    player.volume = 1.0;
  });
  return (
    <View style={{ height: 300 }}>
      <VideoView
        player={player}
        style={{ flex: 1 }}
        nativeControls
        contentFit="cover"
      />
    </View>
  );
}
