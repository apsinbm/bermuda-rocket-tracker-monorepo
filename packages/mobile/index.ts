import { registerRootComponent } from 'expo';
import { initializePlatform } from './src/platform-init';

// Initialize platform adapters BEFORE importing App
// This ensures storage and other platform services are ready
initializePlatform();

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
