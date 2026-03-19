const { withBuildProperties } = require("expo-build-properties");
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Workaround: react-native-quick-crypto hardcodes the iOS deployment
 * target to 16.1 via withBuildProperties and patches the Podfile.
 * This plugin does the same thing but reads the target from the
 * expo-build-properties config (required by ClerkKit to be ≥17.0).
 *
 * Must be listed BEFORE react-native-quick-crypto in the plugins array
 * so that quick-crypto's Podfile patch gets overridden by ours.
 *
 * - quick-crypto hardcode: https://github.com/margelo/react-native-quick-crypto/blob/main/packages/react-native-quick-crypto/src/expo-plugin/withXCode.ts#L15
 * - Expo bug: https://github.com/expo/expo/issues/36546
 * - TODO: Remove once expo/expo#43700 lands and quick-crypto stops hardcoding.
 */
module.exports = (config) => {
  // Read the deployment target from the expo-build-properties plugin config
  const buildPropsPlugin = (config.plugins ?? []).find(
    (p) => Array.isArray(p) && p[0] === "expo-build-properties",
  );
  const deploymentTarget =
    (buildPropsPlugin && buildPropsPlugin[1]?.ios?.deploymentTarget) || "17.0";

  // Use expo-build-properties to set deployment target (same as quick-crypto does)
  config = withBuildProperties(config, {
    ios: { deploymentTarget },
  });

  // Patch the Podfile post_install to force deployment target on all pod targets
  // (mirrors what quick-crypto does, but with our version)
  config = withDangerousMod(config, [
    "ios",
    (modConfig) => {
      const podfilePath = path.join(
        modConfig.modRequest.platformProjectRoot,
        "Podfile",
      );
      let contents = fs.readFileSync(podfilePath, "utf-8");

      // Check if the IPHONEOS_DEPLOYMENT_TARGET setting is already present
      const deploymentTargetSettingExists =
        /\.build_settings\s*\[\s*['"]IPHONEOS_DEPLOYMENT_TARGET['"]\s*\]\s*=/.test(
          contents,
        );

      if (deploymentTargetSettingExists) {
        // Replace any existing hardcoded deployment target value with ours
        contents = contents.replace(
          /(\.build_settings\s*\[\s*['"]IPHONEOS_DEPLOYMENT_TARGET['"]\s*\]\s*=\s*')[^']*(')/g,
          `$1${deploymentTarget}$2`,
        );
      } else {
        // No IPHONEOS_DEPLOYMENT_TARGET setting found, add it to post_install
        contents = contents.replace(
          /(post_install\s+do\s+\|installer\|[\s\S]*?)(\r?\n\s\send\s*)$/m,
          `$1
    # Force iOS deployment target (withIOSDeploymentTarget plugin)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'
      end
    end
$2`,
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return modConfig;
    },
  ]);

  return config;
};
