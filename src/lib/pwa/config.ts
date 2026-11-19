import splashScreens from "./apple-splash-screens.json";

export const PWA_BRAND = {
  name: "کشاورز — پلتفرم خدمات کشاورزی",
  shortName: "کشاورز",
  description: "اتصال کشاورزان برای اشتراک‌گذاری ادوات و خدمات کشاورزی",
  /** Android splash + task switcher; matches the `AppSplash` field. */
  backgroundColor: "#0f3324",
  themeColor: "#0f3324",
} as const;

/**
 * Status-bar colour per surface, matched to the top edge of each hero so the
 * system bar blends into the page (Android standalone + Safari tab tint).
 */
export const STATUS_BAR_COLORS = {
  /** Dark field heroes: home, provider panel, profile. */
  field: "#0f3324",
  /** Golden harvest hero of the consumer panel. */
  harvest: "#fff6e0",
  /** Morning sky behind the auth farm scene. */
  sky: "#dff3ff",
} as const;

/** `apple-touch-startup-image` links for every iPhone/iPad in both orientations. */
export const APPLE_STARTUP_IMAGES = splashScreens.flatMap(({ width, height, ratio }) =>
  (["portrait", "landscape"] as const).map((orientation) => {
    const [w, h] = orientation === "portrait" ? [width * ratio, height * ratio] : [height * ratio, width * ratio];
    return {
      url: `/splash/apple-splash-${w}x${h}.png`,
      media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation})`,
    };
  }),
);
