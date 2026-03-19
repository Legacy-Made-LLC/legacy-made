const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Config plugin to remove ad-related permissions pulled in transitively via
 * @clerk/expo → credentials-play-services-auth → ads-mobile-sdk →
 * play-services-ads-identifier.
 */
const AD_PERMISSIONS = [
  "com.google.android.gms.permission.AD_ID",
  "android.permission.ACCESS_ADSERVICES_AD_ID",
];

function withRemoveAdId(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    manifest["uses-permission"] = manifest["uses-permission"] || [];

    for (const permission of AD_PERMISSIONS) {
      const exists = manifest["uses-permission"].some(
        (perm) =>
          perm.$?.["android:name"] === permission &&
          perm.$?.["tools:node"] === "remove",
      );

      if (!exists) {
        manifest["uses-permission"].push({
          $: {
            "android:name": permission,
            "tools:node": "remove",
          },
        });
      }
    }

    return config;
  });
}

module.exports = withRemoveAdId;
