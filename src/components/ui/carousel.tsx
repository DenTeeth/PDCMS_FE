"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  autoplay?: boolean;
  intervalMs?: number;
  pauseOnHover?: boolean;
}

interface CarouselContextValue {
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  count: number;
  perView: number;
  setCount: (n: number) => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

export function Carousel({
  className,
  children,
  autoplay = true,
  intervalMs = 3000,
  pauseOnHover = true,
  ...props
}: CarouselProps) {
  const [index, setIndex] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [perView, setPerView] = React.useState(3);
  const [paused, setPaused] = React.useState(false);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 640) setPerView(1);
      else if (width < 1024) setPerView(2);
      else setPerView(3);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, count - perView);

  React.useEffect(() => {
    if (!autoplay || paused) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, intervalMs);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [autoplay, paused, intervalMs, maxIndex]);

  return (
    <CarouselContext.Provider
      value={{ index, setIndex, count, perView, setCount }}
    >
      <div
        className={cn("relative", className)}
        onMouseEnter={pauseOnHover ? () => setPaused(true) : undefined}
        onMouseLeave={pauseOnHover ? () => setPaused(false) : undefined}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

export function CarouselContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(CarouselContext);
  const items = React.Children.toArray(children);

  React.useEffect(() => {
    if (!ctx) return;
    ctx.setCount(items.length);
  }, [items.length, ctx]);

  if (!ctx) return null;
  const { index, perView } = ctx;

  const translatePercent = (index * 100) / perView;

  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          "flex gap-8 transition-transform duration-500 ease-out",
          className
        )}
        style={{ transform: `translateX(-${translatePercent}%)` }}
        {...props}
      >
        {items}
      </div>
    </div>
  );
}

export function CarouselItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex-shrink-0 basis-full sm:basis-1/2 lg:basis-1/3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CarouselPrevious({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) return null;
  const { setIndex, count, perView } = ctx;
  const maxIndex = Math.max(0, count - perView);
  return (
    <button
      type="button"
      aria-label="Previous"
      onClick={() => setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))}
      className={cn(
        "h-10 w-10 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        className
      )}
      {...props}
    >
      ‹
    </button>
  );
}

export function CarouselNext({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) return null;
  const { setIndex, count, perView } = ctx;
  const maxIndex = Math.max(0, count - perView);
  return (
    <button
      type="button"
      aria-label="Next"
      onClick={() => setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))}
      className={cn(
        "h-10 w-10 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        className
      )}
      {...props}
    >
      ›
    </button>
  );
}
