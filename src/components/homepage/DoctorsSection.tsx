"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  description: string;
  avatar: string;
}

const doctors: Doctor[] = [
  {
    id: 1,
    name: "Dr. Sarah Bennett",
    specialty: "General Dentistry",
    experience: "15+ years of experience",
    description: "Leading specialist in general dentistry with extensive experience in comprehensive oral care.",
    avatar: "/images/doctors/doctor1.jpg", // Place your doctor images in public/images/doctors/
  },
  {
    id: 2,
    name: "Dr. Maya Lin",
    specialty: "Cosmetic Dentistry",
    experience: "12+ years of experience",
    description: "Expert in smile makeovers, veneers, and advanced cosmetic procedures.",
    avatar: "/images/doctors/doctor2.jpg",
  },
  {
    id: 3,
    name: "Dr. Michael Reyes",
    specialty: "Orthodontics",
    experience: "18+ years of experience",
    description: "Specialist in braces and aligners with cutting-edge orthodontic techniques.",
    avatar: "/images/doctors/doctor3.jpg",
  },
  {
    id: 4,
    name: "Dr. James Carter",
    specialty: "Pediatric Dentistry",
    experience: "10+ years of experience",
    description: "Gentle care specialist for children with a fun, compassionate approach.",
    avatar: "/images/doctors/doctor4.jpg",
  }
];

export default function DoctorsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-20 bg-background relative overflow-hidden" ref={ref}>
      {/* Blurred background images */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-96 opacity-15">
          <div className="grid grid-cols-2 gap-4 blur-3xl">
            <div className="relative h-48 rounded-2xl overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary/50 to-secondary/50" />
            </div>
            <div className="relative h-48 rounded-2xl overflow-hidden mt-8">
              <div className="w-full h-full bg-gradient-to-br from-secondary/50 to-accent/50" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Meet Our Dental Team
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Committed to Your Smile - Experienced professionals dedicated to your oral health
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {doctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-border overflow-hidden group"
            >
              <div className="relative">
                <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Image
                    src={doctor.avatar}
                    alt={doctor.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    quality={85}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-6 text-center space-y-3">
                <h3 className="text-lg font-bold text-foreground">{doctor.name}</h3>
                <p className="text-primary font-semibold text-sm">
                  {doctor.specialty}
                </p>
                <p className="text-xs text-muted-foreground font-medium">{doctor.experience}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {doctor.description}
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={`#appointment`}
                    className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm mt-2"
                  >
                    Book Appointment
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/Doctors"
              className="inline-flex items-center bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              View All Doctors
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
