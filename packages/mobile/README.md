# Bermuda Rocket Tracker - Mobile App

A beautiful, modern React Native mobile app for tracking SpaceX rocket launches visible from Bermuda.

## 🎨 Features

### Design
- **Sleek Dark Theme** - Modern slate colors with blue accents
- **Live Countdowns** - Real-time countdown timers for every launch
- **Color-Coded Visibility** - Instant visual feedback (Green/Amber/Red)
- **Smooth Navigation** - Bottom tabs + stack navigation
- **Pull-to-Refresh** - Easy data updates with swipe gesture

### Functionality
- 🚀 **Launch List** - Upcoming SpaceX launches with visibility from Bermuda
- 🔔 **Smart Notifications** - Time-based reminders (30m, 1h, 2h before)
- 🧭 **Viewing Directions** - Compass bearing and direction for each launch
- ☁️ **Weather Integration** - Weather conditions for launch times
- ⚙️ **Settings** - Theme, cache management, app info

## 🏗️ Architecture

### Stack
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State**: React Hooks + Shared Services
- **Business Logic**: @bermuda/shared package (shared with web app)
- **Storage**: AsyncStorage via platform adapter
- **Notifications**: Expo Notifications via platform adapter

### Project Structure
```
src/
├── navigation/
│   ├── AppNavigator.tsx     # Main navigation setup
│   └── types.ts             # Navigation type definitions
├── screens/
│   ├── LaunchListScreen.tsx     # Home screen with launch list
│   ├── LaunchDetailScreen.tsx   # Detailed launch view
│   ├── NotificationsScreen.tsx  # Notification settings
│   └── SettingsScreen.tsx       # App settings
├── components/
│   ├── LaunchCard.tsx           # Launch list item
│   ├── CountdownTimer.tsx       # Live countdown display
│   ├── VisibilityBadge.tsx      # Color-coded visibility
│   ├── DirectionCompass.tsx     # Viewing direction
│   └── WeatherWidget.tsx        # Weather display
├── hooks/
│   ├── useLaunchData.ts         # Launch data fetching
│   └── useCountdown.ts          # Countdown timer logic
├── theme/
│   ├── colors.ts                # Color palette
│   ├── typography.ts            # Text styles
│   └── index.ts                 # Theme exports
├── adapters/
│   ├── MobileStorageAdapter.ts       # AsyncStorage wrapper
│   └── MobileNotificationAdapter.ts  # Expo Notifications wrapper
└── platform-init.ts             # Platform initialization
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Xcode (for iOS development) - Optional
- Android Studio (for Android development) - Optional
- **Or just use Expo Go on your phone!** (Easiest)

### Installation
```bash
# Navigate to mobile package
cd packages/mobile

# Install dependencies (already done if you ran npm install at root)
npm install

# Start development server
npm start
```

### Testing Options

#### Option 1: Physical Device with Expo Go (Easiest)
1. Install "Expo Go" app from App Store or Google Play
2. Make sure your phone and computer are on the same WiFi
3. Scan the QR code that appears in terminal
4. App opens instantly in Expo Go!

**Manual Connection (if QR doesn't work):**
- Open Expo Go app
- Tap "Enter URL manually"
- Type: `exp://[YOUR_IP]:8082` (IP shown in terminal)

#### Option 2: iOS Simulator
```bash
npm start
# Press 'i' when ready
```

Requirements:
- macOS with Xcode installed
- iOS Simulator runtime (downloads automatically if needed)

#### Option 3: Android Emulator
```bash
npm start
# Press 'a' when ready
```

Requirements:
- Android Studio installed
- Android emulator configured

## 📱 App Structure

### Bottom Tab Navigation
1. **🚀 Launches Tab (Home)**
   - Scrollable list of upcoming launches
   - Live countdown for each launch
   - Visibility indicators
   - Pull-to-refresh
   - Tap card → Launch detail screen

2. **🔔 Notifications Tab**
   - Permission status
   - Notification toggle switches
   - Time-based reminders (30m, 1h, 2h)
   - Delay alert settings
   - Test notification button

3. **⚙️ Settings Tab**
   - Theme preferences
   - Cache management
   - Clear cache button
   - App version info

### Launch Detail Screen
- Hero header with mission info
- Large live countdown
- Visibility likelihood panel
- Viewing direction compass
- Weather conditions
- Mission details (rocket, pad, location)
- Quick notification toggle

## 🎨 Design System

### Colors
```typescript
Background: #0f172a (slate-900)
Card: #1e293b (slate-800)
Primary: #3b82f6 (blue-500)
Success: #10b981 (emerald-500)
Warning: #f59e0b (amber-500)
Error: #ef4444 (red-500)
```

### Typography
- **Headers**: 24-28px, Bold
- **Titles**: 18-20px, SemiBold
- **Body**: 14-16px, Regular
- **Countdown**: 48px, Bold
- **Captions**: 11-12px, Regular/SemiBold

### Components
- **Touch Targets**: Minimum 44px height
- **Border Radius**: 12px for cards
- **Spacing**: 16px padding, 12px gaps
- **Shadows**: Subtle elevation on cards

## 🔧 Development

### Available Scripts
```bash
npm start          # Start Expo dev server
npm run ios        # Open iOS simulator
npm run android    # Open Android emulator
npm run web        # Open web version
```

### Hot Reload
- Press `r` in terminal to reload app
- Shake device to open developer menu
- Enable Fast Refresh in settings

### Debugging
- Press `j` in terminal to open debugger
- Press `m` to toggle menu
- Use React Native Debugger or Flipper

## 🔌 Shared Services

The app uses `@bermuda/shared` package for all business logic:

```typescript
import {
  launchDataService,     // Fetch launch data
  notificationService,   // Manage notifications
  visibilityService,     // Calculate visibility
  weatherService,        // Get weather data
  cacheInitializer,      // Cache management
  // ... and 25+ more services
} from '@bermuda/shared';
```

All services work identically on web and mobile thanks to platform adapters!

## 🐛 Troubleshooting

### QR Code Not Working
1. Try manual URL: `exp://[YOUR_IP]:8082`
2. Ensure phone and Mac on same WiFi
3. Check firewall settings
4. Restart Expo with: `npm start --clear`

### iOS Simulator Won't Open
```bash
# Open simulator manually
open -a Simulator

# Then press 'i' again in terminal
```

### Metro Bundler Issues
```bash
# Clear cache and restart
npm start --clear

# Or reset completely
rm -rf node_modules
npm install
npm start
```

### "Network response timed out"
- Check your internet connection
- Ensure Mac and phone on same network
- Try restarting both Expo server and device

## 📦 Building for Production

### Development Builds
```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

### Production Builds
```bash
# iOS App Store
eas build --profile production --platform ios

# Android Play Store
eas build --profile production --platform android
```

## 🤝 Contributing

The mobile app shares business logic with the web app via the `@bermuda/shared` package. When adding features:

1. Put business logic in `@bermuda/shared`
2. Create mobile UI in `packages/mobile`
3. Update both platforms to use new features

## 📄 License

Same as main project

## 🎯 Current Status

✅ **Complete & Ready for Testing**
- All UI screens implemented
- Navigation working
- Live countdowns functional
- Shared services integrated
- Dark theme applied
- Ready for iOS/Android testing

**Next Steps:**
- Test on physical devices
- Gather user feedback
- Add animations and polish
- Prepare for production deployment
