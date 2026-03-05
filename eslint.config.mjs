import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  // Feature-Sliced Architecture — import direction enforcement (PRD §10.2)
  // Enforces: app/ → features/ → lib/ | db/ | components/ui/
  // Blocks features/ from importing app/ (prevents coupling routing to business logic)
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "features", pattern: "src/features/**" },
        { type: "lib", pattern: "src/lib/**" },
        { type: "db", pattern: "src/db/**" },
        { type: "ui", pattern: "src/components/**" },
        { type: "trpc", pattern: "src/trpc/**" },
        { type: "inngest", pattern: "src/inngest/**" },
        { type: "config", pattern: "src/config/**" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "app",
              allow: ["features", "lib", "db", "ui", "trpc", "config"],
            },
            {
              from: "features",
              allow: ["lib", "db", "ui", "trpc", "inngest", "config"],
            },
            { from: "lib", allow: ["db", "config"] },
            { from: "trpc", allow: ["features", "lib", "db", "config"] },
            { from: "inngest", allow: ["features", "lib", "db", "config"] },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
