#!/bin/bash
set -e

export JAVA_HOME=/opt/jdk-17
export PATH=$JAVA_HOME/bin:$PATH

echo "[SDK Setup] Setting up Android SDK in /opt/android-sdk..."
mkdir -p /opt/android-sdk/cmdline-tools

cd /tmp
if [ ! -f "cmdline-tools.zip" ]; then
  echo "[SDK Setup] Downloading Android Command Line Tools..."
  wget -q --show-progress "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -O cmdline-tools.zip
fi

echo "[SDK Setup] Extracting cmdline-tools..."
unzip -q -o cmdline-tools.zip -d /tmp/cmdline-tools-unzip
mkdir -p /opt/android-sdk/cmdline-tools/latest
cp -r /tmp/cmdline-tools-unzip/cmdline-tools/* /opt/android-sdk/cmdline-tools/latest/

export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo "[SDK Setup] Accepting Android SDK Licenses..."
yes | /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses || true

echo "[SDK Setup] Installing Android SDK platform & build tools..."
/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --install \
  "platform-tools" \
  "platforms;android-35" \
  "platforms;android-36" \
  "build-tools;35.0.0"

echo "[SDK Setup] Configuring local.properties in android directory..."
echo "sdk.dir=/opt/android-sdk" > /app/applet/android/local.properties

echo "[SDK Setup] Android SDK setup complete!"
