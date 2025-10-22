"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState } from "react";

interface Service {
  icon: string;
  title: string;
  description: string;
}

const services: Service[] = [
  {
    icon: "🦷",
    title: "General Dentistry",
    description: "Comprehensive oral care including checkups, cleanings, and preventive treatments to maintain optimal dental health.",
  },
  {
    icon: "✨",
    title: "Cosmetic Dentistry",
    description: "Transform your smile with whitening, veneers, and other aesthetic procedures for a confident, beautiful appearance.",
  },
  {
    icon: "👶",
    title: "Pediatric Dentistry",
    description: "Specialized gentle care for children's dental health in a fun, comfortable environment that puts kids at ease.",
  },
  {
    icon: "🔧",
    title: "Restorative Dentistry",
    description: "Advanced solutions including crowns, bridges, and implants to restore function and appearance of damaged teeth.",
  }
];

export default function ServicesSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section id="services" className="py-20 bg-background" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Complete Care for Every Smile
          </h2>
          <p className="text-xl text-muted-foreground">
            Comprehensive dental services tailored to your needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-border relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl mb-6"
                >
                  {service.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">{service.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {service.description}
                </p>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all font-bold text-xl"
                >
                  +
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}