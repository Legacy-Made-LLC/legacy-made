const { withGradleProperties } = require("expo/config-plugins");

/**
 * Config plugin to increase MaxMetaspaceSize in gradle.properties.
 * The default 512m causes OOM errors during Android builds.
 */
function withGradleMemory(config, { maxMetaspaceSize = "1024m" } = {}) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const jvmArgsIndex = props.findIndex(
      (item) => item.type === "property" && item.key === "org.gradle.jvmargs"
    );

    if (jvmArgsIndex !== -1) {
      const entry = props[jvmArgsIndex];
      entry.value = entry.value.replace(
        /-XX:MaxMetaspaceSize=\S+/,
        `-XX:MaxMetaspaceSize=${maxMetaspaceSize}`
      );
    }

    return config;
  });
}

module.exports = withGradleMemory;
