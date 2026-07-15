# SafeCallr Agent Rules and Project Context

This file maintains project-specific instructions, mobile application setup workflows, and rules for future agent sessions.

## Mobile Application (Capacitor Setup)

We have configured Capacitor for both Android and iOS inside this project. 

- **App ID**: `com.safecallr.app`
- **App Name**: `SafeCallr`
- **Web Directory**: `dist`

### Available NPM Scripts for Capacitor:
- `npm run cap:sync` - Syncs web assets and native plugins (`npx cap sync`)
- `npm run cap:copy` - Copies build files to platform folders (`npx cap copy`)
- `npm run cap:add-android` - Adds the Android platform (`npx cap add android`)
- `npm run cap:add-ios` - Adds the iOS platform (`npx cap add ios`)
- `npm run cap:open-android` - Opens the project in Android Studio (`npx cap open android`)
- `npm run cap:open-ios` - Opens the project in Xcode (`npx cap open ios`)

---

## Logo and Assets Strategy

The official SafeCallr logo features:
- A dark blue background with rounded corners.
- A central safety shield, halved vertically into light-green and dark-green parts.
- The name "SafeCallr" written in a light-teal/mint-green sans-serif typography below the shield.

### How to generate App Icons and Splash Screens locally:
Since Capacitor requires multi-resolution assets for Android and iOS, the user should use the `@capacitor/assets` tool locally.

1. **Setup Assets Directory**:
   Create an `assets/` directory at the root of the project on the local machine:
   ```bash
   mkdir assets
   ```
2. **Save Logo Files**:
   - Save the uploaded icon image as `assets/icon.png`.
   - For a full splash screen, save a 2732x2732 image as `assets/splash.png` (or let the tool generate it).
3. **Run Generator**:
   Run the following command locally to automatically generate all iOS and Android splash screens and app icons:
   ```bash
   npx @capacitor/assets generate --iconBackgroundColor '#0F1B3D' --splashBackgroundColor '#0F1B3D'
   ```
4. **Sync Platforms**:
   Apply the generated assets to Android and iOS folders:
   ```bash
   npm run cap:sync
   ```
