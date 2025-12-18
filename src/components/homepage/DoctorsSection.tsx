"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useTranslations } from "next-intl";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  description: string;
  avatar: string;
}

export default function DoctorsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const t = useTranslations('Doctors');

  const doctors: Doctor[] = [0, 1, 2, 3].map(i => ({
    id: i + 1,
    name: t(`homeDoctors.${i}.name`),
    specialty: t(`homeDoctors.${i}.specialty`),
    experience: t(`homeDoctors.${i}.experience`),
    description: t(`homeDoctors.${i}.description`),
    avatar: `/images/dentist${i + 1}.webp`,
  }));

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
            {t('sectionTitle')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('sectionSubtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {doctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              <Link
                href={`/Doctors/${doctor.id}`}
                className="block"
              >
                <motion.div
                  whileHover={{
                    y: -8,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 10
                    }
                  }}
                  className="bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-border overflow-hidden cursor-pointer relative h-full flex flex-col"
                >
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out z-10" />

                  <div className="relative flex flex-col flex-grow">
                    <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                      <Image
                        src={doctor.avatar}
                        alt={doctor.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        quality={85}
                      />
                      {/* Medical cross badge */}
                      <div className="absolute top-4 right-4 w-16 h-16 flex items-center justify-center">
                        <Image
                          src="/denteeth-logo.png"
                          alt="DenTeeth Logo"
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                    </div>

                    <div className="p-6 text-center space-y-3 relative flex flex-col">
                      {/* Decorative line */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />

                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors pt-2">{doctor.name}</h3>
                      <p className="text-primary font-semibold text-sm bg-primary/10 rounded-full px-3 py-1 inline-block">
                        {doctor.specialty}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {doctor.experience}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed h-16 overflow-hidden">
                        {doctor.description}
                      </p>

                      {/* Specialization tags */}
                      <div className="flex flex-wrap gap-2 justify-center pt-2">
                        {doctor.id === 1 && (
                          <>
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Checkups</span>
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Cleanings</span>
                          </>
                        )}
                        {doctor.id === 2 && (
                          <>
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Whitening</span>
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Veneers</span>
                          </>
                        )}
                        {doctor.id === 3 && (
                          <>
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Braces</span>
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Invisalign</span>
                          </>
                        )}
                        {doctor.id === 4 && (
                          <>
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Kids Care</span>
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Prevention</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
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
              Xem toàn bộ bác sĩ
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
