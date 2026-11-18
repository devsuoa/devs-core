import rawFlags from "../config/feature-flags.json";

type FeatureFlagMap = Record<string, boolean>;

const flags: FeatureFlagMap = rawFlags.reduce((acc, flag) => {
  acc[flag.name] = flag.value;
  return acc;
}, {} as FeatureFlagMap);

export function isFeatureEnabled(flagName: string): boolean {
  return Boolean(flags[flagName]);
}
