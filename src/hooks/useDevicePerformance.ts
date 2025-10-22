"use client";

import { useEffect, useState } from "react";

interface DevicePerformance {
  /**
   * Whether the device is considered high performance
   */
  isHighPerformance: boolean;

  /**
   * Whether the device is considered low performance
   */
  isLowPerformance: boolean;

  /**
   * Whether animations should be reduced
   */
  shouldReduceAnimations: boolean;

  /**
   * Device type estimate
   */
  deviceType: "high-end" | "mid-range" | "low-end" | "unknown";

  /**
   * Number of logical CPU cores
   */
  cores: number;

  /**
   * Device memory in GB (if available)
   */
  memory?: number;
}

/**
 * Hook to detect device performance and adjust animations accordingly
 * 
 * Uses various browser APIs to estimate device capabilities:
 * - navigator.hardwareConcurrency (CPU cores)
 * - navigator.deviceMemory (RAM)
 * - User agent parsing
 * - Connection speed
 * 
 * @example
 * ```tsx
 * const { shouldReduceAnimations, deviceType } = useDevicePerformance();
 * 
 * return (
 *   <motion.div
 *     animate={{ scale: shouldReduceAnimations ? 1 : [1, 1.05, 1] }}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function useDevicePerformance(): DevicePerformance {
  const [performance, setPerformance] = useState<DevicePerformance>({
    isHighPerformance: true,
    isLowPerformance: false,
    shouldReduceAnimations: false,
    deviceType: "unknown",
    cores: 1,
  });

  useEffect(() => {
    // Get number of CPU cores
    const cores = navigator.hardwareConcurrency || 1;

    // Get device memory (in GB) if available
    const memory = (navigator as any).deviceMemory;

    // Check connection speed
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;
    const saveData = connection?.saveData;

    // Estimate device performance
    let isHighPerformance = true;
    let isLowPerformance = false;
    let deviceType: "high-end" | "mid-range" | "low-end" | "unknown" = "unknown";

    // High-end device criteria
    if (cores >= 8 && (!memory || memory >= 8)) {
      isHighPerformance = true;
      isLowPerformance = false;
      deviceType = "high-end";
    }
    // Mid-range device criteria
    else if (cores >= 4 && (!memory || memory >= 4)) {
      isHighPerformance = false;
      isLowPerformance = false;
      deviceType = "mid-range";
    }
    // Low-end device criteria
    else {
      isHighPerformance = false;
      isLowPerformance = true;
      deviceType = "low-end";
    }

    // Reduce animations if:
    // - Low-end device
    // - Save data mode enabled
    // - Slow connection (2G or 3G)
    const shouldReduceAnimations =
      isLowPerformance ||
      saveData === true ||
      effectiveType === "slow-2g" ||
      effectiveType === "2g";

    setPerformance({
      isHighPerformance,
      isLowPerformance,
      shouldReduceAnimations,
      deviceType,
      cores,
      memory,
    });
  }, []);

  return performance;
}

/**
 * Get optimized animation config based on device performance
 * 
 * @param devicePerformance - Device performance object from useDevicePerformance hook
 * @returns Animation configuration object
 * 
 * @example
 * ```tsx
 * const devicePerformance = useDevicePerformance();
 * const animationConfig = getAnimationConfig(devicePerformance);
 * 
 * return (
 *   <motion.div
 *     animate={{ x: animationConfig.enableComplexAnimations ? [0, 100, 0] : 0 }}
 *     transition={{ duration: animationConfig.duration }}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function getAnimationConfig(devicePerformance: DevicePerformance) {
  const { isHighPerformance, shouldReduceAnimations } = devicePerformance;

  if (shouldReduceAnimations) {
    return {
      duration: 0.2,
      enableComplexAnimations: false,
      enableParticles: false,
      enableBlur: false,
      enableParallax: false,
      staggerDelay: 0,
    };
  }

  if (isHighPerformance) {
    return {
      duration: 0.6,
      enableComplexAnimations: true,
      enableParticles: true,
      enableBlur: true,
      enableParallax: true,
      staggerDelay: 0.1,
    };
  }

  // Mid-range device
  return {
    duration: 0.4,
    enableComplexAnimations: false,
    enableParticles: false,
    enableBlur: false,
    enableParallax: false,
    staggerDelay: 0.05,
  };
}

/**
 * Check if user prefers reduced motion
 * 
 * @returns boolean indicating if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get recommended image quality based on device and connection
 * 
 * @returns Image quality value (1-100)
 */
export function getOptimalImageQuality(): number {
  if (typeof window === "undefined") return 85;

  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;
  const saveData = connection?.saveData;

  // Reduce quality on slow connections or save data mode
  if (saveData === true) return 60;
  if (effectiveType === "slow-2g" || effectiveType === "2g") return 60;
  if (effectiveType === "3g") return 75;

  return 85;
}

/**
 * Get recommended number of visible items in carousels/lists
 * 
 * @param defaultCount - Default number of items
 * @returns Optimized number of items
 */
export function getOptimalVisibleItems(defaultCount: number): number {
  if (typeof window === "undefined") return defaultCount;

  const cores = navigator.hardwareConcurrency || 1;
  const memory = (navigator as any).deviceMemory;

  // Reduce items on low-end devices
  if (cores <= 2 || (memory && memory < 4)) {
    return Math.max(1, Math.floor(defaultCount * 0.5));
  }

  return defaultCount;
}
