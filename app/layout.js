import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Atkinson Hyperlegible was designed by the Braille Institute specifically to
// improve legibility for low-vision readers — accessibility where it matters
// (every control and word on the board).
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-main",
  display: "swap",
});

// Fraunces — a soft, optical "luxury" serif — for the brand and the spoken
// voice. The couture register; Atkinson stays for everything interactive.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
  themeColor: "#f3efe7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${atkinson.variable} ${fraunces.variable}`}>
      <body>{children}<Analytics /></body>
    </html>
  );
}
