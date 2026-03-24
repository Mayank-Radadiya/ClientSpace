import {
  DM_Sans,
  Plus_Jakarta_Sans,
  Montserrat,
  Geist,
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

// Local replacement (Axiforma is missing, using Montserrat as fallback)
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});
