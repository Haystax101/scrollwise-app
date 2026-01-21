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

    // Calculate max height for the card to ensure it doesn't overlap bottom nav
    // Screen height - Top Inset - Top Padding (80) - Header (approx 40) - Bottom Inset - Bottom Nav (approx 60) - Buffer (20)
    const maxCardHeight = height - insets.top - 80 - 40 - insets.bottom - 80 - 20;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Background Image */}
            {imageUrl ? (
                <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.background}
                    resizeMode="cover"
                    blurRadius={15} // Added blur
                >
                    {/* Darker black overlay for contrast */}
                    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
                </ImageBackground>
            ) : (
                <View style={[styles.background, { backgroundColor: '#111' }]}>
                </View>
            )}

            {/* Glass Card Container - Centered */}
            <View style={styles.cardContainer}>

                {/* Title Section - Moved here to sit above card */}
                <View style={styles.header}>
                    <View style={[styles.accentLine, { backgroundColor: safeColour }]} />
                    <Text style={[styles.title, { color: safeColour }]}>{title.toUpperCase()}</Text>
                </View>

                <BlurView
                    intensity={30}
                    tint="dark"
                    style={[
                        styles.glassCard,
                        {
                            borderColor: borderColor,
                            maxHeight: maxCardHeight // Limit height
                        }
                    ]}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ paddingBottom: 10 }}
                        indicatorStyle="white"
                        nestedScrollEnabled={true}
                    >
                        {chapterTitle && (
                            <Text style={[styles.chapterTitle, { marginBottom: 16 }]}>
                                {chapterTitle}
                            </Text>
                        )}
                        <Text style={styles.text}>{text}</Text>
                    </ScrollView>
                </BlurView>
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
        justifyContent: 'flex-start',
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
    header: {
        width: '100%', // Match card width
        maxWidth: 400,
        marginBottom: 15, // Space between title and card
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: 0, // Align with card edge if card has no outer margin, but cardContainer has padding.
    },
    accentLine: {
        width: 3,
        height: 18,
        marginRight: 10,
        borderRadius: 1.5,
    },
    title: {
        fontFamily: 'Oswald_500Medium',
        fontSize: 12, // Reduced from 14
        // color set dynamically
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 80, // Moved up from 40%
    },
    glassCard: {
        width: '100%',
        maxWidth: 400, // Max width for tablet look
        padding: 24, // Reduced padding from 32
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1.5,
        backgroundColor: 'rgba(20,20,20,0.4)', // Slightly darker glass
    },
    text: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16, // Reduced from 19
        color: '#E0E0E0',
        lineHeight: 24, // Reduced from 28
        textAlign: 'left',
    },
    chapterTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 22, // Reduced from 26
        color: 'white',
        lineHeight: 26, // Reduced from 30
        textAlign: 'left',
    },
});
