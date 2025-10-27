"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: "�",
    title: "Personalized Treatment Plans",
    description: "Customized care tailored to your unique dental needs",
  },
  {
    icon: "🩺",
    title: "Gentle Care for Kids and Adults",
    description: "Compassionate approach for patients of all ages",
  },
  {
    icon: "🔬",
    title: "State-of-the-Art Technology",
    description: "Latest equipment for precise and comfortable treatment",
  },
  {
    icon: "📅",
    title: "Flexible Appointment Scheduling",
    description: "Convenient booking options to fit your busy lifestyle",
  },
];

export default function AboutSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-20 bg-background relative overflow-hidden" ref={ref}>
      {/* Blurred background images */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-96 opacity-20">
          <div className="grid grid-cols-2 gap-4 blur-2xl">
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary/40 to-secondary/40" />
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden mt-8">
              <div className="w-full h-full bg-gradient-to-br from-secondary/40 to-accent/40" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Images Grid */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative h-64 rounded-2xl overflow-hidden shadow-lg"
              >
                <Image
                  src="/images/dentist1.webp"
                  alt="Dental Professional"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative h-64 rounded-2xl overflow-hidden shadow-lg mt-8"
              >
                <Image
                  src="/images/dentist2.webp"
                  alt="Expert Dentist"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </motion.div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative h-48 rounded-2xl overflow-hidden shadow-lg"
              >
                <Image
                  src="/images/dentist3.webp"
                  alt="Dental Care Specialist"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative h-48 rounded-2xl overflow-hidden shadow-lg"
              >
                <Image
                  src="/images/dentist4.webp"
                  alt="Dental Expert"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Professional and Personalized
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
                Dental Excellence
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We provide high-quality dental care with a personal touch for you and your entire family. Our experienced team is dedicated to creating beautiful, healthy smiles in a comfortable environment.
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="#appointment"
                className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Book Appointment
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
