"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { memo } from "react";
import Hero from "@/img/Hero.jpg";

const HeroSection = memo(function HeroSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="relative min-h-screen flex items-center py-20 lg:py-32 overflow-hidden">
      {/* Full screen background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={Hero}
          alt="Dental Clinic Background"
          fill
          priority
          className="object-cover"
          quality={95}
        />
        {/* Lighter overlay to make image more visible */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-primary/65" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full" ref={ref}>
        <div className="flex items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-block px-6 py-3 bg-primary/10 backdrop-blur-sm text-primary rounded-full text-sm font-medium border border-primary/20">
                ✨ Introducing Dentia
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-tight"
            >
              Elevating Smiles with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary mt-3">
                Expert Care and a Gentle Touch
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto"
            >
              Family Dental Care - High-quality dental services with experienced team and modern technology.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link
                href="#appointment"
                className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl font-semibold text-base transform hover:scale-105"
              >
                📅 Book Appointment
              </Link>
              <Link
                href="#services"
                className="inline-block bg-white/90 backdrop-blur-sm border-2 border-primary/30 text-foreground px-10 py-4 rounded-lg hover:bg-white transition-all font-semibold text-base transform hover:scale-105 shadow-lg"
              >
                🔍 Our Services
              </Link>
            </motion.div>

            {/* Google Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white/80 backdrop-blur-md rounded-2xl px-8 py-5 shadow-xl border border-white/50 max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground text-lg">Google Rating</span>
                <span className="font-bold text-3xl text-foreground">5.0</span>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-medium">Based on 23k Reviews</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;