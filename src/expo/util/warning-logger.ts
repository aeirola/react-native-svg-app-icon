import type { Logger } from "../../lib/util/logger";
import { WarningAggregator } from "expo/config-plugins";

const PROPERTY = "react-native-svg-app-icon";

/**
 * Creates a logger that reports warnings and errors to the Expo WarningAggregator.
 * Info and debug messages are dropped.
 */
export function createWarningLogger(platform: "ios" | "android"): Logger {
  const add = (property: string, text: string) =>
    WarningAggregator.addWarningForPlatform(platform, property, text);
  return {
    error: (message) => add(PROPERTY, `Error: ${message}`),
    warn: (message) => add(PROPERTY, message),
    info: () => {},
    debug: () => {},
  };
}
