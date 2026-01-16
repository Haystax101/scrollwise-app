import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

export interface SearchResultItemProps {
    id: string;
    type: 'article' | 'paper' | 'book';
    title: string;
    subtitle: string;
    imageUrl?: string; // Kept in interface but ignoring in UI as requested
    colour?: string;
    date?: string;
    special?: boolean;
    onPress: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
    type, title, subtitle, date, onPress
}) => {

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
            <BlurView intensity={40} tint="dark" style={styles.glass}>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {type.toUpperCase()} • {subtitle}
                        </Text>
                        {date && (
                            <Text style={styles.date}>{date}</Text>
                        )}
                    </View>
                </View>

            </BlurView>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    glass: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'Montserrat_600SemiBold',
        marginBottom: 4,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontFamily: 'Montserrat_500Medium',
        flex: 1,
    },
    date: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontFamily: 'Montserrat_400Regular',
        marginLeft: 8,
    }
});
