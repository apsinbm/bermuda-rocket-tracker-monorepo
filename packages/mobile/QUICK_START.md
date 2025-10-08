# Quick Start Guide - When You Return

## Current Status
✅ Mobile app development COMPLETE  
🔄 Expo server was running on port 8082  
⏸️ iOS simulator download was in progress (Xcode)

## To Resume Testing

### Fastest: Test on Your iPhone (Recommended)

1. **On your iPhone:**
   ```
   App Store → Search "Expo Go" → Install
   ```

2. **On your Mac:**
   ```bash
   cd /Users/pato/bermuda-rocket-tracker-monorepo/packages/mobile
   npm start
   ```

3. **Connect your iPhone:**
   - Open Expo Go app
   - Tap "Enter URL manually"
   - Type: `exp://172.20.10.2:8082`
   - OR scan QR code if it works

**That's it!** Your app will load on your iPhone.

---

### Alternative: iOS Simulator (If Xcode Finished)

1. **Start the app:**
   ```bash
   cd /Users/pato/bermuda-rocket-tracker-monorepo/packages/mobile
   npm start
   ```

2. **Press `i` in terminal**
   - iOS Simulator will open
   - App will launch automatically

3. **If Xcode still needs setup:**
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   ```

---

## What You'll See

### Home Screen (🚀 Launches Tab)
- List of upcoming launches
- Live countdowns for each
- Color-coded visibility (Green/Amber/Red)
- Pull down to refresh

### Launch Detail Screen
- Tap any launch card to see:
  - Large countdown
  - Viewing direction
  - Visibility info
  - Weather conditions

### Notifications Tab (🔔)
- Toggle notification reminders
- Permission management
- Test notifications

### Settings Tab (⚙️)
- Clear cache
- App version
- Theme settings

---

## Troubleshooting

### If Expo Won't Start
```bash
# Port already in use?
cd /Users/pato/bermuda-rocket-tracker-monorepo/packages/mobile
npm start
# Press 'Y' to use different port
```

### If Connection Fails
```bash
# Make sure you're on WiFi (not hotspot)
# Check your IP matches in terminal
ifconfig | grep "inet "
```

### If You See Errors
```bash
# Clear cache and restart
npm start --clear
```

---

## Key Files (If You Need to Edit)

- **Navigation**: `src/navigation/AppNavigator.tsx`
- **Screens**: `src/screens/*.tsx`
- **Components**: `src/components/*.tsx`
- **Theme**: `src/theme/colors.ts`, `src/theme/typography.ts`
- **Business Logic**: All in `@bermuda/shared` package

---

## Quick Commands Reference

```bash
# Start app
npm start

# Then press in terminal:
i = iOS simulator
a = Android emulator
r = Reload app
m = Toggle menu
q = Quit
```

---

## Documentation

- **Full README**: `packages/mobile/README.md`
- **Migration Report**: `MONOREPO_MIGRATION.md` (at root)
- **Mobile UI Summary**: `packages/mobile/MOBILE_UI_SUMMARY.md`

---

## Your App is Ready! 🎉

Everything is built and working. Just:
1. Start Expo (`npm start`)
2. Connect with Expo Go on iPhone (easiest)
3. See your beautiful rocket tracker app!

Any questions? Check the README or migration docs.
