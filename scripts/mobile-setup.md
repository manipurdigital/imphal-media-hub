# Mobile App Setup Guide

## Quick Start (Development with Hot Reload)

Your app is already configured for development with hot reload from the Lovable sandbox.

### Current Development Setup
- ✅ Capacitor dependencies installed
- ✅ `capacitor.config.ts` configured for hot reload
- ✅ Mobile-specific hooks and components added
- ✅ Safe area handling implemented
- ✅ Status bar and back button management

## Production Build Setup

### 1. Export to GitHub and Clone Locally
```bash
# Use the "Export to GitHub" button in Lovable
# Then clone your repository locally
git clone https://github.com/yourusername/your-repo.git
cd your-repo
npm install
```

### 2. Add Mobile Platforms
```bash
# Add iOS platform (requires macOS)
npx cap add ios

# Add Android platform
npx cap add android
```

### 3. Switch to Production Config
```bash
# Copy production config
cp capacitor-prod.config.ts capacitor.config.ts
```

### 4. Build and Sync
```bash
# Build the web app
npm run build

# Sync to mobile platforms
npx cap sync
```

### 5. Run on Device/Emulator
```bash
# For Android
npx cap run android

# For iOS (macOS only)
npx cap run ios

# Or open in native IDEs
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode
```

## Authentication Setup

### Supabase URL Configuration
1. Go to your Supabase dashboard
2. Navigate to Authentication > URL Configuration
3. Add these URLs:
   - **Site URL**: `https://de3b4e35-877c-4e8b-a039-be8864080bc6.lovableproject.com`
   - **Redirect URLs**: 
     - `https://de3b4e35-877c-4e8b-a039-be8864080bc6.lovableproject.com/**`
     - `app.lovable.de3b4e35877c4e8ba039be8864080bc6://auth/callback` (for mobile)

## Payment Integration

### Razorpay Mobile Testing
- The current web-based Razorpay checkout should work in mobile WebView
- For UPI deep-links and native payment apps, consider adding the Razorpay Capacitor plugin

## Features Implemented

### Mobile-Specific Components
- `MobileApp`: Wrapper component with safe area and touch optimizations
- `useMobile`: Hook to detect mobile/native platform
- `useStatusBar`: Status bar styling management
- `useBackButton`: Android back button handling
- `useSafeArea`: Safe area insets handling

### CSS Optimizations
- Safe area support with `env()` variables
- Touch-optimized interactions
- Smooth scrolling for mobile

## Testing Checklist

- [ ] Authentication (email/password)
- [ ] Video playback (subscribed content)
- [ ] PPV purchase flow
- [ ] Payment verification
- [ ] Navigation (back button on Android)
- [ ] Status bar styling
- [ ] Safe area handling (notch/home indicator)

## Production Release

### Android
1. Generate signing key: `keytool -genkey -v -keystore my-app-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-app`
2. Configure in `android/app/build.gradle`
3. Build: `./gradlew assembleRelease`
4. Upload to Google Play Console

### iOS
1. Configure Bundle ID and Team in Xcode
2. Archive and upload to App Store Connect
3. Submit for review

## Troubleshooting

### Common Issues
- **White screen**: Check console logs in browser dev tools
- **Auth issues**: Verify Supabase redirect URLs
- **Payment failures**: Test Razorpay in WebView vs native apps
- **Video playback**: Ensure CORS headers for video sources

### Debugging
- Use Chrome DevTools for WebView debugging
- Check native logs in Xcode/Android Studio
- Test in browser first, then mobile WebView

## Next Steps

For advanced mobile features:
- Push notifications: `@capacitor/push-notifications`
- Camera access: `@capacitor/camera`
- File system: `@capacitor/filesystem`
- Native Razorpay: `capacitor-razorpay-plugin`