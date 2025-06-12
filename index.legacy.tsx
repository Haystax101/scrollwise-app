import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const Root = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

AppRegistry.registerComponent('main', () => Root);

// For web support
import { registerRootComponent } from 'expo';
registerRootComponent(Root);
