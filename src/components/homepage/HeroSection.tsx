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
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 lg:py-32 overflow-hidden">
      {/* Optimized animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Introducing Dentia
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 leading-tight"
            >
              Elevating Smiles with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
                Expert Care and a Gentle Touch
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed"
            >
              Family Dental Care - High-quality dental services with experienced team and modern technology.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <Link
                href="#appointment"
                className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl font-medium text-center transform hover:scale-105"
              >
                Book Appointment
              </Link>
              <Link
                href="#services"
                className="inline-block border-2 border-primary/20 text-foreground px-8 py-4 rounded-lg hover:bg-accent/50 transition-all font-medium text-center transform hover:scale-105"
              >
                Our Services
              </Link>
            </motion.div>

            {/* Google Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Google Rating</span>
                <span className="font-bold text-2xl text-foreground">5.0</span>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Based on 23k Reviews</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <div className="relative aspect-[4/3]">
                <Image
                  src={Hero}
                  alt="Dental Clinic - Family Care"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  quality={85}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;