"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

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

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5" ref={ref}>
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

        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-card rounded-2xl p-8 lg:p-12 shadow-2xl border border-border"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-4xl mb-6">
                  {testimonials[currentIndex].avatar}
                </div>

                <div className="flex mb-4">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                  ))}
                </div>

                <p className="text-lg text-muted-foreground mb-6 italic">
                  "{testimonials[currentIndex].content}"
                </p>

                <h4 className="text-xl font-semibold text-foreground">
                  {testimonials[currentIndex].name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {testimonials[currentIndex].role}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-12 h-12 bg-card hover:bg-primary hover:text-white rounded-full shadow-lg flex items-center justify-center transition-all border border-border"
          >
            ←
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 w-12 h-12 bg-card hover:bg-primary hover:text-white rounded-full shadow-lg flex items-center justify-center transition-all border border-border"
          >
            →
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
