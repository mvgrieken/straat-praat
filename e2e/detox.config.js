const { defineConfig } = require('detox');

module.exports = defineConfig({
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    'ios.sim.debug': {
      type: 'ios.simulator',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/straat-praat.app',
      build: 'xcodebuild -workspace ios/straat-praat.xcworkspace -scheme straat-praat -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      device: {
        type: 'iPhone 15',
        os: '17.0',
      },
    },
    'ios.sim.release': {
      type: 'ios.simulator',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/straat-praat.app',
      build: 'xcodebuild -workspace ios/straat-praat.xcworkspace -scheme straat-praat -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
      device: {
        type: 'iPhone 15',
        os: '17.0',
      },
    },
    'android.emu.debug': {
      type: 'android.emulator',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      device: {
        avdName: 'Pixel_7_API_34',
      },
    },
    'android.emu.release': {
      type: 'android.emulator',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      device: {
        avdName: 'Pixel_7_API_34',
      },
    },
  },
  artifacts: {
    plugins: {
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      logs: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
    },
  },
});
