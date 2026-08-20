#!/bin/bash
set -e

echo "[Gradle Setup] Downloading official Gradle 8.14.3..."
cd /tmp
if [ ! -f "gradle-8.14.3-bin.zip" ]; then
  wget -q --show-progress "https://services.gradle.org/distributions/gradle-8.14.3-bin.zip" -O gradle-8.14.3-bin.zip
fi

echo "[Gradle Setup] Extracting Gradle 8.14.3 to /opt/gradle..."
mkdir -p /opt/gradle
unzip -q -o gradle-8.14.3-bin.zip -d /opt/gradle/

export GRADLE_HOME=/opt/gradle/gradle-8.14.3
export ANDROID_HOME=/opt/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$GRADLE_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "[Gradle Setup] Regenerating pristine Gradle wrapper..."
cd /app/applet/android
gradle wrapper --gradle-version 8.14.3 --distribution-type all

echo "[Gradle Setup] Compiling Android assembleDebug with Gradle 8.14.3..."
gradle assembleDebug --no-daemon --stacktrace

APK_PATH="/app/applet/android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ] || [ ! -s "$APK_PATH" ]; then
  echo "ERROR: APK compilation did not generate a non-empty file!"
  exit 1
fi

APK_SIZE=$(stat -c%s "$APK_PATH")
echo "=========================================================="
echo "SUCCESS! REAL ANDROID APK COMPILED: $APK_SIZE bytes"
echo "Location: $APK_PATH"
echo "=========================================================="

# 1. Place in .build-outputs/app-debug.apk
mkdir -p /app/applet/.build-outputs
cp -f "$APK_PATH" /app/applet/.build-outputs/app-debug.apk

# 2. Place in APK_DOWNLOAD/app-debug.apk
mkdir -p /app/applet/APK_DOWNLOAD
cp -f "$APK_PATH" /app/applet/APK_DOWNLOAD/app-debug.apk

# 3. Place in public/ and dist/
mkdir -p /app/applet/public
cp -f "$APK_PATH" /app/applet/public/app-debug.apk

mkdir -p /app/applet/dist
cp -f "$APK_PATH" /app/applet/dist/app-debug.apk

# 4. Repackage AI_Teacher_Android_App.zip
cd /app/applet
node scripts/package-android-zip.js

echo "REAL APK SUCCESSFULLY DISTRIBUTED TO ALL TARGETS!"
