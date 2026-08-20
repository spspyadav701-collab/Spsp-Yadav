import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function addDirectoryToZip(zip, dirPath, rootPath) {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // skip node_modules or large caches if any
      if (item === '.gradle' || item === 'build') continue;
      const folderZip = zip.folder(relativePath);
      await addDirectoryToZip(zip, fullPath, rootPath);
    } else {
      const fileContent = fs.readFileSync(fullPath);
      const fileOptions = {};
      if (item === 'gradlew' || item.endsWith('.sh')) {
        fileOptions.unixPermissions = 0o755;
      }
      zip.file(relativePath, fileContent, fileOptions);
    }
  }
}

async function packageAndroidProject() {
  console.log('[Zip] Packaging Android Project into AI_Teacher_Android_App.zip...');
  const zip = new JSZip();
  const androidDir = path.resolve(process.cwd(), 'android');

  if (!fs.existsSync(androidDir)) {
    console.error('Android directory not found!');
    process.exit(1);
  }

  // Ensure local executable permissions on gradlew if supported
  try {
    const gradlewPath = path.join(androidDir, 'gradlew');
    if (fs.existsSync(gradlewPath)) {
      fs.chmodSync(gradlewPath, 0o755);
    }
  } catch {}

  await addDirectoryToZip(zip, androidDir, androidDir);

  // If real compiled APK exists, include it inside the ZIP archive in APK_DOWNLOAD and app/build/outputs/apk/debug/
  const apkSource = path.resolve(process.cwd(), 'android/app/build/outputs/apk/debug/app-debug.apk');
  const apkDownloadPath = path.resolve(process.cwd(), 'APK_DOWNLOAD/app-debug.apk');
  const actualApk = fs.existsSync(apkSource) ? apkSource : (fs.existsSync(apkDownloadPath) ? apkDownloadPath : null);

  if (actualApk && fs.statSync(actualApk).size > 0) {
    const apkBuffer = fs.readFileSync(actualApk);
    zip.file('APK_DOWNLOAD/app-debug.apk', apkBuffer);
    zip.file('app/build/outputs/apk/debug/app-debug.apk', apkBuffer);
    zip.file('.build-outputs/app-debug.apk', apkBuffer);
    console.log(`[Zip] Included real compiled APK in ZIP (${(apkBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // Also include README with 1-click APK build instructions
  const readmeContent = `# AI Teacher - Android APK Project (Mithila Academy)

Package ID: com.mithilaacademy.spaai
App Name: AI Teacher

## How to Build the APK:

### Option 1: Using Android Studio (Recommended)
1. Unzip this folder.
2. Open Android Studio -> Select "Open an existing project" -> Choose this folder.
3. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. The generated APK will be in: \`app/build/outputs/apk/debug/app-debug.apk\`.

### Option 2: Command Line / Terminal
\`\`\`bash
chmod +x ./gradlew
./gradlew assembleDebug
\`\`\`
The APK will be generated at \`app/build/outputs/apk/debug/app-debug.apk\`.

### Features inside this Android App:
- Full-screen native immersive app
- Mithila Academy AI Teacher Voice Assistant
- Real-time Gemini Live voice streaming
- Android Microphone permission pre-configured
- Touch gesture customization (drag, pinch-to-resize, rotation)
- LocalStorage layout persistence
- Google Drive file browser & avatar integration
`;
  zip.file('README.md', readmeContent);

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  // Save to public/ and dist/
  const publicOut = path.resolve(process.cwd(), 'public', 'AI_Teacher_Android_App.zip');
  fs.writeFileSync(publicOut, content);
  console.log(`[Zip] Successfully created ${publicOut} (${(content.length / (1024 * 1024)).toFixed(2)} MB)`);

  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const distOut = path.join(distDir, 'AI_Teacher_Android_App.zip');
    fs.writeFileSync(distOut, content);
    console.log(`[Zip] Also copied to ${distOut}`);
  }
}

packageAndroidProject().catch(console.error);
