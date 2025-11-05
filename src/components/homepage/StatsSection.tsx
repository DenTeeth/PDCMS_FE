"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Stat {
  value: number;
  label: string;
  suffix: string;
}

function CountUpAnimation({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (!inView) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function StatsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const t = useTranslations('Stats');

  const stats: Stat[] = [
    { value: 10000, label: t('patients'), suffix: "+" },
    { value: 15, label: t('experience'), suffix: "+" },
    { value: 50, label: t('doctors'), suffix: "+" },
    { value: 5, label: t('rating'), suffix: "★" },
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-primary to-secondary" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                <CountUpAnimation end={stat.value} />
                {stat.suffix}
              </div>
              <div className="text-white/90 text-sm lg:text-base font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
