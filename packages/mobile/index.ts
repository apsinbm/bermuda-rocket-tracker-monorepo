import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';
import { initializePlatform } from './src/platform-init';

// Enable native screens for React Navigation
// This prevents the library from using browser DOM APIs
enableScreens();

// Initialize platform adapters BEFORE importing App
// This ensures storage and other platform services are ready
initializePlatform();

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
