import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// DM Sans — the functional voice of the interface. Clean and highly legible at
// small sizes for every key, control, and word on the board, even in a dim ICU.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-main",
  display: "swap",
});

// DM Serif Display — the emotional / brand register: the wordmark, screen
// titles, and the spoken voice. Italic carries the tagline.
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Aloud — A voice for anyone who can't speak or type",
  description:
    "Aloud turns the smallest gesture — a blink, a tap, a switch — into full, natural spoken sentences using AI. Communication for people with ALS, cerebral palsy, paralysis, and more.",
};

export const viewport = {
  themeColor: "#070B0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body>{children}<Analytics /></body>
    </html>
  );
}
