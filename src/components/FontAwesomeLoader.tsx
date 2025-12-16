"use client";

import { useEffect } from 'react';

/**
 * FontAwesome Config Loader
 * Configures FontAwesome to auto-inject CSS only on client-side
 * This avoids prerendering issues by not importing CSS files during build
 */
export default function FontAwesomeLoader() {
  useEffect(() => {
    // Only configure FontAwesome on client-side
    // Let it auto-inject CSS instead of importing CSS file
    if (typeof window !== 'undefined') {
      import("@fortawesome/fontawesome-svg-core").then((mod) => {
        // Enable auto CSS injection (FontAwesome will inject CSS automatically)
        mod.config.autoAddCss = true;
      }).catch((error) => {
        console.warn('Failed to configure FontAwesome:', error);
      });
    }
  }, []);

  return null; // This component doesn't render anything
}

