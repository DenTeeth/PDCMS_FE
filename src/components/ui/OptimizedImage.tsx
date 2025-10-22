"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  /**
   * Show blur placeholder while loading
   * @default true
   */
  showPlaceholder?: boolean;

  /**
   * Custom placeholder color
   * @default "bg-muted"
   */
  placeholderClassName?: string;

  /**
   * Enable fade-in animation when loaded
   * @default true
   */
  animateOnLoad?: boolean;

  /**
   * Animation duration in seconds
   * @default 0.5
   */
  animationDuration?: number;
}

/**
 * Optimized Image component with lazy loading, blur placeholder, and smooth fade-in
 * 
 * Features:
 * - Automatic lazy loading for below-fold images
 * - Blur placeholder while loading
 * - Smooth fade-in animation
 * - Prevents layout shift
 * - Optimized for performance
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={800}
 *   height={600}
 *   priority={false}
 * />
 * ```
 */
export default function OptimizedImage({
  showPlaceholder = true,
  placeholderClassName = "bg-muted",
  animateOnLoad = true,
  animationDuration = 0.5,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  if (!animateOnLoad) {
    return (
      <div className="relative overflow-hidden">
        {showPlaceholder && !isLoaded && (
          <div className={`absolute inset-0 animate-pulse ${placeholderClassName}`} />
        )}
        <Image
          {...props}
          className={className}
          onLoad={handleLoad}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {showPlaceholder && !isLoaded && (
        <div className={`absolute inset-0 animate-pulse ${placeholderClassName}`} />
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: animationDuration, ease: "easeOut" }}
      >
        <Image
          {...props}
          className={className}
          onLoad={handleLoad}
        />
      </motion.div>
    </div>
  );
}
