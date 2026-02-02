import React from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NativeStorySlideProps {
    imageUrl?: string;
    colour?: string; // Hex code
    title: string;
    chapterTitle?: string;
    text: string;
    width: number;
    height: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const NativeStorySlide: React.FC<NativeStorySlideProps> = ({
    imageUrl,
    colour,
    title,
    chapterTitle,
    text,
    width,
    height
}) => {
    // const insets = useSafeAreaInsets(); // Removed insets as we are inside a card now

    // Safety check for color
    const safeColour = (colour && typeof colour === 'string' && colour.startsWith('#')) ? colour : '#00FF00';

    return (
        <View style={[styles.container, { width, height }]}>
            {/* Background Image */}
            {imageUrl ? (
                <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.background}
                    resizeMode="cover"
                    blurRadius={20} // Slightly reduced blur for smaller area
                >
                    {/* Darker black overlay for contrast */}
                    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
                </ImageBackground>
            ) : (
                <View style={[styles.background, { backgroundColor: '#000' }]} />
            )}

            {/* Content Container */}
            <View style={styles.cardContainer}>
                {/* Title Reminder Header */}
                <View style={styles.header}>
                    <View style={[styles.accentLine, { backgroundColor: safeColour }]} />
                    <Text style={[styles.title, { color: safeColour }]}>{title.toUpperCase()}</Text>
                </View>

                <ScrollView
                    style={{ width: '100%' }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {chapterTitle && (
                        <Text style={[styles.chapterTitle, { marginBottom: 12 }]}>
                            {chapterTitle}
                        </Text>
                    )}
                    <Text style={styles.text}>{text}</Text>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        // BorderRadius handled by parent (SpecialArticleCard)
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        paddingHorizontal: 24, // Reduced padding
        paddingTop: 40,
        paddingBottom: 20,
    },
    header: {
        width: '100%',
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    accentLine: {
        width: 3,
        height: 16,
        marginRight: 10,
        borderRadius: 1.5,
    },
    title: {
        fontFamily: 'Oswald_500Medium',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 2,
        opacity: 0.9,
    },
    text: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16, // Readable font size
        color: '#F0F0F0',
        lineHeight: 26,
        textAlign: 'left',
    },
    chapterTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 22,
        color: 'white',
        lineHeight: 30,
        textAlign: 'left',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
