"use client";

import React, { useState, useEffect } from "react";

// Breakpoints yang sesuai dengan Tailwind CSS
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Component MediaQuery untuk menampilkan konten berdasarkan ukuran layar
 * @param {Object} props
 * @param {string} props.minWidth - Breakpoint minimum (sm, md, lg, xl, 2xl)
 * @param {string} props.maxWidth - Breakpoint maximum (sm, md, lg, xl, 2xl)
 * @param {React.ReactNode} props.children - Konten yang akan ditampilkan jika kondisi terpenuhi
 */
export function MediaQuery({ minWidth, maxWidth, children }) {
  const [matches, setMatches] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const minWidthValue = minWidth
      ? BREAKPOINTS[minWidth] || parseInt(minWidth, 10)
      : 0;
    const maxWidthValue = maxWidth
      ? BREAKPOINTS[maxWidth] || parseInt(maxWidth, 10)
      : Infinity;

    const checkQuery = () => {
      const currentWidth = window.innerWidth;
      setMatches(currentWidth >= minWidthValue && currentWidth < maxWidthValue);
    };

    checkQuery();
    window.addEventListener("resize", checkQuery);

    return () => {
      window.removeEventListener("resize", checkQuery);
    };
  }, [minWidth, maxWidth]);

  // Hindari hydration mismatch dengan hanya menampilkan setelah client-side mounted
  if (!isMounted) return null;

  return matches ? children : null;
}

/**
 * Component yang hanya ditampilkan pada layar mobile (< 768px)
 */
export function MobileOnly({ children }) {
  return <MediaQuery maxWidth="md">{children}</MediaQuery>;
}

/**
 * Component yang hanya ditampilkan pada layar tablet (>= 768px dan < 1024px)
 */
export function TabletOnly({ children }) {
  return (
    <MediaQuery minWidth="md" maxWidth="lg">
      {children}
    </MediaQuery>
  );
}

/**
 * Component yang hanya ditampilkan pada layar desktop (>= 1024px)
 */
export function DesktopOnly({ children }) {
  return <MediaQuery minWidth="lg">{children}</MediaQuery>;
}

/**
 * Component yang ditampilkan pada tablet dan desktop (>= 768px)
 */
export function TabletUp({ children }) {
  return <MediaQuery minWidth="md">{children}</MediaQuery>;
}

/**
 * Component yang ditampilkan pada mobile dan tablet (< 1024px)
 */
export function MobileAndTablet({ children }) {
  return <MediaQuery maxWidth="lg">{children}</MediaQuery>;
}
