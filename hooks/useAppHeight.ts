"use client";

import { useEffect } from "react";

/**
 * Keeps --app-height in sync with the Visual Viewport so iOS Safari
 * chrome does not cover the fixed shell / composer.
 */
export function useAppHeight() {
  useEffect(() => {
    const root = document.documentElement;

    const setAppHeight = () => {
      const height =
        window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--app-height", `${height}px`);
    };

    setAppHeight();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", setAppHeight);
      vv.addEventListener("scroll", setAppHeight);
    }
    window.addEventListener("resize", setAppHeight);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", setAppHeight);
        vv.removeEventListener("scroll", setAppHeight);
      }
      window.removeEventListener("resize", setAppHeight);
    };
  }, []);
}
