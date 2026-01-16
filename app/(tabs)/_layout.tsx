import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    HomeIcon as HomeIconOutline,
    ChatBubbleOvalLeftEllipsisIcon as ChatIconOutline,
    PlusIcon as PlusIconOutline,
    ChartBarIcon as ChartBarIconOutline, // Used for Leaderboard
    UserIcon as UserIconOutline
} from 'react-native-heroicons/outline';
import {
    HomeIcon as HomeIconSolid,
    ChatBubbleOvalLeftEllipsisIcon as ChatIconSolid,
    PlusIcon as PlusIconSolid,
    ChartBarIcon as ChartBarIconSolid,
    UserIcon as UserIconSolid
} from 'react-native-heroicons/solid';

const { width } = Dimensions.get('window');

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingTop: Platform.OS === 'ios' ? 10 : 0, // Push icons down to center them
                    elevation: 0,
                    borderTopWidth: 0,
                    backgroundColor: 'transparent', // Important for BlurView
                },
                tabBarShowLabel: false, // Clean look
                tabBarActiveTintColor: '#FFD700', // Gold for active
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
                tabBarBackground: () => (
                    <BlurView
                        intensity={80}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ color, focused }) => (
                        focused ? <HomeIconSolid color={color} size={28} /> : <HomeIconOutline color={color} size={28} />
                    ),
                }}
            />

            <Tabs.Screen
                name="inbox"
                options={{
                    title: 'Inbox',
                    tabBarIcon: ({ color, focused }) => (
                        focused ? <ChatIconSolid color={color} size={28} /> : <ChatIconOutline color={color} size={28} />
                    ),
                }}
            />

            <Tabs.Screen
                name="create"
                options={{
                    title: 'Create',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.createButtonContainer}>
                            <View style={[styles.createButton, { backgroundColor: focused ? '#FFD700' : 'rgba(255, 255, 255, 0.2)' }]}>
                                {focused
                                    ? <PlusIconSolid color="black" size={30} />
                                    : <PlusIconOutline color="white" size={30} />
                                }
                            </View>
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="leaderboard"
                options={{
                    title: 'Leaderboard',
                    tabBarIcon: ({ color, focused }) => (
                        focused ? <ChartBarIconSolid color={color} size={28} /> : <ChartBarIconOutline color={color} size={28} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        focused ? <UserIconSolid color={color} size={28} /> : <UserIconOutline color={color} size={28} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    createButtonContainer: {
        top: -10, // Float slightly above
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    }
});
