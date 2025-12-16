"use client";

import { useEffect } from 'react';

/**
 * FontAwesome CSS Loader
 * Loads FontAwesome CSS only on client-side to avoid prerendering issues
 */
export default function FontAwesomeLoader() {
  useEffect(() => {
    // Dynamically import FontAwesome CSS and config only on client-side
    Promise.all([
      import("@fortawesome/fontawesome-svg-core/styles.css"),
      import("@fortawesome/fontawesome-svg-core").then(mod => mod.config)
    ]).then(([, config]) => {
      config.autoAddCss = false;
    }).catch((error) => {
      console.warn('Failed to load FontAwesome CSS:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}

