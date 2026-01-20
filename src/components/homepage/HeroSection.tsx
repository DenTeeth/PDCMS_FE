"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { memo } from "react";
import { useTranslations } from 'next-intl';
import Hero from "@/img/Hero.jpg";

const HeroSection = memo(function HeroSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const t = useTranslations('Hero');

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
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground mb-6 leading-tight tracking-tight"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              {t('title')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary font-black">
                {t('subtitle')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto"
            >
              Chăm sóc răng miệng gia đình- Dịch vụ nha khoa chất lượng cao với đội ngũ giàu kinh nghiệm và công nghệ hiện đại.            </motion.p>

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
                {t('cta')}
              </Link>
              <Link
                href="#services"
                className="inline-block bg-white/90 backdrop-blur-sm border-2 border-primary/30 text-foreground px-10 py-4 rounded-lg hover:bg-white transition-all font-semibold text-base transform hover:scale-105 shadow-lg"
              >
                {t('secondaryCta')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;