# Android Signing (one-time setup)

Generate a keystore locally (no Android Studio needed — keytool ships with any JDK):

```bash
keytool -genkeypair -v -keystore release.keystore -alias tirtawana   -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.keystore   # copy the output
```

Then in your GitHub repo: **Settings → Secrets and variables → Actions → New secret**:
- Name: `RELEASE_KEYSTORE_BASE64` — paste the base64 output.
- Also add `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` if you set a password
  (wire them into `android/app/build.gradle` signingConfigs, or leave the debug
  signature for internal testing).

Push a tag to build in the cloud:

```bash
git tag v0.1.0 && git push origin v0.1.0
# Actions → android-release → Artifacts: tirtawana-android (APK + AAB)
```

The AAB uploads to Play Console (internal testing); the APK sideloads directly
onto any Android device. Landscape orientation is enforced by the game itself
(RotateScene), independent of native config.
