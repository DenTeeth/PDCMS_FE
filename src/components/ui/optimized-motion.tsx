"use client";

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load Framer Motion to reduce initial bundle size
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  {
    ssr: false, // Disable SSR for animations
    loading: () => <div />, // Fallback component
  }
);

const MotionSection = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.section })),
  {
    ssr: false,
    loading: () => <section />,
  }
);

// Optimized motion variants with reduced motion support
export const fadeUpVariants = {
  hidden: { 
    opacity: 0, 
    y: 24,
    transition: { duration: 0.2 }
  },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] // Custom easing
    }
  },
};

export const staggerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Optimized components with fallbacks
interface OptimizedMotionProps {
  variants?: any;
  initial?: string;
  animate?: string;
  whileInView?: string;
  viewport?: any;
  transition?: any;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function OptimizedMotionDiv({ 
  children, 
  variants,
  initial = "hidden",
  animate,
  whileInView = "show",
  viewport = { once: true, amount: 0.3 },
  transition,
  className,
  id
}: OptimizedMotionProps) {
  // Check for reduced motion preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return <div className={className} id={id}>{children}</div>;
  }

  return (
    <MotionDiv
      variants={variants}
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      viewport={viewport}
      transition={transition}
      className={className}
      id={id}
    >
      {children}
    </MotionDiv>
  );
}

export function OptimizedMotionSection({ 
  children, 
  variants,
  initial = "hidden",
  animate,
  whileInView = "show",
  viewport = { once: true, amount: 0.3 },
  transition,
  className,
  id
}: OptimizedMotionProps) {
  // Check for reduced motion preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return <section className={className} id={id}>{children}</section>;
  }

  return (
    <MotionSection
      variants={variants}
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      viewport={viewport}
      transition={transition}
      className={className}
      id={id}
    >
      {children}
    </MotionSection>
  );
}

// Hook to check reduced motion
export function useReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default OptimizedMotionDiv;
