import { Archivo, Big_Shoulders, Permanent_Marker } from "next/font/google";
import { Geist_Mono } from "next/font/google";

/**
 * Type system for the store redesign ("the corner-shop sticker"):
 * - Big Shoulders: condensed storefront-signage display face (page titles, hero).
 * - Archivo: the working sans for body copy, controls, and data.
 * - Permanent Marker: the handwritten digits of the price sticker, used ONLY
 *   inside `.sticker` (globals.css). One job, never for regular text.
 * - Geist Mono: kept for order numbers (data values).
 */
export const fontDisplay = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
});

export const fontSans = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const fontSticker = Permanent_Marker({
  variable: "--font-sticker",
  weight: "400",
  subsets: ["latin"],
});

export const fontMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});
