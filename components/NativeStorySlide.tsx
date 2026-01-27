import React from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NativeStorySlideProps {
    imageUrl?: string;
    colour?: string; // Hex code
    title: string;
    chapterTitle?: string; // New prop for the specific slide title
    text: string;
}

const { width, height } = Dimensions.get('window');

export const NativeStorySlide: React.FC<NativeStorySlideProps> = ({
    imageUrl,
    colour,
    title,
    chapterTitle,
    text
}) => {
    const insets = useSafeAreaInsets();

    // Safety check for color
    const safeColour = (colour && typeof colour === 'string' && colour.startsWith('#')) ? colour : '#00FF00';

    // Convert hex to rgba for overlay
    const getOverlayColor = (hex: string, opacity: number) => {
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${opacity})`;
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        } catch (e) {
            return `rgba(0,255,0,${opacity})`;
        }
    };

    // Removed background overlay color as requested
    // Kept subtle black overlay for readability
    const borderColor = getOverlayColor(safeColour, 0.5);

    // Calculate max height for the card
    const maxCardHeight = height - insets.top - 80 - insets.bottom - 40;

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Background Image */}
            {imageUrl ? (
                <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.background}
                    resizeMode="cover"
                    blurRadius={30} // Increased blur for better text visibility
                >
                    {/* Darker black overlay for contrast */}
                    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
                </ImageBackground>
            ) : (
                <View style={[styles.background, { backgroundColor: '#000' }]}>
                </View>
            )}

            {/* Content Container - No box look */}
            <View style={styles.cardContainer}>

                {/* Title Reminder Header */}
                <View style={styles.header}>
                    <View style={[styles.accentLine, { backgroundColor: safeColour }]} />
                    <Text style={[styles.title, { color: safeColour }]}>{title.toUpperCase()}</Text>
                </View>

                <ScrollView
                    style={{ width: '100%' }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
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
        width: width,
        height: height,
        position: 'absolute',
        top: 0,
        left: 0,
        justifyContent: 'center', // Center content vertically
        alignItems: 'center',
        overflow: 'hidden',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        width: width,
        height: height,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start', // Left align text
        width: '100%',
        paddingHorizontal: 30, // More side padding since box is gone
        paddingTop: 60,
    },
    header: {
        width: '100%',
        marginBottom: 20,
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
        fontSize: 15, // Smaller font
        color: '#F0F0F0', // Slightly brighter white
        lineHeight: 24,
        textAlign: 'left',
    },
    chapterTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20, // Smaller font
        color: 'white',
        lineHeight: 28,
        textAlign: 'left',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
