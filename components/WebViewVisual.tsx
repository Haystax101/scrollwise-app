import React, { useRef, useState } from 'react';
import { Buffer } from 'buffer';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

interface WebViewVisualProps {
  animationCode: string;
  height: number;
  onError?: () => void;
}

export const WebViewVisual: React.FC<WebViewVisualProps> = ({
  animationCode,
  height,
  onError
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const webViewRef = useRef<WebView>(null);

  console.log('🎬 WebViewVisual: Received height prop:', height);

  // Check if animationCode is already a complete HTML document
  const isCompleteHTML = animationCode.trim().toLowerCase().startsWith('<!doctype html') ||
    animationCode.trim().toLowerCase().startsWith('<html');

  // Desktop viewport standard
  const viewportTag = '<meta name="viewport" content="width=1024, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">';

  // If it's a complete HTML document, inject our viewport or replace existing one
  let htmlContent = animationCode;

  // Inject error handling script at the very top
  const debugScript = `
    <script>
      window.onerror = function(message, source, lineno, colno, error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: message,
          source: source,
          lineno: lineno,
          error: error ? error.toString() : null
        }));
      };
      
      const originalConsoleError = console.error;
      console.error = function(...args) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'console_error',
          args: args
        }));
        originalConsoleError.apply(console, args);
      };
    </script>
  `;

  if (isCompleteHTML) {
    if (htmlContent.match(/<meta[^>]*name=["']viewport["'][^>]*>/i)) {
      htmlContent = htmlContent.replace(/<meta[^>]*name=["']viewport["'][^>]*>/i, viewportTag);
    } else if (htmlContent.match(/<head>/i)) {
      htmlContent = htmlContent.replace(/<head>/i, `<head>\n${viewportTag}`);
    }
    // Inject debug script after head or at start of body
    if (htmlContent.match(/<head>/i)) {
      htmlContent = htmlContent.replace(/<head>/i, `<head>\n${debugScript}`);
    } else {
      htmlContent = debugScript + htmlContent;
    }
  } else {
    // Wrap partial content
    htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        ${debugScript}
        ${viewportTag}
        <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:;">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            background: transparent;
          }
        </style>
      </head>
      <body>
        ${animationCode}
      </body>
    </html>
  `;
  }

  // LOGGING: Print the final HTML to see what we are sending
  console.log('📄 WebViewVisual: Final HTML content (Head):', htmlContent.substring(0, 500));
  console.log('📄 WebViewVisual: Final HTML content (Tail):', htmlContent.slice(-200));

  // Base64 Encode (DISABLED FOR POC)
  // const b64 = Buffer.from(htmlContent).toString('base64');
  // const sourceUri = `data:text/html;charset=utf-8;base64,${b64}`;

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebViewVisual error:', {
      description: nativeEvent.description,
      code: nativeEvent.code,
      domain: nativeEvent.domain,
      url: nativeEvent.url,
      loading: nativeEvent.loading,
      title: nativeEvent.title
    });
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  if (hasError) {
    // Return null to let ArticleCard fall back to StaticVisual
    return null;
  }

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        console.log('📐 WebViewVisual container dimensions:', { width, height });
      }}
    >
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <WebView
        key="poc-red-box"
        ref={webViewRef}
        source={{ html: '<div style="background:red;height:100vh;width:100vw;display:flex;align-items:center;justify-content:center;color:white;font-size:40px;font-weight:bold;">PoC: RED BOX</div>' }}
        style={[styles.webview, { height: height }]}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        onLoadEnd={() => {
          console.log('✅ WebViewVisual loaded successfully');
          setIsLoading(false);

          // Inject JavaScript to report canvas/body dimensions AND DOM CONTENT
          webViewRef.current?.injectJavaScript(`
            setTimeout(function() {
              const canvas = document.querySelector('canvas');
              const body = document.body;
              
              // Check GSAP
              const gsapActive = typeof window.gsap !== 'undefined';

              const message = {
                type: 'dimensions',
                readyState: document.readyState,
                body: {
                  width: body ? body.offsetWidth : 0,
                  height: body ? body.offsetHeight : 0,
                  innerHTMLSnippet: body ? body.innerHTML.substring(0, 500) : 'BODY NULL',
                  fullOuterHTML: document.documentElement ? document.documentElement.outerHTML.substring(0, 1000) : 'DOC NULL'
                },
                canvas: canvas ? {
                  width: canvas.width,
                  height: canvas.height,
                  offsetWidth: canvas.offsetWidth,
                  offsetHeight: canvas.offsetHeight
                } : 'NOT FOUND',
                gsap: gsapActive,
                window: {
                  innerWidth: window.innerWidth,
                  innerHeight: window.innerHeight,
                  devicePixelRatio: window.devicePixelRatio
                }
              };
              window.ReactNativeWebView.postMessage(JSON.stringify(message));
            }, 1000);
            true;
          `);
        }}
        onError={handleError}
        onHttpError={handleError}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        androidLayerType="hardware"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'dimensions') {
              console.log('📐 WebView content report:', data);
            } else if (data.type === 'error' || data.type === 'console_error') {
              console.error('❌ WebView JS Error:', data);
            } else {
              console.log('📨 WebView message:', event.nativeEvent.data);
            }
          } catch (e) {
            console.log('📨 WebView message (raw):', event.nativeEvent.data);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 2, // TEMPORARY: Debug border
    borderColor: 'red', // TEMPORARY: Debug border
  },
  webview: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2, // TEMPORARY: Debug border
    borderColor: 'yellow', // TEMPORARY: Debug border
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
