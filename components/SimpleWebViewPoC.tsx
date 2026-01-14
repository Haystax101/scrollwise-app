import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface SimpleWebViewPoCProps {
    height: number;
    htmlContent?: string;
    preload?: boolean;
}

export const SimpleWebViewPoC: React.FC<SimpleWebViewPoCProps> = ({ height, htmlContent, preload = false }) => {
    const [shouldMount, setShouldMount] = useState(preload);

    useEffect(() => {
        if (preload) return;

        // Wait 500ms before mounting the heavy WebView
        // If the user scrolls past quickly, component unmounts and this timer clears
        const timer = setTimeout(() => {
            setShouldMount(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [preload]);

    if (!shouldMount) {
        return (
            <View style={[styles.container, { height, justifyContent: 'center', alignItems: 'center' }]}>
                {/* Removed loading indicator to avoid flickering during delayed mount */}
            </View>
        )
    }

    // Fallback if no content provided
    const source = htmlContent
        ? { html: htmlContent }
        : { html: '<body style="background:blue;margin:0;display:flex;justify-content:center;align-items:center;"><h1 style="color:white;font-size:50px;text-align:center;">NO CONTENT</h1></body>' };

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                key="stable-poc-content"
                source={source}
                style={[styles.webview, { opacity: 0.99, backgroundColor: 'transparent' }]}
                useSharedProcessPool={false}
                originWhitelist={['*']}
                onError={(e) => console.error('WebView Error:', e.nativeEvent)}
                onHttpError={(e) => console.error('WebView HTTP Error:', e.nativeEvent)}
                onRenderProcessGone={(e) => console.error('WebView Process Gone:', e.nativeEvent)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'transparent',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
