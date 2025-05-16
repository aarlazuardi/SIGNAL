"use client";

import React from "react";
import { useBreakpoint } from "../../hooks/use-mobile";

export function Responsive({
  children,
  breakpoint = "md",
  above = false,
  below = false,
}) {
  const isAboveBreakpoint = useBreakpoint(breakpoint);

  if (above && isAboveBreakpoint) return <>{children}</>;
  if (below && !isAboveBreakpoint) return <>{children}</>;
  if (!above && !below) return <>{children}</>;

  return null;
}

export function DesktopOnly({ children }) {
  return (
    <Responsive breakpoint="lg" above>
      {children}
    </Responsive>
  );
}

export function TabletUp({ children }) {
  return (
    <Responsive breakpoint="md" above>
      {children}
    </Responsive>
  );
}

export function MobileOnly({ children }) {
  return (
    <Responsive breakpoint="md" below>
      {children}
    </Responsive>
  );
}
