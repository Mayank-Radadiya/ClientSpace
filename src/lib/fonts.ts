import { Playfair_Display } from "next/font/google";
import localFont from "next/font/local";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});

export const geistSans = localFont({
  src: "../../public/fonts/GeistVF.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

export const geistMono = localFont({
  src: "../../public/fonts/GeistMonoVF.woff2",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});
