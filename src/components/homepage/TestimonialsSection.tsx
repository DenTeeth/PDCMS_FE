"use client";

import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

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

export default function TestimonialsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const t = useTranslations('Testimonials');
  const [[currentIndex, direction], setCurrentIndex] = useState([0, 0]);
  const [isHovered, setIsHovered] = useState(false);

  // Get testimonials from translations
  const testimonials: Testimonial[] = [0, 1, 2, 3].map(i => ({
    name: t(`cards.${i}.name`),
    role: t(`cards.${i}.role`),
    content: t(`cards.${i}.content`),
    rating: 5,
    avatar: t(`cards.${i}.avatar`),
  }));

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
    <section className="py-20 bg-gradient-to-br from-[#8b5fbf]/5 to-gray-50 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1e3a5f] mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('description')}
          </p>
        </motion.div>

        <div
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
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
                <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => paginate(-1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#8b5fbf] hover:bg-[#7a4eae] text-white rounded-full shadow-lg flex items-center justify-center transition-all z-20 font-bold text-xl"
                  >
                    ←
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => paginate(1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#8b5fbf] hover:bg-[#7a4eae] text-white rounded-full shadow-lg flex items-center justify-center transition-all z-20 font-bold text-xl"
                  >
                    →
                  </motion.button>

                  <div className="flex flex-col items-center text-center relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-24 h-24 bg-gradient-to-br from-[#8b5fbf] to-[#7a4eae] rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl border-4 border-white"
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
                      className="text-xl text-gray-600 mb-8 italic max-w-2xl leading-relaxed"
                    >
                      "{testimonials[currentIndex].content}"
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h4 className="text-2xl font-bold text-[#1e3a5f] mb-2">
                        {testimonials[currentIndex].name}
                      </h4>
                      <p className="text-sm text-[#8b5fbf] font-medium">
                        {testimonials[currentIndex].role}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center mt-8 space-x-3">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex([index, index > currentIndex ? 1 : -1])}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`rounded-full transition-all duration-300 ${index === currentIndex
                    ? "bg-[#8b5fbf] w-12 h-4 shadow-lg"
                    : "bg-gray-300 hover:bg-gray-400 w-4 h-4"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
