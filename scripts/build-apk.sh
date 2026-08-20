#!/bin/bash
set -e

TOOLS_DIR="/tmp/android-build-env"
mkdir -p "$TOOLS_DIR"

export JAVA_HOME="$TOOLS_DIR/jdk-17"
export ANDROID_HOME="$TOOLS_DIR/android-sdk"
export GRADLE_HOME="$TOOLS_DIR/gradle-8.14.3"
export PATH=$JAVA_HOME/bin:$GRADLE_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# 1. Install Java 17 if not already installed
if [ ! -f "$JAVA_HOME/bin/java" ]; then
  echo "[APK Build 1/6] Downloading Adoptium OpenJDK 17..."
  mkdir -p "$JAVA_HOME"
  curl -fsSL "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_linux_hotspot_17.0.10_7.tar.gz" | tar -xz -C "$JAVA_HOME" --strip-components=1
fi
echo "[APK Build] Java version: $($JAVA_HOME/bin/java -version 2>&1 | head -n 1)"

# 2. Install Gradle 8.14.3 if not already installed
if [ ! -f "$GRADLE_HOME/bin/gradle" ]; then
  echo "[APK Build 2/6] Downloading Gradle 8.14.3..."
  curl -fsSL "https://services.gradle.org/distributions/gradle-8.14.3-bin.zip" -o /tmp/gradle.zip
  unzip -q -o /tmp/gradle.zip -d "$TOOLS_DIR"
  rm -f /tmp/gradle.zip
fi
echo "[APK Build] Gradle version: $($GRADLE_HOME/bin/gradle -v | grep Gradle)"

# 3. Install Android SDK if not already installed
if [ ! -d "$ANDROID_HOME/platforms/android-35" ] && [ ! -d "$ANDROID_HOME/platforms/android-36" ]; then
  echo "[APK Build 3/6] Setting up Android SDK..."
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  if [ ! -f "/tmp/cmdline-tools.zip" ]; then
    curl -fsSL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o /tmp/cmdline-tools.zip
  fi
  unzip -q -o /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-unzip
  mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
  cp -r /tmp/cmdline-tools-unzip/cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"
  rm -rf /tmp/cmdline-tools-unzip

  echo "[APK Build] Accepting SDK Licenses..."
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses || true

  echo "[APK Build] Installing Android SDK platform & build tools..."
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --install \
    "platform-tools" \
    "platforms;android-35" \
    "platforms;android-36" \
    "build-tools;35.0.0"
fi

# Configure local.properties
echo "sdk.dir=$ANDROID_HOME" > /app/applet/android/local.properties

# 4. Web Build and Capacitor sync
echo "[APK Build 4/6] Building web assets with Vite and syncing to Capacitor Android..."
cd /app/applet
npm run build

# 5. Native compilation with Gradle
echo "[APK Build 5/6] Compiling Android native project with Gradle (assembleDebug)..."
cd /app/applet/android
gradle assembleDebug --no-daemon

APK_PATH="/app/applet/android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ] || [ ! -s "$APK_PATH" ]; then
  echo "ERROR: APK compilation failed or output file is empty!"
  exit 1
fi

APK_SIZE=$(stat -c%s "$APK_PATH")
echo "[APK Build 6/6] Successfully compiled real Android APK: $APK_PATH ($((APK_SIZE / 1024 / 1024)) MB, $APK_SIZE bytes)"

# Destination 1: .build-outputs/app-debug.apk
mkdir -p /app/applet/.build-outputs
cp -f "$APK_PATH" /app/applet/.build-outputs/app-debug.apk

# Destination 2: APK_DOWNLOAD/app-debug.apk
mkdir -p /app/applet/APK_DOWNLOAD
cp -f "$APK_PATH" /app/applet/APK_DOWNLOAD/app-debug.apk

# Destination 3: public/ and dist/ for direct in-browser download
mkdir -p /app/applet/public
cp -f "$APK_PATH" /app/applet/public/app-debug.apk

mkdir -p /app/applet/dist
cp -f "$APK_PATH" /app/applet/dist/app-debug.apk

echo "[APK Build] Repackaging AI_Teacher_Android_App.zip to include real compiled APK..."
cd /app/applet
node scripts/package-android-zip.js

echo "================================================================="
echo "[APK Build SUCCESS] Real installable Android APK is ready at:"
echo " 1. /app/applet/.build-outputs/app-debug.apk ($((APK_SIZE / 1024 / 1024)) MB)"
echo " 2. /app/applet/APK_DOWNLOAD/app-debug.apk ($((APK_SIZE / 1024 / 1024)) MB)"
echo " 3. /app/applet/public/app-debug.apk ($((APK_SIZE / 1024 / 1024)) MB)"
echo " 4. /app/applet/public/AI_Teacher_Android_App.zip (contains the real APK)"
echo "================================================================="
