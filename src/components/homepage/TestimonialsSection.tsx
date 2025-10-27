"use client";

import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const testimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "Regular Patient",
    content: "The team at this clinic is absolutely amazing! They made me feel comfortable during my entire treatment. Highly recommend!",
    rating: 5,
    avatar: "👩",
  },
  {
    name: "Michael Chen",
    role: "Family Patient",
    content: "Best dental experience ever! The staff is professional, caring, and the facility is state-of-the-art. My whole family loves coming here.",
    rating: 5,
    avatar: "👨",
  },
  {
    name: "Emily Rodriguez",
    role: "Cosmetic Patient",
    content: "I'm so happy with my smile transformation! The results exceeded my expectations. Thank you for the wonderful care!",
    rating: 5,
    avatar: "👩‍🦰",
  },
  {
    name: "David Williams",
    role: "Implant Patient",
    content: "Professional service from start to finish. The implant procedure was smooth and painless. Couldn't be happier with the results!",
    rating: 5,
    avatar: "👨‍🦱",
  },
];

export default function TestimonialsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [[currentIndex, direction], setCurrentIndex] = useState([0, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const paginate = (newDirection: number) => {
    const newIndex = (currentIndex + newDirection + testimonials.length) % testimonials.length;
    setCurrentIndex([newIndex, newDirection]);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden" ref={ref}>
      {/* Curved Background Waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute bottom-0 left-0 w-full h-64 opacity-10"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="url(#gradient1)"
            fillOpacity="1"
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: "rgb(139, 92, 246)", stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: "rgb(236, 72, 153)", stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
        </svg>
        <svg
          className="absolute top-0 right-0 w-full h-64 opacity-10 transform rotate-180"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="url(#gradient2)"
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,170.7C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: "rgb(59, 130, 246)", stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: "rgb(139, 92, 246)", stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Our Happy Customers
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our patients are saying about us
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="relative min-h-[500px] flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{
                  x: direction > 0 ? "100%" : "-100%",
                }}
                animate={{
                  x: 0,
                }}
                exit={{
                  x: direction < 0 ? "100%" : "-100%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(e, { offset, velocity }: PanInfo) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }}
                className="absolute w-full max-w-4xl"
              >
                <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-8 lg:p-12 shadow-2xl border border-border/50 backdrop-blur-sm relative overflow-hidden">
                  {/* Decorative curved elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                  <div className="flex flex-col items-center text-center relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-24 h-24 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl border-4 border-white/20"
                    >
                      {testimonials[currentIndex].avatar}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex mb-6 gap-1"
                    >
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                          className="text-yellow-400 text-2xl"
                        >
                          ⭐
                        </motion.span>
                      ))}
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xl text-muted-foreground mb-8 italic max-w-2xl leading-relaxed"
                    >
                      "{testimonials[currentIndex].content}"
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h4 className="text-2xl font-bold text-foreground mb-2">
                        {testimonials[currentIndex].name}
                      </h4>
                      <p className="text-sm text-primary font-medium">
                        {testimonials[currentIndex].role}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 w-14 h-14 bg-gradient-to-br from-primary to-secondary hover:from-secondary hover:to-primary text-white rounded-full shadow-2xl flex items-center justify-center transition-all z-10 font-bold text-xl"
          >
            ←
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 w-14 h-14 bg-gradient-to-br from-primary to-secondary hover:from-secondary hover:to-primary text-white rounded-full shadow-2xl flex items-center justify-center transition-all z-10 font-bold text-xl"
          >
            →
          </motion.button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-3">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex([index, index > currentIndex ? 1 : -1])}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`rounded-full transition-all duration-300 ${index === currentIndex
                    ? "bg-gradient-to-r from-primary to-secondary w-12 h-4 shadow-lg"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-4 h-4"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
