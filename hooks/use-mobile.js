import React from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);

  React.useEffect(() => {
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md);
    };

    onChange();
    window.addEventListener("resize", onChange);

    return () => {
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return !!isMobile;
}

export function useBreakpoint(breakpoint) {
  const [isAboveBreakpoint, setIsAboveBreakpoint] = React.useState(undefined);

  React.useEffect(() => {
    const breakpointValue = BREAKPOINTS[breakpoint] || BREAKPOINTS.md;

    const onChange = () => {
      setIsAboveBreakpoint(window.innerWidth >= breakpointValue);
    };

    onChange();
    window.addEventListener("resize", onChange);

    return () => {
      window.removeEventListener("resize", onChange);
    };
  }, [breakpoint]);

  return !!isAboveBreakpoint;
}

export function useResponsiveValue(options) {
  const isMobile = useIsMobile();
  const isTablet = useBreakpoint("md") && !useBreakpoint("lg");
  const isDesktop = useBreakpoint("lg");

  if (isDesktop && options.desktop !== undefined) return options.desktop;
  if (isTablet && options.tablet !== undefined) return options.tablet;
  if (isMobile && options.mobile !== undefined) return options.mobile;

  return options.default || options.mobile || options.tablet || options.desktop;
}
