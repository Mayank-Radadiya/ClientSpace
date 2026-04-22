import {
  DM_Sans,
  DM_Mono,
  Plus_Jakarta_Sans,
  Montserrat,
  Geist,
  Syne,
  Barlow_Condensed,
} from "next/font/google";

// Google fonts
export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

export const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["400", "500", "600", "700"],
});

// Local replacement (Axiforma is missing, using Montserrat as fallback)
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});
