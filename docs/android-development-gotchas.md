# Android Development Gotchas

This document outlines common issues encountered when developing the Legacy Made app for Android, along with their solutions and workarounds.

## Table of Contents

1. [Node Version Compatibility Issues](#node-version-compatibility-issues)
2. [Gradle Memory Configuration](#gradle-memory-configuration)
3. [Preventive Measures](#preventive-measures)
4. [Quick Reference](#quick-reference)

---

## Node Version Compatibility Issues

### Problem

When using nvm (Node Version Manager) with a default Node.js version that's too new (e.g., v24), the Android bundler fails to find a suitable Node version. This causes build failures and prevents the app from running on Android devices/emulators.

### Root Cause

- Android build tools have specific Node.js version requirements
- Node.js v24 is too new for the current React Native/Expo toolchain
- Android Studio inherits the Node version from the shell environment where it's launched

### Solutions

#### Solution 1: Launch Android Studio with Correct Node Version (Recommended)

```bash
# Switch to Node v22 (or v20 for better stability)
nvm use 22

# Launch Android Studio from the same terminal session
open -a /Applications/Android\ Studio.app

# Alternatively, you can create an alias in your shell config
echo 'alias android-studio="nvm use 22 && open -a /Applications/Android\ Studio.app"' >> ~/.zshrc
source ~/.zshrc
```

#### Solution 2: Set Node Version in Project

Create a `.nvmrc` file in your project root:

```bash
echo "22" > .nvmrc
```

Then always use:

```bash
nvm use  # Automatically uses version from .nvmrc
npm run android
```

#### Solution 3: Configure Android Studio to Use Specific Node Version

1. Open Android Studio
2. Go to **Preferences** → **Build, Execution, Deployment** → **Build Tools** → **Gradle**
3. Add to **Gradle VM options**:
   ```
   -Dnode.dir=/Users/[your-username]/.nvm/versions/node/v22.x.x
   ```

---

## Gradle Memory Configuration

### Problem

Android builds fail with `OutOfMemoryError` when the default JVM heap size (512MB) is insufficient. While you can modify `gradle.properties`, Expo's prebuild process overwrites these changes.

### Root Cause

- Expo's prebuild regenerates native project files, including `gradle.properties`
- Large projects require more memory than the default allocation
- The default 512MB heap is often insufficient for production builds

### Solutions

#### Solution 1: Configure Memory in app.json/app.config.ts

Add to your `app.config.ts`:

```typescript
export default {
  // ... other config
  expo: {
    // ... other expo config
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            // Increase Java heap size
            gradleJavaMaxHeapSize: "4g",  // or "1024m", "2048m", etc.

            // Additional memory optimizations
            kotlinOptions: {
              jvmTarget: "17"
            },
            packagingOptions: {
              jniLibs: {
                useLegacyPackaging: false
              }
            }
          }
        }
      ]
    ]
  }
};
```

First install the required plugin:

```bash
npx expo install expo-build-properties
```

#### Solution 2: Use Environment Variables

Set memory limits via environment variables before building:

```bash
# Set gradle memory options
export GRADLE_OPTS="-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:+UseParallelGC"

# Run your build
npx expo run:android

# Or create a build script in package.json
"scripts": {
  "android:build": "GRADLE_OPTS='-Xmx2048m' npx expo run:android"
}
```

#### Solution 3: Create a Post-Prebuild Script

Add to `package.json`:

```json
{
  "scripts": {
    "postprebuild": "node scripts/fix-gradle-memory.js",
    "android": "npm run postprebuild && npx expo run:android"
  }
}
```

Create `scripts/fix-gradle-memory.js`:

```javascript
const fs = require('fs');
const path = require('path');

const gradlePropertiesPath = path.join(
  __dirname,
  '..',
  'android',
  'gradle.properties'
);

if (fs.existsSync(gradlePropertiesPath)) {
  let content = fs.readFileSync(gradlePropertiesPath, 'utf8');

  // Update or add memory configuration
  const memoryConfig = 'org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m';

  if (content.includes('org.gradle.jvmargs=')) {
    content = content.replace(/org\.gradle\.jvmargs=.*/g, memoryConfig);
  } else {
    content += `\n${memoryConfig}\n`;
  }

  fs.writeFileSync(gradlePropertiesPath, content);
  console.log('✅ Gradle memory configuration updated');
}
```

#### Solution 4: Persistent Gradle Configuration

Create/modify `~/.gradle/gradle.properties` (global Gradle settings):

```properties
# Global gradle properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true
```

---

## Preventive Measures

### 1. Project Setup Checklist

Before starting Android development:

- [ ] Create `.nvmrc` file with Node v20 or v22
- [ ] Install `expo-build-properties` plugin
- [ ] Configure memory settings in `app.config.ts`
- [ ] Set up global Gradle properties
- [ ] Document team-specific requirements

### 2. Development Environment Script

Create a `scripts/setup-android.sh`:

```bash
#!/bin/bash

# Check and use correct Node version
if [ -f .nvmrc ]; then
  nvm use
else
  echo "⚠️  No .nvmrc found, using Node v22"
  nvm use 22
fi

# Set gradle options
export GRADLE_OPTS="-Xmx2048m -XX:MaxMetaspaceSize=512m"

# Clean previous builds (optional)
if [ "$1" == "--clean" ]; then
  cd android && ./gradlew clean && cd ..
fi

# Run prebuild with proper config
npx expo prebuild --platform android

# Apply any custom gradle fixes
node scripts/fix-gradle-memory.js 2>/dev/null || true

echo "✅ Android environment ready!"
```

Make it executable: `chmod +x scripts/setup-android.sh`

### 3. Team Onboarding Documentation

Add to your README.md:

```markdown
## Android Development Setup

1. **Install Node v22**:
   ```bash
   nvm install 22
   nvm use 22
   ```

2. **Run setup script**:
   ```bash
   ./scripts/setup-android.sh
   ```

3. **Launch Android Studio** (if needed):
   ```bash
   nvm use 22 && open -a /Applications/Android\ Studio.app
   ```
```

---

## Quick Reference

### Common Commands

```bash
# Quick Android setup
nvm use && npx expo run:android

# Clean build
cd android && ./gradlew clean && cd .. && npx expo run:android

# Build with increased memory
GRADLE_OPTS='-Xmx2048m' npx expo run:android

# Build release APK
cd android && ./gradlew assembleRelease
```

### Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "Cannot find module" error | `nvm use 22 && npm install` |
| Out of memory error | `export GRADLE_OPTS="-Xmx2048m"` |
| Build cache issues | `cd android && ./gradlew clean` |
| Metro bundler issues | `npx react-native start --reset-cache` |
| Android Studio can't find Node | Launch from terminal with correct Node version |

### Environment Variables

```bash
# Add to ~/.zshrc or ~/.bashrc for permanent settings
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export GRADLE_OPTS="-Xmx2048m -XX:MaxMetaspaceSize=512m"
```

---

## Additional Notes

### Why These Issues Occur

1. **Node Version**: React Native and its toolchain are sensitive to Node versions. Major version jumps often introduce breaking changes.

2. **Memory Limits**: Android builds involve:
   - Compiling Kotlin/Java code
   - Processing resources
   - DEX compilation
   - Asset bundling
   All of which consume significant memory.

3. **Expo Prebuild**: Designed to maintain consistency but can override local configurations.

### Best Practices

1. **Always use LTS Node versions** (v20 or v22 as of 2024)
2. **Configure memory settings in version control** via `app.config.ts`
3. **Document environment requirements** for all team members
4. **Use CI/CD for consistent builds** to avoid local environment issues
5. **Monitor build performance** and adjust memory as project grows

### Related Resources

- [Expo Build Properties Plugin](https://docs.expo.dev/versions/latest/sdk/build-properties/)
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- [Gradle Performance Guide](https://docs.gradle.org/current/userguide/performance.html)
- [Android Studio Memory Settings](https://developer.android.com/studio/intro/studio-config#memory)

---

## Contributing

If you encounter additional Android development issues, please add them to this document following the existing format:

1. Describe the problem clearly
2. Identify the root cause
3. Provide multiple solutions when possible
4. Include preventive measures
5. Add quick reference commands