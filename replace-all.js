const fs = require("fs");
const path = require("path");

const dir =
  "/Users/aizen/Downloads/clientspace/src/features/clients/components";
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => path.join(dir, f));

const replacements = [
  // Backgrounds and colors
  [
    /bg-\[linear-gradient\(165deg,rgba\(20,22,28,0\.5\)_0%,rgba\(10,11,15,0\.7\)_100%\)\]/g,
    "bg-card",
  ],
  [
    /bg-\[linear-gradient\(165deg,rgba\(20,22,28,0\.7\)_0%,rgba\(10,11,15,0\.8\)_100%\)\]/g,
    "bg-card",
  ],
  [
    /bg-\[linear-gradient\(240deg,#12141a_0%,#0a0b0f_100%\)\]/g,
    "bg-background",
  ],
  [
    /bg-\[linear-gradient\(145deg,rgba\(38,42,57,0\.94\)_0%,rgba\(21,24,33,0\.94\)_100%\)\]/g,
    "bg-muted",
  ],
  [/border-\[var\(--obs-border-soft\)\]/g, "border-border"],
  [/border-\[var\(--obs-border\)\]/g, "border-border"],
  [/border-\[color:var\(--obs-border-soft\)\]/g, "border-border"],
  [/text-\[var\(--obs-text\)\]/g, "text-foreground"],
  [/text-\[var\(--obs-muted\)\]/g, "text-muted-foreground"],
  [/text-\[var\(--obs-gold\)\]/g, "text-primary"],
  [/bg-\[var\(--obs-gold\)\]/g, "bg-primary"],
  [/text-\[var\(--obs-blue\)\]/g, "text-blue-500"],
  [/var\(--obs-muted\)/g, "muted-foreground"],
  [/var\(--obs-gold\)/g, "primary"],
  [/text-white/g, "text-foreground"],
  [/bg-white\/5/g, "bg-muted/50"],
  [/bg-white\/\[0\.02\]/g, "bg-muted/30"],
  [/bg-white\/\[0\.03\]/g, "bg-muted/40"],
  [/bg-\[var\(--obs-surface-2\)\]/g, "bg-accent"],
  [/hover:text-white/g, "hover:text-foreground"],
  [/bg-\[#12141a\]/g, "bg-popover"],
  [/bg-\[#0d0f14\]\/50/g, "bg-muted/20"],
  [/text-\[#0a0b0f\]/g, "text-primary-foreground"],
  [/bg-\[rgba\(239,205,143,0\.1\)\]/g, "bg-primary/10"],
  [/bg-\[rgba\(239,205,143,0\.05\)\]/g, "bg-primary/5"],

  // Shadows
  [/shadow-\[0_0_16px_-4px_rgba\(239,205,143,0\.6\)\]/g, "shadow-sm"],
  [/shadow-\[0_8px_30px_-10px_rgba\(239,205,143,0\.15\)\]/g, "shadow-md"],
  [/shadow-\[0_8px_30px_-10px_rgba\(239,205,143,0\.18\)\]/g, "shadow-md"],
  [/shadow-\[0_8px_24px_-12px_rgba\(0,0,0,0\.5\)\]/g, "shadow-md"],
  [/shadow-\[-20px_0_60px_-15px_rgba\(0,0,0,0\.8\)\]/g, "shadow-2xl"],
  [
    /shadow-\[inset_0_1px_1px_rgba\(255,255,255,0\.05\),0_8px_32px_rgba\(0,0,0,0\.6\)\]/g,
    "shadow-lg",
  ],
  [/shadow-\[0_0_24px_-8px_rgba\(239,205,143,0\.8\)\]/g, "shadow-sm"],
  [/shadow-\[0_0_10px_rgba\(239,205,143,0\.8\)\]/g, "shadow-sm"],
  [/hover:shadow-\[0_8px_24px_-12px_rgba\(0,0,0,0\.5\)\]/g, "hover:shadow-md"],

  // Gradients
  [/bg-black\/40/g, "bg-muted"],
  [/bg-black\/80/g, "bg-foreground"],
  [
    /bg-\[radial-gradient\(circle_at_center,rgba\(110,168,255,0\.08\)_0,transparent_70%\)\]/g,
    "",
  ],
  [
    /bg-\[linear-gradient\(90deg,transparent_0%,var\(--obs-gold\)_50%,transparent_100%\)\]/g,
    "bg-gradient-to-r from-transparent via-primary to-transparent",
  ],
  [
    /bg-\[linear-gradient\(180deg,transparent_0%,var\(--obs-gold\)_50%,transparent_100%\)\]/g,
    "bg-linear-to-b from-transparent via-primary to-transparent",
  ],
  [
    /bg-\[radial-gradient\(circle_at_center,rgba\(239,205,143,0\.15\)_0,transparent_70%\)\]/g,
    "",
  ],

  // Custom classes
  [/obsidian-shell/g, "bg-background"],
  [/obsidian-noise/g, ""],
  [/obsidian-scroll/g, ""],
  [/hover:bg-\[#1a1c23\]/g, "hover:bg-accent"],

  // Green/Status Colors
  [/text-\[#4ade80\]/g, "text-green-500"],
  [/text-\[#f87171\]/g, "text-red-500"],
  [/border-\[#4ade80\]\/20/g, "border-green-500/20"],
  [/bg-\[#4ade80\]\/10/g, "bg-green-500/10"],
  [/bg-\[#4ade80\]/g, "bg-green-500"],
  [/shadow-\[0_0_6px_#4ade80\]/g, "shadow-[0_0_6px_rgba(34,197,94,0.5)]"],
];

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let original = content;
  replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated ${path.basename(file)}`);
  }
});
console.log("Done replaces.");
