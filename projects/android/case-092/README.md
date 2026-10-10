# case-092

Minimal Android Hello World application. The manifest intentionally permits
cleartext traffic (CWE-319) and exports its launcher activity (CWE-926) for
static-analysis testing. The app never opens a connection or listener.

Pinned inputs: Android Gradle Plugin 8.7.3, Gradle 8.9, Java 17, compile/target
SDK 35, build-tools 35.0.0. Install Android SDK Platform 35 and Build Tools
35.0.0, set `ANDROID_HOME`, and run:

`gradle --no-daemon :app:assembleDebug`
