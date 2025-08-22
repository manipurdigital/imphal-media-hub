# Imoinu Mobile App

Cross-platform mobile app for the Imoinu OTT streaming platform, built with Capacitor.

## Architecture

```
Web App (React + Vite + Tailwind)
    ↓
Capacitor (Cross-platform bridge)
    ↓
Native iOS/Android Apps
```

## Features

- 📱 Native iOS and Android apps
- 🔄 Hot reload during development
- 🔐 Supabase authentication
- 💳 Razorpay payments
- 📺 Video streaming with Mux player
- 🎨 Netflix-inspired UI
- ⚡ Optimized for mobile performance

## Development

### Prerequisites
- Node.js 18+
- Xcode (for iOS, macOS only)
- Android Studio (for Android)

### Quick Start
```bash
# Clone from GitHub after export
git clone <your-repo>
cd your-repo
npm install

# Add platforms
npx cap add ios
npx cap add android

# Development with hot reload (already configured)
npx cap run ios --livereload
npx cap run android --livereload
```

### Production Build
```bash
# Build web app
npm run build

# Sync to native platforms
npx cap sync

# Run on device
npx cap run ios
npx cap run android
```

## Configuration

### Development vs Production
- **Development**: Uses `server.url` for hot reload from Lovable
- **Production**: Uses embedded `dist` folder

### Authentication
Supabase URLs configured for both web and mobile:
- Web: `https://de3b4e35-877c-4e8b-a039-be8864080bc6.lovableproject.com`
- Mobile: `app.lovable.de3b4e35877c4e8ba039be8864080bc6://auth/callback`

## Mobile Optimizations

### Components
- **MobileApp**: Root wrapper with safe area handling
- **Mobile hooks**: Platform detection, status bar, back button

### CSS
- Safe area insets for notch/home indicator
- Touch-optimized interactions
- Smooth scrolling

### Platform Features
- Status bar styling (dark theme)
- Android back button handling
- iOS gesture prevention
- Double-tap zoom prevention

## Payment Integration

Current: Web-based Razorpay checkout in WebView
Future: Native Razorpay plugin for UPI deep-links

## Video Playback

- Mux player optimized for mobile WebView
- Inline playback support
- Fullscreen handling

## Store Deployment

### Android (Google Play)
1. Generate signing key
2. Configure build.gradle
3. Build AAB: `./gradlew bundleRelease`
4. Upload to Play Console

### iOS (App Store)
1. Configure Bundle ID and Team
2. Archive in Xcode
3. Upload to App Store Connect

## Architecture Benefits

✅ **Single Codebase**: React app runs on web, iOS, and Android
✅ **Shared Backend**: Same Supabase database and edge functions
✅ **Consistent UI**: Same design system across platforms
✅ **Rapid Development**: Hot reload and web-first development
✅ **Cost Effective**: One team, multiple platforms

## Support

For mobile-specific issues:
1. Check browser console in WebView
2. Review native logs in Xcode/Android Studio
3. Test web version first to isolate platform issues