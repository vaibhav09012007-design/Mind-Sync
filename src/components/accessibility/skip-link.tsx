"use client";

/**
 * Skip Link Component
 * Allows keyboard users to skip to main content
 */

import { useState } from "react";

export function SkipLink() {
  const [focused, setFocused] = useState(false);

  return (
    <a
      href="#main-content"
      className={`bg-primary focus:ring-primary fixed left-4 z-[9999] rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none ${focused ? "top-4" : "-top-12"} `}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      Skip to main content
    </a>
  );
}
