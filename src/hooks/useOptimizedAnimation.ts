import { useInView } from "react-intersection-observer";
import { useReducedMotion } from "framer-motion";

interface UseOptimizedAnimationOptions {
  /**
   * Trigger animation only once when element comes into view
   * @default true
   */
  triggerOnce?: boolean;

  /**
   * Percentage of element that must be visible to trigger animation
   * @default 0.1
   */
  threshold?: number;

  /**
   * Root margin for intersection observer (useful for triggering before element is visible)
   * @default "0px"
   */
  rootMargin?: string;

  /**
   * Disable animations on low-end devices or when user prefers reduced motion
   * @default true
   */
  respectReducedMotion?: boolean;
}

interface UseOptimizedAnimationReturn {
  /**
   * Ref to attach to the animated element
   */
  ref: (node?: Element | null) => void;

  /**
   * Whether the element is in view and animation should be active
   */
  isInView: boolean;

  /**
   * Whether animations should be enabled based on user preferences
   */
  shouldAnimate: boolean;

  /**
   * Variants optimized for performance
   */
  variants: {
    hidden: { opacity: number; y?: number };
    visible: { opacity: number; y?: number; transition: { duration: number; ease: string } };
  };
}

/**
 * Custom hook for optimized animations with intersection observer
 * 
 * Features:
 * - Respects user's reduced motion preference
 * - Only animates when element is in viewport
 * - Prevents unnecessary re-renders
 * - Provides performance-optimized animation variants
 * 
 * @example
 * ```tsx
 * const { ref, isInView, shouldAnimate, variants } = useOptimizedAnimation();
 * 
 * return (
 *   <motion.div
 *     ref={ref}
 *     initial="hidden"
 *     animate={isInView && shouldAnimate ? "visible" : "hidden"}
 *     variants={variants}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function useOptimizedAnimation(
  options: UseOptimizedAnimationOptions = {}
): UseOptimizedAnimationReturn {
  const {
    triggerOnce = true,
    threshold = 0.1,
    rootMargin = "0px",
    respectReducedMotion = true,
  } = options;

  const [ref, inView] = useInView({
    triggerOnce,
    threshold,
    rootMargin,
  });

  const prefersReducedMotion = useReducedMotion();

  const shouldAnimate = respectReducedMotion ? !prefersReducedMotion : true;

  const variants = {
    hidden: {
      opacity: 0,
      y: shouldAnimate ? 30 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut",
      },
    },
  };

  return {
    ref,
    isInView: inView,
    shouldAnimate,
    variants,
  };
}

/**
 * Variants for fade-in animation
 */
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

/**
 * Variants for slide-up animation
 */
export const slideUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

/**
 * Variants for slide-in from left
 */
export const slideInLeftVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

/**
 * Variants for slide-in from right
 */
export const slideInRightVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

/**
 * Variants for scale animation
 */
export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

/**
 * Variants for stagger children animation
 */
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Variants for stagger children items
 */
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};
